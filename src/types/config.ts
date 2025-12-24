import { z } from 'zod';

/**
 * Supported frameworks for environment variable patterns
 */
export type Framework = 'auto' | 'nextjs' | 'vite' | 'cra' | 'node';

/**
 * Variable type for validation
 */
export type VariableType = 'string' | 'number' | 'boolean' | 'json' | 'url' | 'email' | 'array';

/**
 * Rule for a specific environment variable
 */
export interface VariableRule {
  /** Whether this variable is required */
  required?: boolean;
  /** Whether this variable contains a secret */
  secret?: boolean;
  /** Expected type of the variable */
  type?: VariableType;
  /** Regex pattern the value must match */
  pattern?: RegExp;
  /** Default value if not provided */
  default?: string | number | boolean;
  /** Allowed values (enum) */
  enum?: string[];
  /** Description for documentation */
  description?: string;
  /** Documentation URL */
  docsUrl?: string;
  /** Environment-specific overrides */
  environments?: Record<string, Partial<VariableRule> & {
    /** Enforced value */
    mustBe?: string | number | boolean;
    /** Custom error message */
    message?: string;
  }>;
}

/**
 * Configuration for a specific environment (development, staging, production)
 */
export interface EnvironmentConfig {
  /** Env files to use for this environment */
  envFiles: string[];
  /** Description of this environment */
  description?: string;
  /** Whether to enforce strict mode for this environment */
  strict?: boolean;
}

/**
 * Configuration for sync operations
 */
export interface SyncConfig {
  /** Sources to include in template generation */
  sources?: {
    fromCode?: boolean;
    fromEnv?: boolean;
    fromConfig?: boolean;
  };
  /** How to group variables */
  groupBy?: 'category' | 'prefix' | 'file' | 'none';
  /** Custom category definitions (name -> patterns[]) */
  categories?: Record<string, string[]>;
  /** What metadata to include */
  include?: {
    types?: boolean;
    defaults?: boolean;
    examples?: boolean;
    descriptions?: boolean;
    secretWarnings?: boolean;
    docsLinks?: boolean;
    required?: boolean;
  };
  /** How to handle values */
  values?: {
    secrets?: 'empty' | 'placeholder' | 'redacted';
    nonSecrets?: 'empty' | 'default' | 'example';
  };
  /** Formatting options */
  format?: {
    headerComment?: boolean;
    sectionDividers?: boolean;
    blankLinesBetweenGroups?: boolean;
    alignEquals?: boolean;
    maxLineLength?: number;
  };
  /** What to preserve from existing template */
  preserve?: {
    customComments?: boolean;
    customVariables?: boolean;
    ordering?: 'smart' | 'strict' | 'none';
  };
}

/**
 * Configuration for matrix validation
 */
export interface MatrixConfig {
  /** How to handle variables in one env but not others */
  requireConsistency?: 'error' | 'warn' | 'off';
  /** Variables to exclude from matrix comparison */
  excludeFromMatrix?: string[];
  /** Custom validation functions */
  validators?: Record<string, (variable: VariableRule, value: string, env: string) => { valid: boolean; message?: string }>;
}

/**
 * Package-specific configuration for workspaces
 */
export interface PackageConfig {
  /** Framework for this package */
  framework?: Framework;
  /** Env files for this package */
  envFiles?: string[];
  /** Whether to inherit from root */
  inheritFromRoot?: boolean;
  /** Mode for this package */
  mode?: 'app' | 'library';
  /** Expected variables for libraries */
  expectedVariables?: string[];
}

/**
 * Configuration for monorepo/workspace support
 */
export interface WorkspaceConfig {
  /** Glob patterns for workspace packages */
  patterns?: string[];
  /** Root env files that are inherited by all packages */
  rootEnvFiles?: string[];
  /** How variables are inherited */
  inheritance?: 'cascade' | 'explicit' | 'none';
  /** Package-specific overrides */
  packages?: Record<string, PackageConfig>;
}

