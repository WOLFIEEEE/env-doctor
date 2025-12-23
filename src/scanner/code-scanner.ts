import { parse } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import type { EnvUsage, Framework } from '../types/index.js';
import { findFiles } from '../utils/glob.js';
import { logger } from '../utils/logger.js';

export interface CodeScanOptions {
  /** Root directory */
  rootDir: string;
  /** Include patterns */
  include: string[];
  /** Exclude patterns */
  exclude: string[];
  /** Detected framework */
  framework: Framework | string;
}

export interface CodeScanResult {
  usages: EnvUsage[];
  errors: Array<{ file: string; message: string }>;
  filesScanned: number;
}

/**
 * Framework-specific prefixes for client-side env vars
 */
const CLIENT_PREFIXES: Record<string, string[]> = {
  nextjs: ['NEXT_PUBLIC_'],
  vite: ['VITE_'],
  cra: ['REACT_APP_'],
  node: [],
};

/**
 * Scan source files for process.env usage
 */
export async function scanCode(options: CodeScanOptions): Promise<CodeScanResult> {
  const { rootDir, include, exclude, framework } = options;

  const usages: EnvUsage[] = [];
  const errors: Array<{ file: string; message: string }> = [];

  // Find all source files
  const files = await findFiles({
    cwd: rootDir,
    include,
    exclude,
  });

  logger.debug(`Found ${files.length} files to scan`);

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8');
      const fileUsages = scanFileContent(content, file, rootDir, framework);
      usages.push(...fileUsages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      errors.push({ file: relative(rootDir, file), message });
      logger.debug(`Error scanning ${file}: ${message}`);
    }
  }

  return {
    usages,
    errors,
    filesScanned: files.length,
  };
}

/**
 * Scan a single file's content for env usage
 */
export function scanFileContent(
  content: string,
  filePath: string,
  rootDir: string,
  framework: Framework | string
): EnvUsage[] {
  const usages: EnvUsage[] = [];
  const relativePath = relative(rootDir, filePath);

  // Determine if this is likely a client-side file
  const isClientFile = isClientSideFile(filePath);

  // Get client prefixes for this framework
  const clientPrefixes = CLIENT_PREFIXES[framework] || [];

  try {
    const ast = parse(content, {
      jsx: true,
      loc: true,
      range: true,
      comment: false,
      errorOnUnknownASTType: false,
    });

    // Walk the AST
    walkAST(ast, (node) => {
      const usage = extractEnvUsage(node, relativePath, isClientFile, clientPrefixes, content);
      if (usage) {
        usages.push(usage);
      }
    });
  } catch {
    // If AST parsing fails, fall back to regex-based scanning
    logger.debug(`AST parsing failed for ${filePath}, using regex fallback`);
    usages.push(...scanWithRegex(content, relativePath, isClientFile, clientPrefixes));
  }

  return usages;
}

/**
 * Extract env usage from an AST node
 */
function extractEnvUsage(
  node: TSESTree.Node,
  file: string,
  isClientFile: boolean,
  clientPrefixes: string[],
  _content: string
): EnvUsage | null {
  // Pattern 1: process.env.VAR_NAME
  if (
    node.type === 'MemberExpression' &&
    isProcessEnv(node.object) &&
    node.property.type === 'Identifier'
  ) {
    const name = node.property.name;
    return {
      name,
      file,
      line: node.loc?.start.line ?? 0,
      column: node.loc?.start.column ?? 0,
      accessPattern: 'direct',
      isClientSide: isClientFile || isClientVariable(name, clientPrefixes),
      inferredType: inferTypeFromContext(node),
    };
  }

  // Pattern 2: process.env['VAR_NAME'] or process.env["VAR_NAME"]
  if (
    node.type === 'MemberExpression' &&
    isProcessEnv(node.object) &&
    node.computed &&
    node.property.type === 'Literal' &&
    typeof node.property.value === 'string'
  ) {
    const name = node.property.value;
    return {
      name,
      file,
      line: node.loc?.start.line ?? 0,
      column: node.loc?.start.column ?? 0,
      accessPattern: 'bracket',
      isClientSide: isClientFile || isClientVariable(name, clientPrefixes),
      inferredType: inferTypeFromContext(node),
    };
  }

  // Pattern 3: Destructuring - const { VAR } = process.env
  if (
    node.type === 'VariableDeclarator' &&
    node.id.type === 'ObjectPattern' &&
    node.init &&
    isProcessEnvNode(node.init)
  ) {
    const usages: EnvUsage[] = [];
    for (const prop of node.id.properties) {
      if (prop.type === 'Property' && prop.key.type === 'Identifier') {
        const name = prop.key.name;
        usages.push({
          name,
          file,
          line: prop.loc?.start.line ?? 0,
          column: prop.loc?.start.column ?? 0,
          accessPattern: 'destructure',
          isClientSide: isClientFile || isClientVariable(name, clientPrefixes),
        });
      }
    }
    // Return first usage (we'll handle this differently in the walk)
    return usages[0] || null;
  }

  // Pattern 4: Dynamic access - process.env[variable]
  if (
    node.type === 'MemberExpression' &&
    isProcessEnv(node.object) &&
    node.computed &&
    node.property.type !== 'Literal'
  ) {
    return {
      name: '<dynamic>',
      file,
      line: node.loc?.start.line ?? 0,
      column: node.loc?.start.column ?? 0,
      accessPattern: 'dynamic',
      isClientSide: isClientFile,
    };
  }

  // Pattern 5: import.meta.env.VAR (Vite)
  if (
    node.type === 'MemberExpression' &&
    isImportMetaEnv(node.object) &&
    node.property.type === 'Identifier'
  ) {
    const name = node.property.name;
    return {
      name,
      file,
      line: node.loc?.start.line ?? 0,
      column: node.loc?.start.column ?? 0,
      accessPattern: 'direct',
      isClientSide: true, // import.meta.env is always client-side in Vite
    };
  }

  return null;
}

