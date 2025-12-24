/**
 * @fileoverview LSP Hover Provider for env-doctor
 * 
 * Provides rich hover information for environment variables
 * including value, type, source, description, and usage count.
 */

import {
  Hover,
  MarkupContent,
  MarkupKind,
  Range,
} from 'vscode-languageserver/node';

import type { EnvVariable, EnvUsage } from '../types/index.js';
import type { EnvHoverData } from './types.js';

/**
 * Patterns to detect env variable at cursor position
 */
const ENV_VAR_PATTERNS = [
  /process\.env\.(\w+)/g,
  /import\.meta\.env\.(\w+)/g,
  /process\.env\[['"](\w+)['"]\]/g,
  /import\.meta\.env\[['"](\w+)['"]\]/g,
];

/**
 * Find environment variable name at cursor position
 */
export function findEnvVariableAtPosition(
  lineContent: string,
  character: number
): { name: string; start: number; end: number } | null {
  for (const pattern of ENV_VAR_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(lineContent)) !== null) {
      const fullMatch = match[0];
      const varName = match[1];
      const matchStart = match.index;

      // Find where the variable name starts within the match
      const nameStart = matchStart + fullMatch.indexOf(varName);
      const nameEnd = nameStart + varName.length;

      // Check if cursor is within the variable name
      if (character >= nameStart && character <= nameEnd) {
        return {
          name: varName,
          start: nameStart,
          end: nameEnd,
        };
      }
    }
  }

  return null;
}

/**
 * Build hover markdown content for an environment variable
 */
export function buildHoverContent(data: EnvHoverData): MarkupContent {
  const lines: string[] = [];

  // Header with variable name
  lines.push(`### 🌿 \`${data.name}\``);
  lines.push('');

  // Value section
  if (data.value === 'NOT DEFINED') {
    lines.push('⚠️ **Not Defined** - This variable is not set in any .env file');
  } else if (data.value === '••••••••' || isSecretVariable(data.name)) {
    lines.push('🔒 **Value:** `••••••••` *(secret)*');
  } else {
    lines.push(`**Value:** \`${data.value}\``);
  }
  lines.push('');

  // Type and required
  const metadata: string[] = [];
  if (data.type) {
    metadata.push(`**Type:** \`${data.type}\``);
  }
  if (data.required !== undefined) {
    metadata.push(`**Required:** ${data.required ? '✓ Yes' : '○ No'}`);
  }
  if (metadata.length > 0) {
    lines.push(metadata.join(' | '));
    lines.push('');
  }

  // Description
  if (data.description) {
    lines.push(`*${data.description}*`);
    lines.push('');
  }

  // Source
  if (data.file) {
    lines.push('---');
    lines.push(`📁 **Defined in:** \`${formatFilePath(data.file)}:${data.line}\``);
  }

  // Usages
  if (data.usedIn && data.usedIn.length > 0) {
    lines.push('');
    lines.push(`📊 **Used in ${data.usedIn.length} file${data.usedIn.length > 1 ? 's' : ''}:**`);
    
    const maxDisplay = 5;
    const displayUsages = data.usedIn.slice(0, maxDisplay);
    
    for (const usage of displayUsages) {
      lines.push(`- \`${formatFilePath(usage.file)}:${usage.line}\``);
    }
    
    if (data.usedIn.length > maxDisplay) {
      lines.push(`- *...and ${data.usedIn.length - maxDisplay} more*`);
    }
  }

  return {
    kind: MarkupKind.Markdown,
    value: lines.join('\n'),
  };
}

/**
 * Create a Hover response
 */
export function createHover(
  data: EnvHoverData,
  range: Range
): Hover {
  return {
    contents: buildHoverContent(data),
    range,
  };
}

/**
 * Create hover data from variable and usages
 */
export function createHoverData(
  varName: string,
  variable: EnvVariable | undefined,
  usages: EnvUsage[],
  configDescription?: string,
  configRequired?: boolean,
  configType?: string
): EnvHoverData {
  if (!variable) {
    return {
      name: varName,
      value: 'NOT DEFINED',
      file: '',
      line: 0,
      usedIn: usages.map(u => ({ file: u.file, line: u.line })),
    };
  }

  const isSecret = variable.isSecret || isSecretVariable(varName);

  return {
    name: varName,
    value: isSecret ? '••••••••' : variable.value,
    type: configType || variable.inferredType,
    required: configRequired,
    file: variable.file,
    line: variable.line,
    description: configDescription,
    usedIn: usages
      .filter(u => u.name === varName)
      .map(u => ({ file: u.file, line: u.line }))
      .slice(0, 10),
  };
}

/**
 * Create hover for .env file (show usage information)
 */
export function createEnvFileHover(
  varName: string,
  value: string,
  usages: EnvUsage[],
  configDescription?: string
): Hover {
  const lines: string[] = [];

  lines.push(`### 🌿 \`${varName}\``);
  lines.push('');
  
  if (isSecretVariable(varName)) {
    lines.push('🔒 **Value:** `••••••••` *(secret)*');
  } else {
    lines.push(`**Value:** \`${value}\``);
  }
  lines.push('');

  if (configDescription) {
    lines.push(`*${configDescription}*`);
    lines.push('');
  }

  // Show where this variable is used
  const varUsages = usages.filter(u => u.name === varName);
  if (varUsages.length > 0) {
    lines.push(`📊 **Used in ${varUsages.length} location${varUsages.length > 1 ? 's' : ''}:**`);
    
    const maxDisplay = 5;
    const displayUsages = varUsages.slice(0, maxDisplay);
    
    for (const usage of displayUsages) {
      lines.push(`- \`${formatFilePath(usage.file)}:${usage.line}\``);
    }
    
    if (varUsages.length > maxDisplay) {
      lines.push(`- *...and ${varUsages.length - maxDisplay} more*`);
    }
  } else {
    lines.push('⚠️ *This variable is not used in any code files*');
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: lines.join('\n'),
    },
  };
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
    /auth/i,
  ];
  return secretPatterns.some(pattern => pattern.test(name));
}

function formatFilePath(filePath: string): string {
  // Show just the filename and parent directory
  const parts = filePath.split('/');
  if (parts.length <= 2) return filePath;
  return `.../${parts.slice(-2).join('/')}`;
}