/**
 * Configuration for conflict handling in workspaces
 */
export interface ConflictsConfig {
  /** How to handle same variable with different values */
  mode?: 'error' | 'warn' | 'allow';
  /** Variables that are expected to differ */
  allowDifferent?: string[];
}

/**
 * Configuration for cross-package dependency tracking
 */
export interface DependenciesConfig {
  /** Analyze imports to detect env var dependencies */
  trackImports?: boolean;
  /** Warn if package uses variable but doesn't have access */
  warnMissing?: boolean;
}

/**
 * Main configuration for env-doctor
 */
export interface EnvDoctorConfig {
  /** Environment files to check (default: ['.env']) */
  envFiles: string[];
  /** Template file to compare against (e.g., '.env.example') */
  templateFile?: string;
  /** Glob patterns for files to scan */
  include: string[];
  /** Glob patterns for files to exclude */
  exclude: string[];
  /** Framework for env var patterns (default: 'auto') */
  framework: Framework;
  /** Variable-specific rules */
  variables: Record<string, VariableRule>;
  /** Patterns or rules to ignore */
  ignore: string[];
  /** Strict mode - treat warnings as errors */
  strict?: boolean;
  /** Custom secret detection patterns */
  secretPatterns?: RegExp[];
  /** Root directory to scan (default: process.cwd()) */
  root?: string;
  
  // === New configuration options ===
  
  /** Multi-environment definitions */
  environments?: Record<string, EnvironmentConfig>;
  /** Default environment for single-env commands */
  defaultEnvironment?: string;
  /** Sync configuration for .env.example generation */
  sync?: SyncConfig;
  /** Matrix validation configuration */
  matrix?: MatrixConfig;
  /** Workspace/monorepo configuration */
  workspaces?: WorkspaceConfig;
  /** Conflict handling configuration */
  conflicts?: ConflictsConfig;
  /** Cross-package dependency tracking */
  dependencies?: DependenciesConfig;
}

/**
 * Zod schema for VariableRule
 */
