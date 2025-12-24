/**
 * @fileoverview Types for multi-environment matrix validation
 */

import type { EnvVariable, Issue } from '../types/index.js';

/**
 * Status of a variable in an environment
 */
export type VariableStatus = 'set' | 'missing' | 'invalid' | 'empty';

/**
 * Information about a variable in a specific environment
 */
export interface EnvironmentVariableInfo {
  /** Status of the variable */
  status: VariableStatus;
  /** Value (if set) */
  value?: string;
  /** Source file */
  file?: string;
  /** Line number */
  line?: number;
  /** Whether the value is valid according to rules */
  valid: boolean;
  /** Validation error message (if invalid) */
  error?: string;
  /** Whether this is a secret value */
  isSecret?: boolean;
}

/**
 * A row in the matrix (one variable across all environments)
 */
export interface MatrixRow {
  /** Variable name */
  name: string;
  /** Status per environment */
  environments: Record<string, EnvironmentVariableInfo>;
  /** Overall status for this variable */
  status: 'ok' | 'error' | 'warning' | 'info';
  /** Issues detected for this variable */
  issues: MatrixIssue[];
}

/**
 * An issue specific to matrix validation
 */
export interface MatrixIssue {
  /** Type of issue */
  type: 'missing' | 'inconsistent' | 'invalid' | 'pattern_mismatch' | 'value_mismatch';
  /** Severity */
  severity: 'error' | 'warning' | 'info';
  /** Variable name */
  variable: string;
  /** Environment(s) affected */
  environments: string[];
  /** Human-readable message */
  message: string;
  /** Suggested fix */
  fix?: string;
}

/**
 * Complete matrix analysis result
 */
export interface MatrixResult {
  /** Version for compatibility */
  version: string;
  /** Timestamp of analysis */
  timestamp: string;
  /** Environments analyzed */
  environments: string[];
  /** Environment metadata */
  environmentInfo: Record<string, {
    description?: string;
    files: string[];
    variableCount: number;
  }>;
  /** The matrix data (variable -> environments) */
  matrix: Record<string, Record<string, EnvironmentVariableInfo>>;
  /** Processed rows with status */
  rows: MatrixRow[];
  /** All issues found */
  issues: MatrixIssue[];
  /** Summary statistics */
  summary: MatrixSummary;
}

/**
 * Summary of matrix analysis
 */
export interface MatrixSummary {
  /** Total unique variables */
  totalVariables: number;
  /** Variables consistent across all environments */
  consistentVariables: number;
  /** Variables with errors */
  errorCount: number;
  /** Variables with warnings */
  warningCount: number;
  /** Variables with info-level issues */
  infoCount: number;
  /** Per-environment variable counts */
  perEnvironment: Record<string, {
    total: number;
    missing: number;
    invalid: number;
  }>;
}

/**
 * Parsed environment data
 */
export interface ParsedEnvironment {
  /** Environment name */
  name: string;
  /** Description */
  description?: string;
  /** Files parsed */
  files: string[];
  /** Variables found */
  variables: EnvVariable[];
  /** Parsing errors */
  errors: string[];
}

