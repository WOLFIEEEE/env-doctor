/**
 * @fileoverview Environment comparison logic for matrix validation
 */

import type { EnvDoctorConfig, EnvVariable, VariableRule } from '../types/index.js';
import type {
  ParsedEnvironment,
  MatrixRow,
  MatrixIssue,
  EnvironmentVariableInfo,
  VariableStatus,
} from './types.js';

/**
 * Options for comparison
 */
export interface CompareOptions {
  /** Configuration with variable rules */
  config: EnvDoctorConfig;
  /** Environments to compare */
  environments: ParsedEnvironment[];
  /** Exclude these variable patterns from comparison */
  exclude?: string[];
}

/**
 * Compare variables across environments
 */
export function compareEnvironments(options: CompareOptions): MatrixRow[] {
  const { config, environments, exclude = [] } = options;
  
  // Collect all unique variable names
  const allVariables = new Set<string>();
  for (const env of environments) {
    for (const variable of env.variables) {
      if (!shouldExclude(variable.name, exclude)) {
        allVariables.add(variable.name);
      }
    }
  }

  // Also add variables from config that might not be in any env file yet
  for (const name of Object.keys(config.variables)) {
    if (!shouldExclude(name, exclude)) {
      allVariables.add(name);
    }
  }

  // Build matrix rows
  const rows: MatrixRow[] = [];
  const envNames = environments.map(e => e.name);

  for (const varName of Array.from(allVariables).sort()) {
    const row = buildMatrixRow(varName, environments, config);
    rows.push(row);
  }

  return rows;
}

/**
 * Build a single matrix row for a variable
 */
function buildMatrixRow(
  varName: string,
  environments: ParsedEnvironment[],
  config: EnvDoctorConfig
): MatrixRow {
  const row: MatrixRow = {
    name: varName,
    environments: {},
    status: 'ok',
    issues: [],
  };

  const rule = config.variables[varName];

  // Process each environment
  for (const env of environments) {
    const variable = env.variables.find(v => v.name === varName);
    const envRule = rule?.environments?.[env.name];
    
    row.environments[env.name] = buildEnvironmentInfo(variable, rule, envRule, env.name);
  }

  // Detect issues
  row.issues = detectRowIssues(row, environments.map(e => e.name), rule, config);
  
  // Set overall status
  if (row.issues.some(i => i.severity === 'error')) {
    row.status = 'error';
  } else if (row.issues.some(i => i.severity === 'warning')) {
    row.status = 'warning';
  } else if (row.issues.some(i => i.severity === 'info')) {
    row.status = 'info';
  }

  return row;
}

/**
 * Build environment info for a variable
 */
function buildEnvironmentInfo(
  variable: EnvVariable | undefined,
  rule: VariableRule | undefined,
  envRule: VariableRule['environments'] extends Record<string, infer T> ? T : undefined,
  envName: string
): EnvironmentVariableInfo {
  if (!variable) {
    return {
      status: 'missing',
      valid: !(rule?.required || envRule?.required),
      error: rule?.required || envRule?.required ? 'Required variable is missing' : undefined,
    };
  }

  const value = variable.value;
  const info: EnvironmentVariableInfo = {
    status: value ? 'set' : 'empty',
    value,
    file: variable.file,
    line: variable.line,
    valid: true,
    isSecret: variable.isSecret,
  };

  // Validate against rules
  const validation = validateValue(value, rule, envRule, envName);
  if (!validation.valid) {
    info.valid = false;
    info.error = validation.error;
    info.status = 'invalid';
  }

  return info;
}

/**
 * Validate a value against rules
 */
function validateValue(
  value: string,
  rule: VariableRule | undefined,
  envRule: VariableRule['environments'] extends Record<string, infer T> ? T : undefined,
  envName: string
): { valid: boolean; error?: string } {
  if (!rule && !envRule) {
    return { valid: true };
  }

  // Check mustBe constraint (environment-specific)
  if (envRule && 'mustBe' in envRule && envRule.mustBe !== undefined) {
    if (value !== String(envRule.mustBe)) {
      return {
        valid: false,
        error: envRule.message || `Value must be "${envRule.mustBe}" in ${envName}`,
      };
    }
  }

  // Check pattern
  const pattern = envRule?.pattern || rule?.pattern;
  if (pattern && !pattern.test(value)) {
    return {
      valid: false,
      error: `Value does not match required pattern`,
    };
  }

  // Check enum
  const enumValues = envRule?.enum || rule?.enum;
  if (enumValues && !enumValues.includes(value)) {
    return {
      valid: false,
      error: `Value must be one of: ${enumValues.join(', ')}`,
    };
  }

  // Check type
  const type = envRule?.type || rule?.type;
  if (type) {
    const typeValidation = validateType(value, type);
    if (!typeValidation.valid) {
      return typeValidation;
    }
  }

  return { valid: true };
}