export const VariableRuleSchema = z.object({
  required: z.boolean().optional(),
  secret: z.boolean().optional(),
  type: z.enum(['string', 'number', 'boolean', 'json', 'url', 'email', 'array']).optional(),
  pattern: z.instanceof(RegExp).optional(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  enum: z.array(z.string()).optional(),
  description: z.string().optional(),
  docsUrl: z.string().optional(),
  environments: z.record(z.string(), z.object({
    required: z.boolean().optional(),
    secret: z.boolean().optional(),
    type: z.enum(['string', 'number', 'boolean', 'json', 'url', 'email', 'array']).optional(),
    pattern: z.instanceof(RegExp).optional(),
    default: z.union([z.string(), z.number(), z.boolean()]).optional(),
    enum: z.array(z.string()).optional(),
    mustBe: z.union([z.string(), z.number(), z.boolean()]).optional(),
    message: z.string().optional(),
  })).optional(),
});

/**
 * Zod schema for EnvironmentConfig
 */
export const EnvironmentConfigSchema = z.object({
  envFiles: z.array(z.string()),
  description: z.string().optional(),
  strict: z.boolean().optional(),
});

/**
 * Zod schema for SyncConfig
 */
export const SyncConfigSchema = z.object({
  sources: z.object({
    fromCode: z.boolean().optional(),
    fromEnv: z.boolean().optional(),
    fromConfig: z.boolean().optional(),
  }).optional(),
  groupBy: z.enum(['category', 'prefix', 'file', 'none']).optional(),
  categories: z.record(z.string(), z.array(z.string())).optional(),
  include: z.object({
    types: z.boolean().optional(),
    defaults: z.boolean().optional(),
    examples: z.boolean().optional(),
    descriptions: z.boolean().optional(),
    secretWarnings: z.boolean().optional(),
    docsLinks: z.boolean().optional(),
    required: z.boolean().optional(),
  }).optional(),
  values: z.object({
    secrets: z.enum(['empty', 'placeholder', 'redacted']).optional(),
    nonSecrets: z.enum(['empty', 'default', 'example']).optional(),
  }).optional(),
  format: z.object({
    headerComment: z.boolean().optional(),
    sectionDividers: z.boolean().optional(),
    blankLinesBetweenGroups: z.boolean().optional(),
    alignEquals: z.boolean().optional(),
    maxLineLength: z.number().optional(),
  }).optional(),
  preserve: z.object({
    customComments: z.boolean().optional(),
    customVariables: z.boolean().optional(),
    ordering: z.enum(['smart', 'strict', 'none']).optional(),
  }).optional(),
});

/**
 * Zod schema for MatrixConfig
 */
export const MatrixConfigSchema = z.object({
  requireConsistency: z.enum(['error', 'warn', 'off']).optional(),
  excludeFromMatrix: z.array(z.string()).optional(),
});

/**
 * Zod schema for WorkspaceConfig
 */
export const WorkspaceConfigSchema = z.object({
  patterns: z.array(z.string()).optional(),
  rootEnvFiles: z.array(z.string()).optional(),
  inheritance: z.enum(['cascade', 'explicit', 'none']).optional(),
  packages: z.record(z.string(), z.object({
    framework: z.enum(['auto', 'nextjs', 'vite', 'cra', 'node']).optional(),
    envFiles: z.array(z.string()).optional(),
    inheritFromRoot: z.boolean().optional(),
    mode: z.enum(['app', 'library']).optional(),
    expectedVariables: z.array(z.string()).optional(),
  })).optional(),
});

/**
 * Zod schema for EnvDoctorConfig
 */
export const EnvDoctorConfigSchema = z.object({
  envFiles: z.array(z.string()).default(['.env']),
  templateFile: z.string().optional(),
  include: z.array(z.string()).default(['src/**/*.{ts,js,tsx,jsx}']),
  exclude: z.array(z.string()).default(['node_modules', 'dist', '**/*.test.*', '**/*.spec.*']),
  framework: z.enum(['auto', 'nextjs', 'vite', 'cra', 'node']).default('auto'),
  variables: z.record(z.string(), VariableRuleSchema).default({}),
  ignore: z.array(z.string()).default([]),
  strict: z.boolean().optional(),
  secretPatterns: z.array(z.instanceof(RegExp)).optional(),
  root: z.string().optional(),
  environments: z.record(z.string(), EnvironmentConfigSchema).optional(),
  defaultEnvironment: z.string().optional(),
  sync: SyncConfigSchema.optional(),
  matrix: MatrixConfigSchema.optional(),
  workspaces: WorkspaceConfigSchema.optional(),
  conflicts: z.object({
    mode: z.enum(['error', 'warn', 'allow']).optional(),
    allowDifferent: z.array(z.string()).optional(),
  }).optional(),
  dependencies: z.object({
    trackImports: z.boolean().optional(),
    warnMissing: z.boolean().optional(),
  }).optional(),
});

/**
 * Default configuration values
 */
export const defaultConfig: EnvDoctorConfig = {
  envFiles: ['.env'],
  include: ['src/**/*.{ts,js,tsx,jsx}', 'app/**/*.{ts,js,tsx,jsx}', 'pages/**/*.{ts,js,tsx,jsx}'],
  exclude: ['node_modules', 'dist', 'build', '.next', '**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
  framework: 'auto',
  variables: {},
  ignore: [],
  strict: false,
};

/**
 * CLI options passed from command line
 */
export interface CLIOptions {
  config?: string;
  env?: string;
  format?: 'console' | 'json' | 'sarif';
  ci?: boolean;
  fix?: boolean;
  watch?: boolean;
  verbose?: boolean;
  depth?: number;
}

