/**
 * @fileoverview Multi-environment matrix validation
 */

import { resolve } from 'node:path';
import type { EnvDoctorConfig } from '../types/index.js';
import type { MatrixResult, MatrixSummary, ParsedEnvironment } from './types.js';
import { parseEnvFiles } from '../scanner/env-parser.js';
import { compareEnvironments } from './comparator.js';
import { loadConfig } from '../config.js';
import { logger } from '../utils/logger.js';

export * from './types.js';
export * from './comparator.js';
export * from './reporter.js';

/**
 * Options for matrix analysis
 */
export interface MatrixAnalyzeOptions {
  /** Root directory */
  rootDir?: string;
  /** Configuration */
  config?: EnvDoctorConfig;
  /** Specific environments to analyze (default: all from config) */
  environments?: string[];
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Default environment definitions
 */
const DEFAULT_ENVIRONMENTS: Record<string, { envFiles: string[]; description: string }> = {
  development: {
    envFiles: ['.env', '.env.development', '.env.development.local', '.env.local'],
    description: 'Local development',
  },
  staging: {
    envFiles: ['.env', '.env.staging'],
    description: 'Staging/QA environment',
  },
  production: {
    envFiles: ['.env', '.env.production'],
    description: 'Production environment',
  },
  test: {
    envFiles: ['.env', '.env.test', '.env.test.local'],
    description: 'Test environment',
  },
};

/**
 * Analyze environment variables across multiple environments
 */
export async function analyzeMatrix(options: MatrixAnalyzeOptions = {}): Promise<MatrixResult> {
  const {
    rootDir = process.cwd(),
    config: providedConfig,
    environments: envFilter,
    verbose = false,
  } = options;

  if (verbose) {
    logger.setVerbose(true);
  }

  logger.debug('Starting matrix analysis...');

  // Load config
  let config = providedConfig;
  if (!config) {
    const { config: loadedConfig } = await loadConfig(undefined, rootDir);
    config = loadedConfig;
  }

  // Determine which environments to analyze
  const envDefinitions = config.environments || DEFAULT_ENVIRONMENTS;
  let envNames = Object.keys(envDefinitions);

  if (envFilter && envFilter.length > 0) {
    envNames = envNames.filter(name => envFilter.includes(name));
  }

  if (envNames.length === 0) {
    throw new Error('No environments configured for matrix analysis');
  }

  logger.debug(`Analyzing environments: ${envNames.join(', ')}`);

  // Parse each environment
  const parsedEnvs: ParsedEnvironment[] = [];

  for (const envName of envNames) {
    const envConfig = envDefinitions[envName];
    const envFiles = envConfig.envFiles || [`.env.${envName}`];

    logger.debug(`Parsing ${envName}: ${envFiles.join(', ')}`);

    const { variables, errors } = await parseEnvFiles(envFiles, rootDir);

    parsedEnvs.push({
      name: envName,
      description: envConfig.description,
      files: envFiles,
      variables,
      errors,
    });
  }

  // Compare environments
  const rows = compareEnvironments({
    config,
    environments: parsedEnvs,
    exclude: config.matrix?.excludeFromMatrix,
  });

  // Build matrix map
  const matrix: MatrixResult['matrix'] = {};
  for (const row of rows) {
    matrix[row.name] = row.environments;
  }

  // Collect all issues
  const allIssues = rows.flatMap(row => row.issues);

  // Build environment info
  const environmentInfo: MatrixResult['environmentInfo'] = {};
  for (const env of parsedEnvs) {
    environmentInfo[env.name] = {
      description: env.description,
      files: env.files,
      variableCount: env.variables.length,
    };
  }

  // Calculate summary
  const summary = calculateSummary(rows, envNames);

  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environments: envNames,
    environmentInfo,
    matrix,
    rows,
    issues: allIssues,
    summary,
  };
}

/**
 * Calculate summary statistics
 */
function calculateSummary(
  rows: MatrixResult['rows'],
  envNames: string[]
): MatrixSummary {
  const perEnvironment: MatrixSummary['perEnvironment'] = {};

  for (const env of envNames) {
    perEnvironment[env] = { total: 0, missing: 0, invalid: 0 };
  }

  let consistentVariables = 0;
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const row of rows) {
    // Count per-environment stats
    for (const env of envNames) {
      const info = row.environments[env];
      if (info.status === 'set' || info.status === 'empty') {
        perEnvironment[env].total++;
      }
      if (info.status === 'missing' && !info.valid) {
        perEnvironment[env].missing++;
      }
      if (info.status === 'invalid') {
        perEnvironment[env].invalid++;
      }
    }

    // Count issues
    if (row.status === 'ok') {
      consistentVariables++;
    } else if (row.status === 'error') {
      errorCount++;
    } else if (row.status === 'warning') {
      warningCount++;
    } else if (row.status === 'info') {
      infoCount++;
    }
  }

  return {
    totalVariables: rows.length,
    consistentVariables,
    errorCount,
    warningCount,
    infoCount,
    perEnvironment,
  };
}

/**
 * Auto-detect environments from existing .env files
 */
export async function detectEnvironments(rootDir: string): Promise<string[]> {
  const { glob } = await import('glob');
  const files = await glob('.env*', { cwd: rootDir, dot: true });

  const envs = new Set<string>();

  for (const file of files) {
    // Extract environment from filename
    const match = file.match(/\.env\.(\w+)(\.local)?$/);
    if (match) {
      envs.add(match[1]);
    }
  }

  // Always include development if we have a plain .env
  if (files.includes('.env') || files.includes('.env.local')) {
    envs.add('development');
  }

  return Array.from(envs).sort();
}

