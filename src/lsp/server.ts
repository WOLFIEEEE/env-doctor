/**
 * @fileoverview LSP Server implementation for env-doctor
 * 
 * This module provides Language Server Protocol support for real-time
 * environment variable validation in IDEs.
 */

import type { EnvDoctorConfig, EnvUsage, Issue } from '../types/index.js';
import type { WorkspaceState, DocumentAnalysis, EnvCompletionData, EnvHoverData } from './types.js';
import { loadConfig } from '../config.js';
import { analyze } from '../core.js';
import { scanFileContent } from '../scanner/code-scanner.js';
import { logger } from '../utils/logger.js';

// Import providers
import { debounce, issuesToDiagnostics } from './diagnostics.js';
import { isEnvContext, createCompletionItems, createEnvSnippets } from './completion.js';
import { findEnvVariableAtPosition, createHoverData } from './hover.js';
import { findDefinition, findReferences, isEnvFile, parseEnvFileLine, findUsagesOfEnvVariable } from './definition.js';
import { getCodeActionsForDiagnostic, getSourceActions, findSimilarVariables } from './actions.js';

/**
 * LSP Server class
 * 
 * This is a complete implementation that can be integrated with
 * vscode-languageserver when the extension is built.
 */
export class EnvDoctorServer {
  private state: WorkspaceState | null = null;
  private config: EnvDoctorConfig | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceMs = 300;

  // Debounced analysis function
  private debouncedAnalyze = debounce(
    (uri: string, content: string, version: number) => {
      this.analyzeDocument(uri, content, version);
    },
    this.debounceMs
  );

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
        const similar = findSimilarVariables(usage.name, this.state.definedVariables);
        
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

