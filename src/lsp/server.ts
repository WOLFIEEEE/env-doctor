/**
 * @fileoverview LSP Server implementation for env-doctor
 * 
 * This module provides Language Server Protocol support for real-time
 * environment variable validation in IDEs.
 */

import type { EnvDoctorConfig, EnvVariable, EnvUsage, Issue } from '../types/index.js';
import type { WorkspaceState, DocumentAnalysis, EnvCompletionData, EnvHoverData, SEVERITY_MAP, DIAGNOSTIC_CODES } from './types.js';
import { loadConfig } from '../config.js';
import { analyze } from '../core.js';
import { parseEnvFiles } from '../scanner/env-parser.js';
import { scanFileContent } from '../scanner/code-scanner.js';
import { logger } from '../utils/logger.js';

/**
 * LSP Server class
 * 
 * This is a simplified implementation that can be integrated with
 * vscode-languageserver when the extension is built.
 */
export class EnvDoctorServer {
  private state: WorkspaceState | null = null;
  private config: EnvDoctorConfig | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceMs = 300;

  /**
   * Initialize the server with a workspace
   */
  async initialize(rootUri: string): Promise<void> {
    logger.debug(`Initializing LSP server for ${rootUri}`);
    
    // Convert URI to path
    const rootPath = rootUri.replace('file://', '');

    // Load config
    const { config } = await loadConfig(undefined, rootPath);
    this.config = config;

    // Initialize state
    this.state = {
      rootUri,
      definedVariables: [],
      allUsages: new Map(),
      documentCache: new Map(),
      lastAnalysisTimestamp: 0,
    };

    // Run initial analysis
    await this.runFullAnalysis();
  }

  /**
   * Run a full analysis of the workspace
   */
  async runFullAnalysis(): Promise<void> {
    if (!this.state || !this.config) return;

    const rootPath = this.state.rootUri.replace('file://', '');
    const result = await analyze({ config: this.config });

    this.state.definedVariables = result.definedVariables;
    this.state.lastAnalysisTimestamp = Date.now();

    // Group usages by file
    this.state.allUsages.clear();
    for (const usage of result.usedVariables) {
      const fileUsages = this.state.allUsages.get(usage.file) || [];
      fileUsages.push(usage);
      this.state.allUsages.set(usage.file, fileUsages);
    }

    logger.debug(`Full analysis complete: ${result.definedVariables.length} vars, ${result.usedVariables.length} usages`);
  }

  /**
   * Analyze a single document
   */
  async analyzeDocument(uri: string, content: string, version: number): Promise<DocumentAnalysis> {
    if (!this.state || !this.config) {
      return { uri, version, usages: [], issues: [], timestamp: Date.now() };
    }

    // Check cache
    const cached = this.state.documentCache.get(uri);
    if (cached && cached.version === version) {
      return cached;
    }

    const rootPath = this.state.rootUri.replace('file://', '');
    const filePath = uri.replace('file://', '');

    // Scan file for usages
    const usages = scanFileContent(content, filePath, rootPath, this.config.framework);

    // Find issues for this file
    const issues = this.findIssuesForFile(usages);

    const analysis: DocumentAnalysis = {
      uri,
      version,
      usages,
      issues,
      timestamp: Date.now(),
    };

    // Update cache
    this.state.documentCache.set(uri, analysis);
    this.state.allUsages.set(filePath, usages);

    return analysis;
  }

  /**
   * Find issues for usages in a file
   */
  private findIssuesForFile(usages: EnvUsage[]): Issue[] {
    if (!this.state) return [];

    const issues: Issue[] = [];
    const definedNames = new Set(this.state.definedVariables.map(v => v.name));

    for (const usage of usages) {
      if (usage.name === '<dynamic>') continue;

      // Check if variable is defined
      if (!definedNames.has(usage.name)) {
        // Find similar variable names for suggestions
        const similar = this.findSimilarVariables(usage.name);
        
        issues.push({
          type: 'missing',
          severity: 'warning',
          variable: usage.name,
          message: `"${usage.name}" is not defined in any .env file`,
          location: {
            file: usage.file,
            line: usage.line,
            column: usage.column,
          },
          fix: similar.length > 0 
            ? `Did you mean "${similar[0]}"?`
            : `Add "${usage.name}" to your .env file`,
        });
      }
    }

    return issues;
  }

