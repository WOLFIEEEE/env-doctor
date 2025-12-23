import type { EnvDoctorConfig, EnvVariable, EnvUsage, Issue } from '../types/index.js';
import { shouldIgnoreVariable } from '../utils/glob.js';

export interface UnusedAnalyzerOptions {
  /** Variables defined in .env files */
  definedVariables: EnvVariable[];
  /** Variables used in code */
  usedVariables: EnvUsage[];
  /** Configuration */
  config: EnvDoctorConfig;
  /** Framework for checking special variables */
  framework: string;
}

/**
 * Common variables that are typically used by the runtime/framework
 */
const COMMON_RUNTIME_VARS = new Set([
  'NODE_ENV',
  'PORT',
  'HOST',
  'DEBUG',
  'LOG_LEVEL',
  'TZ',
  'CI',
  'HOME',
  'PATH',
  'SHELL',
  'USER',
  'TERM',
]);

/**
 * Framework-specific variables that are used by the framework itself
 */
const FRAMEWORK_VARS: Record<string, Set<string>> = {
  nextjs: new Set([
    'NEXT_TELEMETRY_DISABLED',
    'NEXT_RUNTIME',
    'VERCEL',
    'VERCEL_ENV',
    'VERCEL_URL',
    'VERCEL_REGION',
  ]),
  vite: new Set(['VITE_CJS_TRACE', 'VITE_CJS_IGNORE_WARNING']),
  cra: new Set(['BROWSER', 'GENERATE_SOURCEMAP', 'CI']),
  node: new Set([]),
};

/**
 * Find variables that are defined in .env files but never used in code
 */
export function analyzeUnused(options: UnusedAnalyzerOptions): Issue[] {
  const { definedVariables, usedVariables, config, framework } = options;
  const issues: Issue[] = [];

  // Create a set of used variable names
  const usedNames = new Set(
    usedVariables.filter((u) => u.name !== '<dynamic>').map((u) => u.name)
  );

  // Get framework-specific allowed variables
  const frameworkVars = FRAMEWORK_VARS[framework] || new Set();

  for (const variable of definedVariables) {
    const { name, file, line } = variable;

    // Skip if used
    if (usedNames.has(name)) {
      continue;
    }

    // Skip common runtime variables
    if (COMMON_RUNTIME_VARS.has(name)) {
      continue;
    }

    // Skip framework-specific variables
    if (frameworkVars.has(name)) {
      continue;
    }

    // Skip if ignored
    if (shouldIgnoreVariable(name, config.ignore, 'unused')) {
      continue;
    }

    // Skip if it's a placeholder/example value
    if (isPlaceholderValue(variable.value)) {
      continue;
    }

    issues.push({
      type: 'unused',
      severity: 'warning',
      variable: name,
      message: `Variable "${name}" is defined in ${file} but never used in code`,
      location: {
        file,
        line,
      },
      context: {
        value: variable.value ? '[set]' : '[empty]',
      },
    });
  }

  return issues;
}

/**
 * Check if a value looks like a placeholder
 */
function isPlaceholderValue(value: string): boolean {
  if (!value) return true;

  const placeholderPatterns = [
    /^your[-_]?/i,
    /^xxx+$/i,
    /^placeholder$/i,
    /^changeme$/i,
    /^todo$/i,
    /^<.*>$/,
    /^\[.*\]$/,
    /^example[-_]?/i,
  ];

  return placeholderPatterns.some((pattern) => pattern.test(value));
}

/**
 * Get a summary of unused variables
 */
export function getUnusedSummary(issues: Issue[]): {
  count: number;
  byFile: Record<string, string[]>;
} {
  const byFile: Record<string, string[]> = {};
  let count = 0;

  for (const issue of issues) {
    if (issue.type !== 'unused') continue;

    count++;
    const file = issue.location?.file || 'unknown';

    if (!byFile[file]) {
      byFile[file] = [];
    }
    byFile[file].push(issue.variable);
  }

  return { count, byFile };
}