/**
 * Validate a value against a type
 */
function validateType(value: string, type: string): { valid: boolean; error?: string } {
  switch (type) {
    case 'number':
      if (!/^-?\d+(\.\d+)?$/.test(value)) {
        return { valid: false, error: 'Expected a number' };
      }
      break;
    case 'boolean':
      if (!/^(true|false|1|0|yes|no|on|off)$/i.test(value)) {
        return { valid: false, error: 'Expected a boolean value' };
      }
      break;
    case 'url':
      try {
        new URL(value);
      } catch {
        return { valid: false, error: 'Expected a valid URL' };
      }
      break;
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { valid: false, error: 'Expected a valid email address' };
      }
      break;
    case 'json':
      try {
        JSON.parse(value);
      } catch {
        return { valid: false, error: 'Expected valid JSON' };
      }
      break;
  }
  return { valid: true };
}

/**
 * Detect issues for a matrix row
 */
function detectRowIssues(
  row: MatrixRow,
  envNames: string[],
  rule: VariableRule | undefined,
  config: EnvDoctorConfig
): MatrixIssue[] {
  const issues: MatrixIssue[] = [];

  // Check for missing required variables
  const missingEnvs = envNames.filter(env => {
    const info = row.environments[env];
    return info.status === 'missing' && !info.valid;
  });

  if (missingEnvs.length > 0) {
    issues.push({
      type: 'missing',
      severity: 'error',
      variable: row.name,
      environments: missingEnvs,
      message: `Required variable is missing in ${missingEnvs.join(', ')}`,
      fix: `Add ${row.name}= to the .env files for these environments`,
    });
  }

  // Check for invalid values
  const invalidEnvs = envNames.filter(env => {
    const info = row.environments[env];
    return info.status === 'invalid';
  });

  for (const env of invalidEnvs) {
    const info = row.environments[env];
    issues.push({
      type: 'invalid',
      severity: 'error',
      variable: row.name,
      environments: [env],
      message: info.error || `Invalid value in ${env}`,
    });
  }

  // Check for inconsistency (present in some envs but not others)
  const setEnvs = envNames.filter(env => row.environments[env].status === 'set');
  const missingOptionalEnvs = envNames.filter(env => {
    const info = row.environments[env];
    return info.status === 'missing' && info.valid;
  });

  if (setEnvs.length > 0 && missingOptionalEnvs.length > 0) {
    const consistency = config.matrix?.requireConsistency || 'warn';
    if (consistency !== 'off') {
      issues.push({
        type: 'inconsistent',
        severity: consistency === 'error' ? 'error' : 'warning',
        variable: row.name,
        environments: missingOptionalEnvs,
        message: `Variable is missing in ${missingOptionalEnvs.join(', ')} but defined in ${setEnvs.join(', ')}`,
        fix: `Add ${row.name}= to the missing environments or remove from all`,
      });
    }
  }

  // Check for value mismatches (same var, different values where they shouldn't differ)
  const uniqueValues = new Set<string>();
  for (const env of envNames) {
    const info = row.environments[env];
    if (info.status === 'set' && info.value) {
      uniqueValues.add(info.value);
    }
  }

  // Only warn about value differences for non-secret, non-environment-specific vars
  if (uniqueValues.size > 1 && !rule?.secret) {
    // Check if this is expected (like NODE_ENV differing)
    const isExpectedToDiffer = ['NODE_ENV', 'ENVIRONMENT'].includes(row.name);
    
    if (!isExpectedToDiffer) {
      issues.push({
        type: 'value_mismatch',
        severity: 'info',
        variable: row.name,
        environments: envNames,
        message: `Value differs across environments (may be intentional)`,
      });
    }
  }

  return issues;
}

/**
 * Check if a variable should be excluded
 */
function shouldExclude(name: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (matchesPattern(name, pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Simple pattern matching
 */
function matchesPattern(name: string, pattern: string): boolean {
  if (pattern.endsWith('*')) {
    return name.startsWith(pattern.slice(0, -1));
  }
  if (pattern.startsWith('*')) {
    return name.endsWith(pattern.slice(1));
  }
  return name === pattern;
}

