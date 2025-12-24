/**
 * @fileoverview Types for workspace/monorepo support
 */

import type { AnalysisResult, EnvVariable, Framework } from '../types/index.js';

/**
 * Detected workspace type
 */
export type WorkspaceType = 'npm' | 'yarn' | 'pnpm' | 'turbo' | 'nx' | 'lerna' | 'none';

/**
 * Workspace detection result
 */
export interface WorkspaceDetectionResult {
  /** Type of workspace detected */
  type: WorkspaceType;
  /** Root directory of the workspace */
  rootDir: string;
  /** Patterns for finding packages */
  patterns: string[];
  /** Configuration file that was found */
  configFile?: string;
}

/**
 * Information about a single package in the workspace
 */
export interface PackageInfo {
  /** Package name from package.json */
  name: string;
  /** Path relative to workspace root */
  path: string;
  /** Absolute path to package */
  absolutePath: string;
  /** Detected framework */
  framework: Framework | 'auto';
  /** Whether this package has its own .env file */
  hasEnvFile: boolean;
  /** List of .env files found */
  envFiles: string[];
  /** Package.json contents */
  packageJson: {
    name: string;
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  /** Dependencies on other workspace packages */
  workspaceDependencies: string[];
}

/**
 * Analysis result for a single package
 */
export interface PackageAnalysisResult {
  /** Package information */
  package: PackageInfo;
  /** Analysis result from env-doctor */
  analysis: AnalysisResult;
  /** Variables inherited from root */
  inheritedVariables: EnvVariable[];
  /** Variables local to this package */
  localVariables: EnvVariable[];
}

/**
 * Overall workspace analysis result
 */
export interface WorkspaceAnalysisResult {
  /** Workspace detection info */
  workspace: WorkspaceDetectionResult;
  /** Root-level env variables */
  rootVariables: EnvVariable[];
  /** Per-package results */
  packages: PackageAnalysisResult[];
  /** Variables shared across multiple packages */
  sharedVariables: SharedVariable[];
  /** Conflicts detected */
  conflicts: VariableConflict[];
  /** Overall statistics */
  stats: WorkspaceStats;
}

/**
 * A variable used across multiple packages
 */
export interface SharedVariable {
  /** Variable name */
  name: string;
  /** Source (root or first package that defines it) */
  source: string;
  /** Packages that use this variable */
  usedBy: string[];
  /** Value (from root or first definition) */
  value?: string;
}

/**
 * A conflict where the same variable has different values
 */
export interface VariableConflict {
  /** Variable name */
  name: string;
  /** Conflicting definitions */
  definitions: Array<{
    /** Package name or 'root' */
    package: string;
    /** File where defined */
    file: string;
    /** Value */
    value: string;
  }>;
  /** Whether this conflict is allowed by config */
  isAllowed: boolean;
  /** Severity of the conflict */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Workspace statistics
 */
export interface WorkspaceStats {
  /** Total packages scanned */
  totalPackages: number;
  /** Packages with issues */
  packagesWithIssues: number;
  /** Total unique variables */
  totalVariables: number;
  /** Shared variables count */
  sharedVariablesCount: number;
  /** Conflicts count */
  conflictsCount: number;
  /** Total issues across all packages */
  totalIssues: number;
  /** Total errors */
  totalErrors: number;
  /** Total warnings */
  totalWarnings: number;
  /** Duration in ms */
  duration: number;
}

/**
 * Cross-package dependency
 */
export interface CrossPackageDependency {
  /** Source package */
  from: string;
  /** Target package */
  to: string;
  /** Variables required by this dependency */
  requiredVariables: string[];
}

