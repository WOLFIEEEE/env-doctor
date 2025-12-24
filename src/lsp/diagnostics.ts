/**
 * @fileoverview LSP Diagnostics Provider for env-doctor
 * 
 * Provides real-time diagnostics for environment variable issues
 * including missing, unused, and type-mismatched variables.
 */

import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
  Position,
} from 'vscode-languageserver/node';

import type { Issue } from '../types/index.js';
import { DIAGNOSTIC_CODES } from './types.js';

/**
 * Debounce utility for delaying analysis
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Map issue severity to LSP DiagnosticSeverity
 */
export function mapSeverity(severity: Issue['severity']): DiagnosticSeverity {
  switch (severity) {
    case 'error':
      return DiagnosticSeverity.Error;
    case 'warning':
      return DiagnosticSeverity.Warning;
    case 'info':
      return DiagnosticSeverity.Information;
    default:
      return DiagnosticSeverity.Hint;
  }
}

/**
 * Get diagnostic code for issue type
 */
export function getDiagnosticCode(issueType: Issue['type']): string {
  switch (issueType) {
    case 'missing':
      return DIAGNOSTIC_CODES.MISSING_VARIABLE;
    case 'unused':
      return DIAGNOSTIC_CODES.UNUSED_VARIABLE;
    case 'type-mismatch':
      return DIAGNOSTIC_CODES.TYPE_MISMATCH;
    case 'secret-exposed':
      return DIAGNOSTIC_CODES.SECRET_EXPOSED;
    default:
      return `env-doctor/${issueType}`;
  }
}

/**
 * Convert an Issue to an LSP Diagnostic
 */
export function issueToDiagnostic(issue: Issue): Diagnostic {
  const line = (issue.location?.line || 1) - 1; // LSP uses 0-based lines
  const column = issue.location?.column || 0;
  const varLength = issue.variable?.length || 1;

  const range: Range = {
    start: Position.create(line, column),
    end: Position.create(line, column + varLength),
  };

  const diagnostic: Diagnostic = {
    range,
    severity: mapSeverity(issue.severity),
    code: getDiagnosticCode(issue.type),
    source: 'env-doctor',
    message: issue.message,
  };

  // Add related information if available
  if (issue.fix) {
    diagnostic.message += `\n💡 ${issue.fix}`;
  }

  return diagnostic;
}

/**
 * Convert multiple Issues to LSP Diagnostics
 */
export function issuesToDiagnostics(issues: Issue[]): Diagnostic[] {
  return issues.map(issueToDiagnostic);
}

/**
 * Filter diagnostics by file URI
 */
export function filterDiagnosticsByUri(
  issues: Issue[],
  uri: string
): Diagnostic[] {
  const filePath = uri.replace('file://', '');
  
  return issues
    .filter(issue => {
      const issueFile = issue.location?.file || '';
      return issueFile === filePath || issueFile.endsWith(filePath.split('/').pop() || '');
    })
    .map(issueToDiagnostic);
}

/**
 * Create a diagnostic for a missing variable
 */
export function createMissingVariableDiagnostic(
  varName: string,
  line: number,
  column: number,
  suggestion?: string
): Diagnostic {
  const range: Range = {
    start: Position.create(line, column),
    end: Position.create(line, column + varName.length),
  };

  let message = `Environment variable "${varName}" is not defined in any .env file`;
  if (suggestion) {
    message += `\n💡 Did you mean "${suggestion}"?`;
  } else {
    message += `\n💡 Add "${varName}" to your .env file`;
  }

  return {
    range,
    severity: DiagnosticSeverity.Warning,
    code: DIAGNOSTIC_CODES.MISSING_VARIABLE,
    source: 'env-doctor',
    message,
  };
}

/**
 * Create a diagnostic for an unused variable
 */
export function createUnusedVariableDiagnostic(
  varName: string,
  line: number,
  _file: string
): Diagnostic {
  const range: Range = {
    start: Position.create(line - 1, 0),
    end: Position.create(line - 1, varName.length + 1),
  };

  return {
    range,
    severity: DiagnosticSeverity.Hint,
    code: DIAGNOSTIC_CODES.UNUSED_VARIABLE,
    source: 'env-doctor',
    message: `Environment variable "${varName}" is defined but never used in code`,
  };
}

/**
 * Create a diagnostic for a secret potentially exposed
 */
export function createSecretExposedDiagnostic(
  varName: string,
  line: number,
  column: number,
  context: string
): Diagnostic {
  const range: Range = {
    start: Position.create(line, column),
    end: Position.create(line, column + varName.length),
  };

  return {
    range,
    severity: DiagnosticSeverity.Error,
    code: DIAGNOSTIC_CODES.SECRET_EXPOSED,
    source: 'env-doctor',
    message: `Secret "${varName}" may be exposed in ${context}. This variable is marked as a secret and should not be accessed in client-side code.`,
  };
}

/**
 * Create a diagnostic for type mismatch
 */
export function createTypeMismatchDiagnostic(
  varName: string,
  line: number,
  column: number,
  expectedType: string,
  actualValue: string
): Diagnostic {
  const range: Range = {
    start: Position.create(line, column),
    end: Position.create(line, column + varName.length),
  };

  return {
    range,
    severity: DiagnosticSeverity.Error,
    code: DIAGNOSTIC_CODES.TYPE_MISMATCH,
    source: 'env-doctor',
    message: `Environment variable "${varName}" should be of type "${expectedType}" but has value "${actualValue}"`,
  };
}