/**
 * Check if a node is process.env
 */
function isProcessEnv(node: TSESTree.Node): boolean {
  return (
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'process' &&
    node.property.type === 'Identifier' &&
    node.property.name === 'env'
  );
}

/**
 * Check if a node is the process.env object
 */
function isProcessEnvNode(node: TSESTree.Node): boolean {
  return isProcessEnv(node as TSESTree.MemberExpression);
}

/**
 * Check if a node is import.meta.env
 */
function isImportMetaEnv(node: TSESTree.Node): boolean {
  return (
    node.type === 'MemberExpression' &&
    node.object.type === 'MetaProperty' &&
    node.object.meta.name === 'import' &&
    node.object.property.name === 'meta' &&
    node.property.type === 'Identifier' &&
    node.property.name === 'env'
  );
}

/**
 * Infer type from usage context
 */
function inferTypeFromContext(
  node: TSESTree.Node
): 'string' | 'number' | 'boolean' | 'json' | 'array' | undefined {
  // Check parent nodes for type hints
  const parent = (node as TSESTree.Node & { parent?: TSESTree.Node }).parent;
  if (!parent) return undefined;

  // parseInt(process.env.PORT) or Number(process.env.PORT)
  if (
    parent.type === 'CallExpression' &&
    parent.callee.type === 'Identifier' &&
    ['parseInt', 'parseFloat', 'Number'].includes(parent.callee.name)
  ) {
    return 'number';
  }

  // process.env.VAR === 'true' or Boolean(process.env.VAR)
  if (
    parent.type === 'BinaryExpression' &&
    parent.right.type === 'Literal' &&
    (parent.right.value === 'true' || parent.right.value === 'false')
  ) {
    return 'boolean';
  }

  // JSON.parse(process.env.VAR)
  if (
    parent.type === 'CallExpression' &&
    parent.callee.type === 'MemberExpression' &&
    parent.callee.object.type === 'Identifier' &&
    parent.callee.object.name === 'JSON' &&
    parent.callee.property.type === 'Identifier' &&
    parent.callee.property.name === 'parse'
  ) {
    return 'json';
  }

  // process.env.VAR.split(',')
  if (
    parent.type === 'MemberExpression' &&
    parent.property.type === 'Identifier' &&
    parent.property.name === 'split'
  ) {
    return 'array';
  }

  return undefined;
}

/**
 * Check if a variable is client-side based on prefix
 */
function isClientVariable(name: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => name.startsWith(prefix));
}

/**
 * Check if a file is likely client-side
 */
function isClientSideFile(filePath: string): boolean {
  const clientPatterns = [
    /\/components\//,
    /\/pages\//,
    /\/app\/.*page\.(tsx?|jsx?)$/,
    /\/hooks\//,
    /\.client\.(tsx?|jsx?)$/,
  ];

  return clientPatterns.some((pattern) => pattern.test(filePath));
}

/**
 * Walk AST and call visitor for each node
 */
function walkAST(node: TSESTree.Node, visitor: (node: TSESTree.Node) => void): void {
  visitor(node);

  for (const key of Object.keys(node)) {
    const value = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && 'type' in item) {
          walkAST(item as TSESTree.Node, visitor);
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      walkAST(value as TSESTree.Node, visitor);
    }
  }
}

/**
 * Fallback regex-based scanning
 */
function scanWithRegex(
  content: string,
  file: string,
  isClientFile: boolean,
  clientPrefixes: string[]
): EnvUsage[] {
  const usages: EnvUsage[] = [];
  const lines = content.split('\n');

  // Pattern for process.env.VAR_NAME
  const directPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;

  // Pattern for process.env['VAR_NAME'] or process.env["VAR_NAME"]
  const bracketPattern = /process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g;

  // Pattern for import.meta.env.VAR_NAME
  const vitePattern = /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Direct access
    let match;
    while ((match = directPattern.exec(line)) !== null) {
      usages.push({
        name: match[1],
        file,
        line: lineNumber,
        column: match.index,
        accessPattern: 'direct',
        isClientSide: isClientFile || isClientVariable(match[1], clientPrefixes),
      });
    }

    // Bracket access
    while ((match = bracketPattern.exec(line)) !== null) {
      usages.push({
        name: match[1],
        file,
        line: lineNumber,
        column: match.index,
        accessPattern: 'bracket',
        isClientSide: isClientFile || isClientVariable(match[1], clientPrefixes),
      });
    }

    // Vite access
    while ((match = vitePattern.exec(line)) !== null) {
      usages.push({
        name: match[1],
        file,
        line: lineNumber,
        column: match.index,
        accessPattern: 'direct',
        isClientSide: true,
      });
    }
  }

  return usages;
}

/**
 * Extract all unique variable names from usages
 */
export function getUniqueVariableNames(usages: EnvUsage[]): string[] {
  const names = new Set<string>();
  for (const usage of usages) {
    if (usage.name !== '<dynamic>') {
      names.add(usage.name);
    }
  }
  return Array.from(names);
}

