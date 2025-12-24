/**
 * @fileoverview Workspace analyzer for monorepos
 */

import { resolve } from 'node:path';
import type {
  PackageInfo,
  PackageAnalysisResult,
  WorkspaceAnalysisResult,
  SharedVariable,
  VariableConflict,
  WorkspaceStats,
} from './types.js';
import type { EnvDoctorConfig, EnvVariable } from '../types/index.js';
import { detectWorkspace, findPackages } from './detector.js';
import { analyze } from '../core.js';
import { loadConfig } from '../config.js';
import { parseEnvFiles } from '../scanner/env-parser.js';
import { logger } from '../utils/logger.js';

/**
 * Options for workspace analysis
 */
export interface WorkspaceAnalyzeOptions {
  /** Root directory of the workspace */
  rootDir?: string;
  /** Override workspace patterns */
  patterns?: string[];
  /** Base configuration */
  config?: EnvDoctorConfig;
  /** Whether to analyze in parallel */
  parallel?: boolean;
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Analyze an entire workspace
 */
export async function analyzeWorkspace(
  options: WorkspaceAnalyzeOptions = {}
): Promise<WorkspaceAnalysisResult> {
  const {
    rootDir = process.cwd(),
    patterns,
    config,
    parallel = true,
    verbose = false,
  } = options;

  const startTime = Date.now();

  if (verbose) {
    logger.setVerbose(true);
  }

  logger.debug('Starting workspace analysis...');

  // Detect workspace
  let workspace = await detectWorkspace(rootDir);
  
  // Override patterns if provided
  if (patterns && patterns.length > 0) {
    workspace = { ...workspace, patterns };
  }

  if (workspace.type === 'none') {
    logger.debug('No workspace detected');
    throw new Error('No workspace configuration found. This directory is not a monorepo.');
  }

  // Find all packages
  const packageList = await findPackages(workspace);

  if (packageList.length === 0) {
    throw new Error('No packages found in workspace');
  }

  logger.debug(`Found ${packageList.length} packages to analyze`);

  // Load base config
  let baseConfig = config;
  if (!baseConfig) {
    const { config: loadedConfig } = await loadConfig(undefined, rootDir);
    baseConfig = loadedConfig;
  }

  // Parse root-level env files
  const rootEnvFiles = baseConfig.workspaces?.rootEnvFiles || ['.env', '.env.local'];
  const { variables: rootVariables } = await parseEnvFiles(rootEnvFiles, rootDir);

  // Analyze each package
  const packageResults: PackageAnalysisResult[] = [];
  
  if (parallel) {
    // Parallel analysis
    const promises = packageList.map(pkg => analyzePackage(pkg, rootDir, baseConfig!, rootVariables));
    const results = await Promise.all(promises);
    packageResults.push(...results);
  } else {
    // Sequential analysis
    for (const pkg of packageList) {
      const result = await analyzePackage(pkg, rootDir, baseConfig, rootVariables);
      packageResults.push(result);
    }
  }

  // Find shared variables
  const sharedVariables = findSharedVariables(rootVariables, packageResults);

  // Detect conflicts
  const conflicts = detectConflicts(rootVariables, packageResults, baseConfig);

  // Calculate stats
  const stats = calculateStats(packageResults, sharedVariables, conflicts, Date.now() - startTime);

  return {
    workspace,
    rootVariables,
    packages: packageResults,
    sharedVariables,
    conflicts,
    stats,
  };
}

/**
 * Analyze a single package
 */
async function analyzePackage(
  pkg: PackageInfo,
  rootDir: string,
  baseConfig: EnvDoctorConfig,
  rootVariables: EnvVariable[]
): Promise<PackageAnalysisResult> {
  logger.debug(`Analyzing package: ${pkg.name}`);

  // Build package-specific config
  const packageConfig = buildPackageConfig(pkg, rootDir, baseConfig);

  // Run analysis
  const analysis = await analyze({ config: packageConfig });

  // Determine which variables are inherited vs local
  const rootVarNames = new Set(rootVariables.map(v => v.name));
  const localVariables = analysis.definedVariables.filter(v => !rootVarNames.has(v.name));
  const inheritedVariables = rootVariables.filter(v => 
    analysis.usedVariables.some(u => u.name === v.name)
  );

  return {
    package: pkg,
    analysis,
    inheritedVariables,
    localVariables,
  };
}

/**
 * Build configuration for a specific package
 */
function buildPackageConfig(
  pkg: PackageInfo,
  rootDir: string,
  baseConfig: EnvDoctorConfig
): EnvDoctorConfig {
  // Check for package-specific config
  const packageOverrides = baseConfig.workspaces?.packages?.[pkg.path] || {};

  // Determine inheritance
  const inheritance = baseConfig.workspaces?.inheritance || 'cascade';
  const inheritFromRoot = packageOverrides.inheritFromRoot ?? (inheritance !== 'none');

  // Build env files list
  let envFiles = packageOverrides.envFiles || pkg.envFiles;
  if (inheritFromRoot && inheritance === 'cascade') {
    const rootEnvFiles = baseConfig.workspaces?.rootEnvFiles || ['.env'];
    // Root files should be resolved from workspace root
    const rootEnvPaths = rootEnvFiles.map(f => resolve(rootDir, f));
    // Local files resolved from package dir
    envFiles = [...rootEnvPaths, ...envFiles.map(f => resolve(pkg.absolutePath, f))];
  } else {
    envFiles = envFiles.map(f => resolve(pkg.absolutePath, f));
  }

  return {
    ...baseConfig,
    root: pkg.absolutePath,
    envFiles,
    framework: packageOverrides.framework || pkg.framework || baseConfig.framework,
    // Adjust include patterns to be relative to package
    include: baseConfig.include.map(pattern => {
      // If pattern starts with a common directory, use it as-is
      if (pattern.startsWith('src/') || pattern.startsWith('app/') || pattern.startsWith('lib/')) {
        return pattern;
      }
      return pattern;
    }),
  };
}

/**
 * Find variables that are shared across packages
 */
function findSharedVariables(
  rootVariables: EnvVariable[],
  packageResults: PackageAnalysisResult[]
): SharedVariable[] {
  const varUsage = new Map<string, { source: string; usedBy: Set<string>; value?: string }>();

  // Track root variables
  for (const v of rootVariables) {
    varUsage.set(v.name, {
      source: 'root',
      usedBy: new Set(),
      value: v.value,
    });
  }

  // Track usage across packages
  for (const result of packageResults) {
    for (const usage of result.analysis.usedVariables) {
      if (usage.name === '<dynamic>') continue;

      if (!varUsage.has(usage.name)) {
        // First definition in a package
        const defined = result.analysis.definedVariables.find(d => d.name === usage.name);
        varUsage.set(usage.name, {
          source: result.package.name,
          usedBy: new Set([result.package.name]),
          value: defined?.value,
        });
      } else {
        varUsage.get(usage.name)!.usedBy.add(result.package.name);
      }
    }
  }

  // Convert to array, filtering for truly shared variables
  const shared: SharedVariable[] = [];
  
  for (const [name, info] of varUsage) {
    // A variable is shared if used by multiple packages or defined at root
    if (info.usedBy.size > 1 || info.source === 'root') {
      shared.push({
        name,
        source: info.source,
        usedBy: Array.from(info.usedBy),
        value: info.value,
      });
    }
  }

  return shared.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Detect variable conflicts across packages
 */
function detectConflicts(
  rootVariables: EnvVariable[],
  packageResults: PackageAnalysisResult[],
  config: EnvDoctorConfig
): VariableConflict[] {
  const conflicts: VariableConflict[] = [];
  const variableDefinitions = new Map<string, Array<{ package: string; file: string; value: string }>>();

  // Track root definitions
  for (const v of rootVariables) {
    if (!variableDefinitions.has(v.name)) {
      variableDefinitions.set(v.name, []);
    }
    variableDefinitions.get(v.name)!.push({
      package: 'root',
      file: v.file,
      value: v.value,
    });
  }

  // Track package definitions
  for (const result of packageResults) {
    for (const v of result.localVariables) {
      if (!variableDefinitions.has(v.name)) {
        variableDefinitions.set(v.name, []);
      }
      variableDefinitions.get(v.name)!.push({
        package: result.package.name,
        file: v.file,
        value: v.value,
      });
    }
  }

  // Find conflicts
  const allowedDifferent = new Set(config.conflicts?.allowDifferent || ['PORT', 'HOST', 'NODE_ENV']);

  for (const [name, definitions] of variableDefinitions) {
    if (definitions.length <= 1) continue;

    // Check if values differ
    const uniqueValues = new Set(definitions.map(d => d.value));
    if (uniqueValues.size <= 1) continue;

    // This is a conflict
    const isAllowed = allowedDifferent.has(name);
    const severity = isAllowed ? 'info' : (config.conflicts?.mode === 'warn' ? 'warning' : 'error');

    conflicts.push({
      name,
      definitions,
      isAllowed,
      severity,
    });
  }

  return conflicts.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Calculate workspace statistics
 */
function calculateStats(
  packageResults: PackageAnalysisResult[],
  sharedVariables: SharedVariable[],
  conflicts: VariableConflict[],
  duration: number
): WorkspaceStats {
  let totalIssues = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  let packagesWithIssues = 0;
  const allVariableNames = new Set<string>();

  for (const result of packageResults) {
    totalIssues += result.analysis.issues.length;
    totalErrors += result.analysis.stats.errorCount;
    totalWarnings += result.analysis.stats.warningCount;
    
    if (result.analysis.issues.length > 0) {
      packagesWithIssues++;
    }

    for (const v of result.analysis.definedVariables) {
      allVariableNames.add(v.name);
    }
    for (const v of result.analysis.usedVariables) {
      if (v.name !== '<dynamic>') {
        allVariableNames.add(v.name);
      }
    }
  }

  return {
    totalPackages: packageResults.length,
    packagesWithIssues,
    totalVariables: allVariableNames.size,
    sharedVariablesCount: sharedVariables.length,
    conflictsCount: conflicts.length,
    totalIssues,
    totalErrors,
    totalWarnings,
    duration,
  };
}

/**
 * Get a summary for a single package
 */
export function getPackageSummary(result: PackageAnalysisResult): string {
  const { analysis } = result;
  const parts: string[] = [];

  parts.push(`${analysis.stats.filesScanned} files scanned`);

  if (analysis.stats.errorCount > 0) {
    parts.push(`${analysis.stats.errorCount} errors`);
  }
  if (analysis.stats.warningCount > 0) {
    parts.push(`${analysis.stats.warningCount} warnings`);
  }
  if (analysis.stats.errorCount === 0 && analysis.stats.warningCount === 0) {
    parts.push('no issues');
  }

  return parts.join(', ');
}

