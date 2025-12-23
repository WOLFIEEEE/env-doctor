/**
 * @fileoverview Core analysis engine for env-doctor.
 * Orchestrates all scanners and analyzers to produce a comprehensive analysis result.
 */

import type { EnvDoctorConfig, AnalysisResult, Issue, EnvVariable, EnvUsage } from './types/index.js';
import { parseEnvFile, parseEnvFiles } from './scanner/env-parser.js';
import { scanCode } from './scanner/code-scanner.js';
import { detectFramework } from './frameworks/index.js';
import { analyzeMissing } from './analyzers/missing.js';
import { analyzeUnused } from './analyzers/unused.js';
import { analyzeTypeMismatch } from './analyzers/type-mismatch.js';
import { analyzeSyncDrift } from './analyzers/sync-check.js';
import { analyzeSecrets } from './analyzers/secret-patterns.js';
import { logger } from './utils/logger.js';

/**
 * Options for the analyze function.
 */
export interface AnalyzeOptions {
  /** Configuration object for the analysis */
  config: EnvDoctorConfig;
  /** Enable verbose logging for debugging */
  verbose?: boolean;
}

/**
 * Main analysis function - orchestrates all scanners and analyzers.
 * 
 * This function performs the following steps:
 * 1. Detects the framework (if set to 'auto')
 * 2. Parses all configured .env files
 * 3. Parses the template file (if configured)
 * 4. Scans source code for environment variable usage
 * 5. Runs all analyzers (missing, unused, type mismatch, sync drift, secrets)
 * 6. Aggregates results and statistics
 * 
 * @param options - Analysis options including config and verbosity
 * @returns Promise resolving to the complete analysis result
 * 
 * @example Basic usage
 * ```typescript
 * import { analyze, loadConfig } from 'env-doctor';
 * 
 * const { config } = await loadConfig();
 * const result = await analyze({ config });
 * 
 * console.log(`Found ${result.issues.length} issues`);
 * console.log(`Scanned ${result.stats.filesScanned} files`);
 * ```
 * 
 * @example With custom config
 * ```typescript
 * import { analyze } from 'env-doctor';
 * 
 * const result = await analyze({
 *   config: {
 *     envFiles: ['.env', '.env.local'],
 *     include: ['src/**\/*.ts'],
 *     exclude: ['node_modules'],
 *     framework: 'nextjs',
 *     variables: {
 *       DATABASE_URL: { required: true, secret: true }
 *     }
 *   },
 *   verbose: true
 * });
 * ```
 * 
 * @example CI integration
 * ```typescript
 * const result = await analyze({ config });
 * 
 * if (result.stats.errorCount > 0) {
 *   console.error('Environment configuration issues detected');
 *   process.exit(1);
 * }
 * ```
 */
export async function analyze(options: AnalyzeOptions): Promise<AnalysisResult> {
  const { config, verbose = false } = options;
  const startTime = Date.now();
  const rootDir = config.root || process.cwd();

  if (verbose) {
    logger.setVerbose(true);
  }

  logger.debug('Starting analysis...');
  logger.debug(`Root directory: ${rootDir}`);

  // Step 1: Detect framework if auto
  let framework = config.framework;
  if (framework === 'auto') {
    framework = await detectFramework(rootDir);
    logger.debug(`Auto-detected framework: ${framework}`);
  }

  // Step 2: Parse env files
  logger.debug(`Parsing env files: ${config.envFiles.join(', ')}`);
  const envResult = await parseEnvFiles(config.envFiles, rootDir);
  const definedVariables: EnvVariable[] = envResult.variables;

  if (envResult.errors.length > 0) {
    logger.debug(`Env parsing errors: ${envResult.errors.length}`);
  }

  // Step 3: Parse template file if specified
  let templateVariables: EnvVariable[] | undefined;
  if (config.templateFile) {
    logger.debug(`Parsing template file: ${config.templateFile}`);
    const templateResult = await parseEnvFile(config.templateFile, rootDir);
    if (templateResult.variables.length > 0) {
      templateVariables = templateResult.variables;
    }
  }

  // Step 4: Scan code for usage
  logger.debug('Scanning code for env usage...');
  const codeResult = await scanCode({
    rootDir,
    include: config.include,
    exclude: config.exclude,
    framework,
  });
  const usedVariables: EnvUsage[] = codeResult.usages;

  logger.debug(`Found ${usedVariables.length} env usages in ${codeResult.filesScanned} files`);

  // Step 5: Run all analyzers
  const issues: Issue[] = [];

  // 5.1 Missing variables
  logger.debug('Analyzing missing variables...');
  const missingIssues = analyzeMissing({
    definedVariables,
    usedVariables,
    config,
  });
  issues.push(...missingIssues);

  // 5.2 Unused variables
  logger.debug('Analyzing unused variables...');
  const unusedIssues = analyzeUnused({
    definedVariables,
    usedVariables,
    config,
    framework,
  });
  issues.push(...unusedIssues);

  // 5.3 Type mismatches
  logger.debug('Analyzing type mismatches...');
  const typeMismatchIssues = analyzeTypeMismatch({
    definedVariables,
    usedVariables,
    config,
  });
  issues.push(...typeMismatchIssues);

  // 5.4 Sync check (if template file provided)
  if (templateVariables) {
    logger.debug('Analyzing sync drift...');
    const syncResult = analyzeSyncDrift({
      envVariables: definedVariables,
      templateVariables,
      templateFile: config.templateFile!,
    });
    issues.push(...syncResult.issues);
  }

  // 5.5 Secret patterns
  logger.debug('Analyzing secrets...');
  const secretIssues = analyzeSecrets({
    variables: definedVariables,
    customPatterns: config.secretPatterns,
    ignorePatterns: config.ignore,
  });
  issues.push(...secretIssues);

  // Step 6: Calculate stats
  const duration = Date.now() - startTime;
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  logger.debug(`Analysis complete in ${duration}ms`);
  logger.debug(`Found ${issues.length} issues (${errorCount} errors, ${warningCount} warnings, ${infoCount} info)`);

  return {
    issues,
    definedVariables,
    usedVariables,
    templateVariables,
    framework,
    stats: {
      filesScanned: codeResult.filesScanned,
      envFilesParsed: config.envFiles.length,
      duration,
      errorCount,
      warningCount,
      infoCount,
    },
  };
}

/**
 * Quick analysis with minimal configuration.
 * Automatically loads config from the project root and runs analysis.
 * 
 * @param rootDir - Root directory to analyze (defaults to current working directory)
 * @returns Promise resolving to the analysis result
 * 
 * @example
 * ```typescript
 * import { quickAnalyze } from 'env-doctor';
 * 
 * // Analyze current directory
 * const result = await quickAnalyze();
 * 
 * // Analyze specific directory
 * const result = await quickAnalyze('/path/to/project');
 * ```
 */
export async function quickAnalyze(rootDir: string = process.cwd()): Promise<AnalysisResult> {
  const { loadConfig } = await import('./config.js');
  const { config } = await loadConfig(undefined, rootDir);
  return analyze({ config });
}