  /**
   * Find similar variable names (for typo suggestions)
   */
  private findSimilarVariables(name: string): string[] {
    if (!this.state) return [];

    const similar: Array<{ name: string; distance: number }> = [];

    for (const v of this.state.definedVariables) {
      const distance = levenshteinDistance(name.toLowerCase(), v.name.toLowerCase());
      if (distance <= 3) {
        similar.push({ name: v.name, distance });
      }
    }

    return similar
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(s => s.name);
  }

  /**
   * Get diagnostics for a document
   */
  getDiagnostics(uri: string): Array<{
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    severity: number;
    code: string;
    source: string;
    message: string;
  }> {
    const cached = this.state?.documentCache.get(uri);
    if (!cached) return [];

    return cached.issues.map(issue => ({
      range: {
        start: { line: (issue.location?.line || 1) - 1, character: issue.location?.column || 0 },
        end: { line: (issue.location?.line || 1) - 1, character: (issue.location?.column || 0) + issue.variable.length },
      },
      severity: issue.severity === 'error' ? 1 : issue.severity === 'warning' ? 2 : 3,
      code: `env-doctor/${issue.type}`,
      source: 'env-doctor',
      message: issue.message,
    }));
  }

  /**
   * Get completion items at a position
   */
  getCompletions(uri: string, line: number, character: number, content: string): EnvCompletionData[] {
    if (!this.state) return [];

    // Check if we're in a process.env context
    const lineContent = content.split('\n')[line] || '';
    const beforeCursor = lineContent.slice(0, character);

    // Look for process.env. or import.meta.env.
    const envMatch = beforeCursor.match(/(?:process\.env|import\.meta\.env)\.\s*(\w*)$/);
    if (!envMatch) return [];

    const prefix = envMatch[1].toLowerCase();

    return this.state.definedVariables
      .filter(v => v.name.toLowerCase().startsWith(prefix))
      .map(v => ({
        name: v.name,
        value: v.isSecret ? '****' : v.value,
        file: v.file,
        line: v.line,
        type: v.inferredType,
        isSecret: v.isSecret,
        description: this.config?.variables[v.name]?.description,
      }));
  }

  /**
   * Get hover information for a position
   */
  getHover(uri: string, line: number, character: number, content: string): EnvHoverData | null {
    if (!this.state) return null;

    const lineContent = content.split('\n')[line] || '';

    // Find the variable name at this position
    const envMatch = lineContent.match(/(?:process\.env|import\.meta\.env)\.(\w+)/g);
    if (!envMatch) return null;

    // Find the specific match at this position
    let varName: string | null = null;
    for (const match of envMatch) {
      const index = lineContent.indexOf(match);
      const nameStart = index + match.indexOf('.', match.indexOf('.') + 1) + 1;
      const nameEnd = nameStart + match.split('.').pop()!.length;

      if (character >= nameStart && character <= nameEnd) {
        varName = match.split('.').pop()!;
        break;
      }
    }

    if (!varName) return null;

    // Find the variable definition
    const variable = this.state.definedVariables.find(v => v.name === varName);
    if (!variable) {
      return {
        name: varName,
        value: 'NOT DEFINED',
        file: '',
        line: 0,
        usedIn: [],
      };
    }

    // Find usages
    const usedIn: Array<{ file: string; line: number }> = [];
    for (const [file, usages] of this.state.allUsages) {
      for (const usage of usages) {
        if (usage.name === varName) {
          usedIn.push({ file, line: usage.line });
        }
      }
    }

    const rule = this.config?.variables[varName];

    return {
      name: varName,
      value: variable.isSecret ? '****' : variable.value,
      type: variable.inferredType || rule?.type,
      required: rule?.required,
      file: variable.file,
      line: variable.line,
      description: rule?.description,
      usedIn: usedIn.slice(0, 10), // Limit to 10
    };
  }

