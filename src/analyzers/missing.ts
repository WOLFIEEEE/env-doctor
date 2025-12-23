import type { EnvDoctorConfig, EnvVariable, EnvUsage, Issue } from '../types/index.js';
import { shouldIgnoreVariable } from '../utils/glob.js';

export interface MissingAnalyzerOptions {
  /** Variables defined in .env files */
  definedVariables: EnvVariable[];
  /** Variables used in code */
  usedVariables: EnvUsage[];
  /** Configuration */
  config: EnvDoctorConfig;
}

/**
 * Find variables that are used in code but not defined in .env files
 */
export function analyzeMissing(options: MissingAnalyzerOptions): Issue[] {
  const { definedVariables, usedVariables, config } = options;
  const issues: Issue[] = [];

  // Create a set of defined variable names
  const definedNames = new Set(definedVariables.map((v) => v.name));

  // Track which variables we've already reported
  const reported = new Set<string>();

  // Find all unique used variable names
  for (const usage of usedVariables) {
    const { name } = usage;

    // Skip dynamic access
    if (name === '<dynamic>') {
      continue;
    }

    // Skip if already reported
    if (reported.has(name)) {
      continue;
    }

    // Skip if defined
    if (definedNames.has(name)) {
      continue;
    }

    // Skip if ignored
    if (shouldIgnoreVariable(name, config.ignore, 'missing')) {
      continue;
    }

    // Check if variable has a default value in config
    const varConfig = config.variables[name];
    if (varConfig?.default !== undefined) {
      continue;
    }

    // Determine severity based on config
    const isRequired = varConfig?.required ?? false;
    const severity = isRequired ? 'error' : 'warning';

    reported.add(name);

    issues.push({
      type: 'missing',
      severity,
      variable: name,
      message: `Variable "${name}" is used in code but not defined in any .env file`,
      location: {
        file: usage.file,
        line: usage.line,
        column: usage.column,
      },
      fix: `Add ${name}= to your .env file`,
    });
  }

  // Also check for explicitly required variables from config
  for (const [name, rule] of Object.entries(config.variables)) {
    if (!rule.required) continue;
    if (definedNames.has(name)) continue;
    if (reported.has(name)) continue;
    if (shouldIgnoreVariable(name, config.ignore, 'missing')) continue;

    reported.add(name);

    issues.push({
      type: 'missing',
      severity: 'error',
      variable: name,
      message: `Required variable "${name}" is not defined in any .env file`,
      fix: `Add ${name}= to your .env file`,
    });
  }

  return issues;
}

/**
 * Get a summary of missing variables
 */
export function getMissingSummary(issues: Issue[]): {
  required: string[];
  optional: string[];
} {
  const required: string[] = [];
  const optional: string[] = [];

  for (const issue of issues) {
    if (issue.type !== 'missing') continue;

    if (issue.severity === 'error') {
      required.push(issue.variable);
    } else {
      optional.push(issue.variable);
    }
  }

  return { required, optional };
}