      // Check for secret exposure in client code
      if (this.isClientFile(usage.file) && this.isSecretVariable(usage.name)) {
        issues.push({
          type: 'secret-exposed',
          severity: 'error',
          variable: usage.name,
          message: `Secret "${usage.name}" may be exposed in client-side code`,
          location: {
            file: usage.file,
            line: usage.line,
            column: usage.column,
          },
          fix: 'Move this to server-side code or use a public variable',
        });
      }
    }

    return issues;
  }

  /**
   * Check if file is client-side
   */
  private isClientFile(filePath: string): boolean {
    const clientPatterns = [
      /\/pages\//,
      /\/components\//,
      /\/app\/.*\/page\.(tsx?|jsx?)$/,
      /\/src\/.*\.(tsx|jsx)$/,
    ];
    return clientPatterns.some(p => p.test(filePath));
  }

  /**
   * Check if variable is a secret
   */
  private isSecretVariable(name: string): boolean {
    const rule = this.config?.variables[name];
    if (rule?.secret) return true;

    const secretPatterns = [/secret/i, /password/i, /token/i, /key$/i, /private/i];
    return secretPatterns.some(p => p.test(name));
  }

  /**
   * Get diagnostics for a document
   */
  getDiagnostics(uri: string): ReturnType<typeof issuesToDiagnostics> {
    const cached = this.state?.documentCache.get(uri);
    if (!cached) return [];

    return issuesToDiagnostics(cached.issues);
  }

  /**
   * Get completion items at a position
   */
  getCompletions(uri: string, line: number, character: number, content: string): EnvCompletionData[] {
    if (!this.state) return [];

    // Check if we're in a process.env context
    const lineContent = content.split('\n')[line] || '';
    const context = isEnvContext(lineContent, character);

    if (!context) return [];

    // Get descriptions from config
    const descriptions: Record<string, string | undefined> = {};
    if (this.config?.variables) {
      for (const [name, rule] of Object.entries(this.config.variables)) {
        descriptions[name] = rule.description;
      }
    }

    return this.state.definedVariables
      .filter(v => v.name.toLowerCase().startsWith(context.prefix.toLowerCase()))
      .map(v => ({
        name: v.name,
        value: v.isSecret || this.isSecretVariable(v.name) ? '****' : v.value,
        file: v.file,
        line: v.line,
        type: v.inferredType,
        isSecret: v.isSecret,
        description: descriptions[v.name],
      }));
  }

  /**
   * Get completion items for LSP
   */
  getCompletionItems(uri: string, line: number, character: number, content: string) {
    if (!this.state) return [];

    const lineContent = content.split('\n')[line] || '';
    const context = isEnvContext(lineContent, character);

    if (!context) {
      // Return snippets if not in env context
      return createEnvSnippets();
    }

    const descriptions: Record<string, string | undefined> = {};
    if (this.config?.variables) {
      for (const [name, rule] of Object.entries(this.config.variables)) {
        descriptions[name] = rule.description;
      }
    }

    return createCompletionItems(this.state.definedVariables, context.prefix, descriptions);
  }

  /**
   * Get hover information for a position
   */
  getHover(uri: string, line: number, character: number, content: string): EnvHoverData | null {
    if (!this.state) return null;

    const lineContent = content.split('\n')[line] || '';

    // Check if this is an .env file
    if (isEnvFile(uri)) {
      const parsed = parseEnvFileLine(lineContent, line);
      if (parsed) {
        const allUsages: EnvUsage[] = [];
        for (const usages of this.state.allUsages.values()) {
          allUsages.push(...usages);
        }
        const varUsages = allUsages.filter(u => u.name === parsed.name);
        
        return {
          name: parsed.name,
          value: lineContent.split('=')[1] || '',
          file: uri,
          line: line + 1,
          usedIn: varUsages.map(u => ({ file: u.file, line: u.line })),
        };
      }
    }

    // Find the variable name at this position
    const found = findEnvVariableAtPosition(lineContent, character);
    if (!found) return null;

    // Find the variable definition
    const variable = this.state.definedVariables.find(v => v.name === found.name);
    
    // Get all usages
    const allUsages: EnvUsage[] = [];
    for (const usages of this.state.allUsages.values()) {
      allUsages.push(...usages);
    }

    const rule = this.config?.variables[found.name];

    return createHoverData(
      found.name,
      variable,
      allUsages,
      rule?.description,
      rule?.required,
      rule?.type
    );
  }

  /**
   * Get definition location for a variable
   */
  getDefinition(uri: string, line: number, character: number, content: string) {
    if (!this.state) return null;

    const lineContent = content.split('\n')[line] || '';

    // Check if clicking in .env file - go to usages
    if (isEnvFile(uri)) {
      const parsed = parseEnvFileLine(lineContent, line);
      if (parsed) {
        const usages = findUsagesOfEnvVariable(parsed.name, this.state.allUsages);
        return usages.length > 0 ? usages[0] : null;
      }
    }

    return findDefinition(lineContent, character, this.state.definedVariables);
  }

  /**
   * Get all references to a variable
   */
  getReferences(varName: string) {
    if (!this.state) return [];

    return findReferences(varName, this.state.definedVariables, this.state.allUsages, true);
  }

  /**
   * Get code actions (quick fixes) for diagnostics
   */
  getCodeActions(
    uri: string,
    _range: { start: { line: number }; end: { line: number } },
    diagnostics: Array<{ code?: string; message: string; range: { start: { line: number; character: number }; end: { line: number; character: number } } }>
  ) {
    if (!this.state) return [];

    const actions: ReturnType<typeof getCodeActionsForDiagnostic> = [];

    // Get the primary .env file path
    const envFilePath = this.config?.envFiles[0] || '.env';

    for (const diagnostic of diagnostics) {
      // Find similar variables for typo suggestions
      const varNameMatch = diagnostic.message.match(/"([^"]+)"/);
      const varName = varNameMatch ? varNameMatch[1] : '';
      
      const similar = varName
        ? findSimilarVariables(varName, this.state.definedVariables)
        : [];

      actions.push(
        ...getCodeActionsForDiagnostic(
          diagnostic,
          uri,
          envFilePath,
          similar
        )
      );
    }

    // Add source actions
    actions.push(...getSourceActions(uri));

    return actions;
  }

  /**
   * Handle document change (debounced)
   */
  onDocumentChange(uri: string, content: string, version: number): void {
    this.debouncedAnalyze(uri, content, version);
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
   * Get workspace state
   */
  getState(): WorkspaceState | null {
    return this.state;
  }

  /**
   * Get config
   */
  getConfig(): EnvDoctorConfig | null {
    return this.config;
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
 * Create and export a singleton server instance
 */
export function createServer(): EnvDoctorServer {
  return new EnvDoctorServer();
}
