/**
 * @fileoverview env-doctor - Analyze and validate environment variables in your codebase.
 * 
 * This module provides the public API for env-doctor, including:
 * - Configuration loading and validation
 * - Environment file parsing
 * - Code scanning for env var usage
 * - Issue analyzers (missing, unused, type mismatch, etc.)
 * - Multiple output formats (console, JSON, SARIF)
 * 
 * @example Basic usage
 * ```typescript
 * import { analyze, loadConfig } from 'env-doctor';
 * 
 * const { config } = await loadConfig();
 * const result = await analyze({ config });
 * 
 * console.log(`Found ${result.issues.length} issues`);
 * ```
 * 
 * @example Custom configuration
 * ```typescript
 * import { analyze } from 'env-doctor';
 * 
 * const result = await analyze({
 *   config: {
 *     envFiles: ['.env', '.env.local'],
 *     include: ['src/**\/*.ts'],
 *     framework: 'nextjs',
 *     variables: {
 *       DATABASE_URL: { required: true, secret: true }
 *     }
 *   }
 * });
 * ```
 * 
 * @packageDocumentation
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration and type definitions for env-doctor.
 * These types are used throughout the library and can be imported for
 * type-safe configuration and result handling.
 */
export type {
  /** Main configuration interface for env-doctor */
  EnvDoctorConfig,
  /** Rule configuration for individual variables */
  VariableRule,
  /** Supported variable types for validation */
  VariableType,
  /** Supported framework identifiers */
  Framework,
  /** CLI option types */
  CLIOptions,
  /** Detected issue structure */
  Issue,
  /** Types of issues that can be detected */
  IssueType,
  /** Issue severity levels */
  Severity,
  /** Source code location reference */
  SourceLocation,
  /** Parsed environment variable */
  EnvVariable,
  /** Environment variable usage in code */
  EnvUsage,
  /** Git history scan result */
  GitScanResult,
  /** Complete analysis result */
  AnalysisResult,
  /** Scan statistics */
  ScanStats,
  /** SARIF output format */
  SARIFOutput,
  /** SARIF run data */
  SARIFRun,
  /** SARIF rule definition */
  SARIFRule,
  /** SARIF result entry */
  SARIFResult,
} from './types/index.js';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Load configuration from file or defaults.
 * Searches for config files in the following order:
 * - Explicit path (if provided)
 * - env-doctor.config.js/mjs/cjs
 * - .env-doctor.config.js/mjs/cjs
 * - env-doctor.config.json
 * - .env-doctorrc
 * - package.json "env-doctor" key
 * 
 * @example
 * ```typescript
 * // Load from default location
 * const { config, configPath } = await loadConfig();
 * 
 * // Load from specific path
 * const { config } = await loadConfig('./custom-config.js');
 * ```
 */
export { loadConfig } from './config.js';

/**
 * Generate a config file template for new projects.
 * @example
 * ```typescript
 * import { generateConfigTemplate } from 'env-doctor';
 * import { writeFileSync } from 'fs';
 * 
 * writeFileSync('env-doctor.config.js', generateConfigTemplate());
 * ```
 */
export { generateConfigTemplate } from './config.js';

/**
 * Get environment-specific config overrides.
 * Maps environment names to appropriate env file patterns.
 */
export { getEnvSpecificConfig } from './config.js';

/**
 * Validate a configuration object.
 * Returns validation errors if the config is invalid.
 */
export { validateConfig } from './config.js';

/**
 * Default configuration values.
 * Used when no config file is found.
 */
export { defaultConfig } from './types/config.js';

/**
 * Zod schema for configuration validation.
 * Can be used for custom validation or IDE integration.
 */
export { EnvDoctorConfigSchema, VariableRuleSchema } from './types/config.js';

// ============================================================================
// Scanners
// ============================================================================

/**
 * Parse a single .env file.
 * Extracts variables with line numbers and detects secrets.
 * 
 * @example
 * ```typescript
 * const result = await parseEnvFile('.env', process.cwd());
 * for (const variable of result.variables) {
 *   console.log(`${variable.name}=${variable.isSecret ? '[secret]' : variable.value}`);
 * }
 * ```
 */
export { parseEnvFile } from './scanner/env-parser.js';

/**
 * Parse multiple .env files with override behavior.
 * Later files override earlier ones (like dotenv).
 */
export { parseEnvFiles } from './scanner/env-parser.js';

/**
 * Infer the type of a value (string, number, boolean, json, array).
 */
export { inferValueType } from './scanner/env-parser.js';

/**
 * Get built-in secret detection patterns.
 */
export { getSecretPatterns } from './scanner/env-parser.js';

/**
 * Scan source files for process.env usage.
 * Uses AST parsing for accurate detection with regex fallback.
 * 
 * @example
 * ```typescript
 * const result = await scanCode({
 *   rootDir: process.cwd(),
 *   include: ['src/**\/*.ts'],
 *   exclude: ['node_modules'],
 *   framework: 'nextjs'
 * });
 * 
 * console.log(`Found ${result.usages.length} env var usages`);
 * ```
 */
export { scanCode } from './scanner/code-scanner.js';

/**
 * Scan a single file's content for env usage.
 * Useful for incremental scanning or testing.
 */
export { scanFileContent } from './scanner/code-scanner.js';

/**
 * Extract unique variable names from usage list.
 */
export { getUniqueVariableNames } from './scanner/code-scanner.js';

/**
 * Scan git history for leaked secrets.
 * Checks commit history for exposed credentials.
 * 
 * @example
 * ```typescript
 * const { results, error } = await scanGitHistory({
 *   rootDir: process.cwd(),
 *   depth: 100
 * });
 * 
 * if (results.length > 0) {
 *   console.warn('Found secrets in git history!');
 * }
 * ```
 */