  /**
   * Get definition location for a variable
   */
  getDefinition(varName: string): { uri: string; range: { start: { line: number; character: number }; end: { line: number; character: number } } } | null {
    if (!this.state) return null;

    const variable = this.state.definedVariables.find(v => v.name === varName);
    if (!variable) return null;

    return {
      uri: `file://${variable.file}`,
      range: {
        start: { line: variable.line - 1, character: 0 },
        end: { line: variable.line - 1, character: variable.name.length },
      },
    };
  }

  /**
   * Get all references to a variable
   */
  getReferences(varName: string): Array<{ uri: string; range: { start: { line: number; character: number }; end: { line: number; character: number } } }> {
    if (!this.state) return [];

    const refs: Array<{ uri: string; range: { start: { line: number; character: number }; end: { line: number; character: number } } }> = [];

    // Add definition location
    const def = this.getDefinition(varName);
    if (def) {
      refs.push(def);
    }

    // Add all usages
    for (const [file, usages] of this.state.allUsages) {
      for (const usage of usages) {
        if (usage.name === varName) {
          refs.push({
            uri: `file://${file}`,
            range: {
              start: { line: usage.line - 1, character: usage.column },
              end: { line: usage.line - 1, character: usage.column + varName.length },
            },
          });
        }
      }
    }

    return refs;
  }

  /**
   * Get code actions (quick fixes) for diagnostics
   */
  getCodeActions(uri: string, range: { start: { line: number }; end: { line: number } }, diagnostics: Array<{ code?: string; message: string }>): Array<{
    title: string;
    kind: string;
    diagnostics: typeof diagnostics;
    edit?: {
      changes: Record<string, Array<{ range: typeof range; newText: string }>>;
    };
    command?: {
      title: string;
      command: string;
      arguments?: unknown[];
    };
  }> {
    const actions: Array<{
      title: string;
      kind: string;
      diagnostics: typeof diagnostics;
      edit?: {
        changes: Record<string, Array<{ range: typeof range; newText: string }>>;
      };
      command?: {
        title: string;
        command: string;
        arguments?: unknown[];
      };
    }> = [];

    for (const diagnostic of diagnostics) {
      if (diagnostic.code === 'env-doctor/missing') {
        // Extract variable name from message
        const match = diagnostic.message.match(/"([^"]+)"/);
        if (match) {
          const varName = match[1];

          // Add to .env quick fix
          actions.push({
            title: `Add ${varName} to .env`,
            kind: 'quickfix',
            diagnostics: [diagnostic],
            command: {
              title: `Add ${varName} to .env`,
              command: 'env-doctor.addToEnv',
              arguments: [varName],
            },
          });

          // Check for similar names
          const similar = this.findSimilarVariables(varName);
          for (const suggestion of similar) {
            actions.push({
              title: `Change to ${suggestion}`,
              kind: 'quickfix',
              diagnostics: [diagnostic],
              edit: {
                changes: {
                  [uri]: [{
                    range,
                    newText: suggestion,
                  }],
                },
              },
            });
          }
        }
      }
    }

    return actions;
  }

  /**
   * Handle document change (debounced)
   */
  onDocumentChange(uri: string, content: string, version: number): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.analyzeDocument(uri, content, version);
    }, this.debounceMs);
  }

  /**
   * Handle env file change
   */
  async onEnvFileChange(): Promise<void> {
    // Invalidate cache and re-analyze
    if (this.state) {
      this.state.documentCache.clear();
    }
    await this.runFullAnalysis();
  }

  /**
   * Shutdown the server
   */
  shutdown(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.state = null;
    this.config = null;
  }
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Create and export a singleton server instance
 */
export function createServer(): EnvDoctorServer {
  return new EnvDoctorServer();
}

