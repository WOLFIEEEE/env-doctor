/**
 * @fileoverview LSP Completion Provider for env-doctor
 * 
 * Provides intelligent autocompletion for environment variables
 * when typing process.env. or import.meta.env.
 */

import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  MarkupKind,
} from 'vscode-languageserver/node';

import type { EnvVariable } from '../types/index.js';

/**
 * Trigger characters for completion
 */
export const COMPLETION_TRIGGERS = ['.'];

/**
 * Patterns to detect env access contexts
 */
const ENV_PATTERNS = {
  processEnv: /process\.env\.(\w*)$/,
  importMetaEnv: /import\.meta\.env\.(\w*)$/,
  deconstructProcess: /const\s*\{[^}]*(\w*)$/,
  envBracket: /(?:process\.env|import\.meta\.env)\[['"](\w*)$/,
};

/**
 * Check if position is in an env access context
 */
export function isEnvContext(
  lineContent: string,
  character: number
): { type: 'dot' | 'bracket' | 'destruct'; prefix: string } | null {
  const beforeCursor = lineContent.slice(0, character);

  // Check for process.env. or import.meta.env.
  for (const [key, pattern] of Object.entries(ENV_PATTERNS)) {
    const match = beforeCursor.match(pattern);
    if (match) {
      return {
        type: key === 'envBracket' ? 'bracket' : key === 'deconstructProcess' ? 'destruct' : 'dot',
        prefix: match[1] || '',
      };
    }
  }

  return null;
}

/**
 * Create completion item for an environment variable
 */
export function createCompletionItem(
  variable: EnvVariable,
  description?: string,
  index: number = 0
): CompletionItem {
  const isSecret = variable.isSecret || isSecretVariable(variable.name);
  const displayValue = isSecret ? '••••••••' : truncateValue(variable.value, 30);

  const item: CompletionItem = {
    label: variable.name,
    kind: isSecret ? CompletionItemKind.Field : CompletionItemKind.Variable,
    detail: displayValue || '(empty)',
    sortText: String(index).padStart(5, '0'), // Preserve order
    insertText: variable.name,
    insertTextFormat: InsertTextFormat.PlainText,
  };

  // Build documentation markdown
  const docParts: string[] = [];

  // Value (if not secret)
  if (!isSecret && variable.value) {
    docParts.push(`**Value:** \`${variable.value}\``);
  } else if (isSecret) {
    docParts.push(`🔒 **Secret** - Value is hidden`);
  }

  // Type
  if (variable.inferredType) {
    docParts.push(`**Type:** ${variable.inferredType}`);
  }

  // Source
  docParts.push(`**Defined in:** ${formatFilePath(variable.file)}:${variable.line}`);

  // Description
  if (description) {
    docParts.push(`\n${description}`);
  }

  item.documentation = {
    kind: MarkupKind.Markdown,
    value: docParts.join('\n\n'),
  };

  return item;
}

/**
 * Create completion items from variables list
 */
export function createCompletionItems(
  variables: EnvVariable[],
  prefix: string,
  configDescriptions: Record<string, string | undefined>
): CompletionItem[] {
  const filtered = prefix
    ? variables.filter(v => v.name.toLowerCase().startsWith(prefix.toLowerCase()))
    : variables;

  return filtered.map((v, index) =>
    createCompletionItem(v, configDescriptions[v.name], index)
  );
}

/**
 * Create completion items for bracket notation
 */
export function createBracketCompletionItems(
  variables: EnvVariable[],
  prefix: string,
  configDescriptions: Record<string, string | undefined>
): CompletionItem[] {
  const filtered = prefix
    ? variables.filter(v => v.name.toLowerCase().startsWith(prefix.toLowerCase()))
    : variables;

  return filtered.map((v, index) => {
    const item = createCompletionItem(v, configDescriptions[v.name], index);
    // For bracket notation, include the closing bracket and quote
    item.insertText = `${v.name}']`;
    return item;
  });
}

/**
 * Create snippet completion for common env patterns
 */
export function createEnvSnippets(): CompletionItem[] {
  return [
    {
      label: 'env-require',
      kind: CompletionItemKind.Snippet,
      detail: 'Required environment variable with error',
      insertText: 'const ${1:VAR_NAME} = process.env.${1:VAR_NAME} ?? (() => { throw new Error("${1:VAR_NAME} is required"); })();',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Creates a required environment variable with an error thrown if not defined.',
      },
    },
    {
      label: 'env-default',
      kind: CompletionItemKind.Snippet,
      detail: 'Environment variable with default value',
      insertText: 'const ${1:VAR_NAME} = process.env.${1:VAR_NAME} ?? "${2:default}";',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Creates an environment variable with a fallback default value.',
      },
    },
    {
      label: 'env-number',
      kind: CompletionItemKind.Snippet,
      detail: 'Environment variable parsed as number',
      insertText: 'const ${1:VAR_NAME} = Number(process.env.${1:VAR_NAME}) || ${2:0};',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Creates an environment variable parsed as a number with a default.',
      },
    },
    {
      label: 'env-boolean',
      kind: CompletionItemKind.Snippet,
      detail: 'Environment variable parsed as boolean',
      insertText: 'const ${1:VAR_NAME} = process.env.${1:VAR_NAME} === "true";',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Creates an environment variable parsed as a boolean.',
      },
    },
  ];
}

/**
 * Resolve additional completion item details
 */
export function resolveCompletionItem(
  item: CompletionItem,
  variable: EnvVariable | undefined,
  usageCount: number
): CompletionItem {
  if (!variable) return item;

  // Add usage count to documentation
  if (item.documentation && typeof item.documentation === 'object') {
    const existingDoc = item.documentation.value;
    item.documentation.value = `${existingDoc}\n\n**Usages:** ${usageCount} references in codebase`;
  }

  return item;
}

// Helper functions

function isSecretVariable(name: string): boolean {
  const secretPatterns = [
    /secret/i,
    /password/i,
    /token/i,
    /key$/i,
    /api_key/i,
    /private/i,
    /credential/i,
  ];
  return secretPatterns.some(pattern => pattern.test(name));
}

function truncateValue(value: string, maxLength: number): string {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength - 3) + '...';
}

function formatFilePath(filePath: string): string {
  // Show just the filename and parent directory
  const parts = filePath.split('/');
  if (parts.length <= 2) return filePath;
  return `.../${parts.slice(-2).join('/')}`;
}

