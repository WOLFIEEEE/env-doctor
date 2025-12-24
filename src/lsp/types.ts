/**
 * @fileoverview Types for LSP server
 */

import type { EnvVariable, EnvUsage, Issue } from '../types/index.js';

/**
 * Document analysis result (cached per file)
 */
export interface DocumentAnalysis {
  /** URI of the document */
  uri: string;
  /** Version of the document when analyzed */
  version: number;
  /** Environment variable usages found */
  usages: EnvUsage[];
  /** Issues detected */
  issues: Issue[];
  /** Timestamp of analysis */
  timestamp: number;
}

/**
 * Workspace state
 */
export interface WorkspaceState {
  /** Root URI of the workspace */
  rootUri: string;
  /** All defined environment variables */
  definedVariables: EnvVariable[];
  /** All usages across files */
  allUsages: Map<string, EnvUsage[]>;
  /** Cached document analyses */
  documentCache: Map<string, DocumentAnalysis>;
  /** Last full analysis timestamp */
  lastAnalysisTimestamp: number;
}

/**
 * Completion item data
 */
export interface EnvCompletionData {
  /** Variable name */
  name: string;
  /** Variable value (redacted if secret) */
  value: string;
  /** Source file */
  file: string;
  /** Line number */
  line: number;
  /** Type if known */
  type?: string;
  /** Whether this is a secret */
  isSecret?: boolean;
  /** Description from config */
  description?: string;
}

/**
 * Hover information
 */
export interface EnvHoverData {
  /** Variable name */
  name: string;
  /** Variable value (redacted if secret) */
  value: string;
  /** Type if known */
  type?: string;
  /** Whether this is required */
  required?: boolean;
  /** Source file */
  file: string;
  /** Line number */
  line: number;
  /** Description */
  description?: string;
  /** Files where this variable is used */
  usedIn: Array<{ file: string; line: number }>;
}

/**
 * Diagnostic severity mapping
 */
export const SEVERITY_MAP = {
  error: 1,
  warning: 2,
  info: 3,
  hint: 4,
} as const;

/**
 * Diagnostic codes
 */
export const DIAGNOSTIC_CODES = {
  MISSING_VARIABLE: 'env-doctor/missing',
  UNUSED_VARIABLE: 'env-doctor/unused',
  SECRET_EXPOSED: 'env-doctor/secret-exposed',
  TYPE_MISMATCH: 'env-doctor/type-mismatch',
  SYNC_DRIFT: 'env-doctor/sync-drift',
} as const;

