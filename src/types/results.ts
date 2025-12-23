/**
 * Severity levels for issues
 */
export type Severity = 'error' | 'warning' | 'info';

/**
 * Types of issues that can be detected
 */
export type IssueType =
  | 'missing'
  | 'unused'
  | 'type-mismatch'
  | 'sync-drift'
  | 'secret-exposed'
  | 'invalid-value'
  | 'dynamic-access';

/**
 * Location in source code
 */
export interface SourceLocation {
  file: string;
  line: number;
  column?: number;
}

/**
 * A single detected issue
 */
export interface Issue {
  /** Type of the issue */
  type: IssueType;
  /** Severity level */
  severity: Severity;
  /** Name of the environment variable */
  variable: string;
  /** Human-readable message */
  message: string;
  /** Location in source code (if applicable) */
  location?: SourceLocation;
  /** Suggested fix (if available) */
  fix?: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Parsed environment variable from .env file
 */
export interface EnvVariable {
  /** Variable name */
  name: string;
  /** Variable value (may be empty) */
  value: string;
  /** Line number in the file */
  line: number;
  /** Source file path */
  file: string;
  /** Whether the value appears to be a secret */
  isSecret?: boolean;
  /** Inferred type from usage */
  inferredType?: 'string' | 'number' | 'boolean' | 'json' | 'array';
  /** Raw line content */
  raw?: string;
}

/**
 * Environment variable usage found in code
 */
export interface EnvUsage {
  /** Variable name */
  name: string;
  /** File where it's used */
  file: string;
  /** Line number */
  line: number;
  /** Column number */
  column: number;
  /** Access pattern (direct, bracket, destructure) */
  accessPattern: 'direct' | 'bracket' | 'destructure' | 'dynamic';
  /** Inferred type from usage context */
  inferredType?: 'string' | 'number' | 'boolean' | 'json' | 'array';
  /** Code snippet for context */
  snippet?: string;
  /** Whether this is a client-side access (framework specific) */
  isClientSide?: boolean;
}

/**
 * Result of scanning git history
 */
export interface GitScanResult {
  /** Commit hash where secret was found */
  commit: string;
  /** Author of the commit */
  author: string;
  /** Commit date */
  date: string;
  /** File path */
  file: string;
  /** Line number */
  line: number;
  /** Variable name */
  variable: string;
  /** Partial value (redacted) */
  redactedValue: string;
}

/**
 * Overall analysis result
 */
export interface AnalysisResult {
  /** All detected issues */
  issues: Issue[];
  /** Environment variables defined in .env files */
  definedVariables: EnvVariable[];
  /** Environment variables used in code */
  usedVariables: EnvUsage[];
  /** Template variables from .env.example */
  templateVariables?: EnvVariable[];
  /** Detected framework */
  framework: string;
  /** Scan statistics */
  stats: ScanStats;
}

/**
 * Scan statistics
 */
export interface ScanStats {
  /** Number of files scanned */
  filesScanned: number;
  /** Number of env files parsed */
  envFilesParsed: number;
  /** Time taken in milliseconds */
  duration: number;
  /** Number of errors */
  errorCount: number;
  /** Number of warnings */
  warningCount: number;
  /** Number of info messages */
  infoCount: number;
}

/**
 * SARIF output format for GitHub code scanning
 */
export interface SARIFOutput {
  $schema: string;
  version: string;
  runs: SARIFRun[];
}

export interface SARIFRun {
  tool: {
    driver: {
      name: string;
      version: string;
      informationUri: string;
      rules: SARIFRule[];
    };
  };
  results: SARIFResult[];
}

export interface SARIFRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  fullDescription: { text: string };
  defaultConfiguration: { level: 'error' | 'warning' | 'note' };
  helpUri?: string;
}

export interface SARIFResult {
  ruleId: string;
  level: 'error' | 'warning' | 'note';
  message: { text: string };
  locations: Array<{
    physicalLocation: {
      artifactLocation: { uri: string };
      region: { startLine: number; startColumn?: number };
    };
  }>;
}