export { scanGitHistory } from './scanner/git-scanner.js';

/**
 * Check if a directory is a git repository.
 */
export { isGitRepository } from './scanner/git-scanner.js';

// ============================================================================
// Framework Detection
// ============================================================================

/**
 * Auto-detect the framework used in a project.
 * Checks config files and package.json dependencies.
 * 
 * @example
 * ```typescript
 * const framework = await detectFramework(process.cwd());
 * // Returns 'nextjs', 'vite', 'cra', or 'node'
 * ```
 */
export { detectFramework } from './frameworks/index.js';

/**
 * Get detailed information about a framework.
 * Includes client-side prefixes and config file patterns.
 */
export { getFrameworkInfo } from './frameworks/index.js';

/**
 * Check if a variable is client-accessible for a framework.
 */
export { isClientAccessible } from './frameworks/index.js';

/**
 * Get env file patterns for a framework.
 */
export { getEnvFilePatterns } from './frameworks/index.js';

/**
 * Validate that a variable follows framework conventions.
 */
export { validateFrameworkConvention } from './frameworks/index.js';

/**
 * Framework definitions with prefixes and patterns.
 */
export { FRAMEWORKS } from './frameworks/index.js';

// ============================================================================
// Analyzers
// ============================================================================

/**
 * Find variables used in code but not defined in .env files.
 * 
 * @example
 * ```typescript
 * const issues = analyzeMissing({
 *   definedVariables: envVars,
 *   usedVariables: codeUsages,
 *   config
 * });
 * ```
 */
export { analyzeMissing } from './analyzers/missing.js';

/**
 * Get a summary of missing variables by severity.
 */
export { getMissingSummary } from './analyzers/missing.js';

/**
 * Find variables defined in .env but never used in code.
 */
export { analyzeUnused } from './analyzers/unused.js';

/**
 * Get a summary of unused variables by file.
 */
export { getUnusedSummary } from './analyzers/unused.js';

/**
 * Find type mismatches between usage and values.
 * Detects issues like using parseInt on non-numeric values.
 */
export { analyzeTypeMismatch } from './analyzers/type-mismatch.js';

/**
 * Check sync between .env and .env.example files.
 */
export { analyzeSyncDrift } from './analyzers/sync-check.js';

/**
 * Generate a .env.example template from variables.
 */
export { generateTemplate } from './analyzers/sync-check.js';

/**
 * Compare template with actual env file.
 */
export { compareTemplateWithEnv } from './analyzers/sync-check.js';

/**
 * Detect exposed secrets in env files.
 */
export { analyzeSecrets } from './analyzers/secret-patterns.js';

/**
 * Check if a variable is likely a secret.
 */
export { isSecretVariable } from './analyzers/secret-patterns.js';

/**
 * Get security recommendations based on issues.
 */
export { getSecurityRecommendations } from './analyzers/secret-patterns.js';

/**
 * Built-in secret name detection patterns.
 */
export { SECRET_NAME_PATTERNS } from './analyzers/secret-patterns.js';

/**
 * Built-in secret value detection patterns.
 */
export { SECRET_VALUE_PATTERNS } from './analyzers/secret-patterns.js';

// ============================================================================
// Reporters
// ============================================================================

/**
 * Report results to the console with colors and formatting.
 * 
 * @example
 * ```typescript
 * reportToConsole(result, { verbose: true });
 * ```
 */
export { reportToConsole } from './reporters/console.js';

/**
 * Report results in CI-friendly format.
 * Outputs GitHub Actions annotations when running in GitHub.
 */
export { reportForCI } from './reporters/console.js';

/**
 * Create a progress spinner for long operations.
 */
export { createSpinner } from './reporters/console.js';

/**
 * Report results as formatted JSON.
 */
export { reportToJSON } from './reporters/json.js';

/**
 * Report results as compact JSON (single line).
 */
export { reportToJSONCompact } from './reporters/json.js';

/**
 * Convert results to JSON report structure.
 */
export { toJSONReport } from './reporters/json.js';

/**
 * Parse a JSON report from string.
 */
export { parseJSONReport } from './reporters/json.js';

/**
 * Merge multiple JSON reports.
 */
export { mergeJSONReports } from './reporters/json.js';

/**
 * Report results in SARIF format for GitHub Code Scanning.
 * 
 * @example
 * ```typescript
 * const sarif = reportToSARIF(result);
 * fs.writeFileSync('results.sarif', sarif);
 * ```
 */
export { reportToSARIF } from './reporters/sarif.js';

/**
 * Convert results to SARIF structure.
 */
export { toSARIF } from './reporters/sarif.js';

/**
 * Create a minimal SARIF report from issues.
 */
export { createMinimalSARIF } from './reporters/sarif.js';

/**
 * Merge multiple SARIF reports.
 */
export { mergeSARIF } from './reporters/sarif.js';

/**
 * Validate SARIF structure.
 */
export { validateSARIF } from './reporters/sarif.js';

// ============================================================================
// Core Analysis
// ============================================================================

/**
 * Main analysis function - orchestrates all scanners and analyzers.
 * This is the primary entry point for programmatic usage.
 * 
 * @example
 * ```typescript
 * import { analyze, loadConfig } from 'env-doctor';
 * 
 * const { config } = await loadConfig();
 * const result = await analyze({ config, verbose: true });
 * 
 * if (result.stats.errorCount > 0) {
 *   console.error('Environment issues detected!');
 *   process.exit(1);
 * }
 * ```
 */
export { analyze } from './core.js';
