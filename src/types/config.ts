import { z } from 'zod';

/**
 * Supported frameworks for environment variable patterns
 */
export type Framework = 'auto' | 'nextjs' | 'vite' | 'cra' | 'node';

/**
 * Variable type for validation
 */
export type VariableType = 'string' | 'number' | 'boolean' | 'json' | 'url' | 'email';

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
}

/**
 * Zod schema for VariableRule
 */
export const VariableRuleSchema = z.object({
  required: z.boolean().optional(),
  secret: z.boolean().optional(),
  type: z.enum(['string', 'number', 'boolean', 'json', 'url', 'email']).optional(),
  pattern: z.instanceof(RegExp).optional(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  enum: z.array(z.string()).optional(),
  description: z.string().optional(),
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

