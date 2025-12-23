import type { EnvDoctorConfig, EnvVariable, EnvUsage, Issue, VariableType } from '../types/index.js';
import { shouldIgnoreVariable } from '../utils/glob.js';
import { inferValueType } from '../scanner/env-parser.js';

export interface TypeMismatchAnalyzerOptions {
  /** Variables defined in .env files */
  definedVariables: EnvVariable[];
  /** Variables used in code */
  usedVariables: EnvUsage[];
  /** Configuration */
  config: EnvDoctorConfig;
}

/**
 * Find variables where the value doesn't match the expected or inferred type
 */
export function analyzeTypeMismatch(options: TypeMismatchAnalyzerOptions): Issue[] {
  const { definedVariables, usedVariables, config } = options;
  const issues: Issue[] = [];

  // Create a map of defined variables by name
  const definedMap = new Map<string, EnvVariable>();
  for (const variable of definedVariables) {
    definedMap.set(variable.name, variable);
  }

  // Group usages by variable name
  const usagesByName = new Map<string, EnvUsage[]>();
  for (const usage of usedVariables) {
    if (usage.name === '<dynamic>') continue;

    const existing = usagesByName.get(usage.name) || [];
    existing.push(usage);
    usagesByName.set(usage.name, existing);
  }

  // Track checked variables to avoid duplicates
  const checked = new Set<string>();

  for (const [name, usages] of usagesByName) {
    if (checked.has(name)) continue;
    checked.add(name);

    // Skip if ignored
    if (shouldIgnoreVariable(name, config.ignore, 'type-mismatch')) {
      continue;
    }

    const defined = definedMap.get(name);
    if (!defined) continue; // Missing variables handled elsewhere

    const value = defined.value;

    // Check explicit type from config
    const varConfig = config.variables[name];
    if (varConfig?.type) {
      const typeIssue = validateType(name, value, varConfig.type, defined);
      if (typeIssue) {
        issues.push(typeIssue);
        continue;
      }
    }

    // Check pattern from config
    if (varConfig?.pattern) {
      if (!varConfig.pattern.test(value)) {
        issues.push({
          type: 'invalid-value',
          severity: 'error',
          variable: name,
          message: `Value of "${name}" doesn't match required pattern`,
          location: {
            file: defined.file,
            line: defined.line,
          },
          context: {
            pattern: varConfig.pattern.toString(),
            value: maskSensitiveValue(value, defined.isSecret),
          },
        });
        continue;
      }
    }

    // Check enum from config
    if (varConfig?.enum && varConfig.enum.length > 0) {
      if (!varConfig.enum.includes(value)) {
        issues.push({
          type: 'invalid-value',
          severity: 'error',
          variable: name,
          message: `Value of "${name}" must be one of: ${varConfig.enum.join(', ')}`,
          location: {
            file: defined.file,
            line: defined.line,
          },
          context: {
            expected: varConfig.enum,
            actual: maskSensitiveValue(value, defined.isSecret),
          },
        });
        continue;
      }
    }

    // Infer type from usage and validate
    const inferredTypes = usages
      .map((u) => u.inferredType)
      .filter((t): t is NonNullable<typeof t> => t !== undefined);

    if (inferredTypes.length > 0) {
      // Use the most common inferred type
      const primaryType = getMostCommonType(inferredTypes);

      if (primaryType) {
        const typeIssue = validateInferredType(name, value, primaryType, defined, usages[0]);
        if (typeIssue) {
          issues.push(typeIssue);
        }
      }
    }
  }

  return issues;
}

/**
 * Validate a value against an explicit type
 */
function validateType(
  name: string,
  value: string,
  type: VariableType,
  defined: EnvVariable
): Issue | null {
  switch (type) {
    case 'number':
      if (!/^-?\d+(\.\d+)?$/.test(value)) {
        return {
          type: 'type-mismatch',
          severity: 'error',
          variable: name,
          message: `Variable "${name}" should be a number but value "${maskSensitiveValue(value, defined.isSecret)}" is not numeric`,
          location: { file: defined.file, line: defined.line },
          fix: 'Update the value to be a valid number',
        };
      }
      break;

    case 'boolean':
      if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
        return {
          type: 'type-mismatch',
          severity: 'error',
          variable: name,
          message: `Variable "${name}" should be a boolean but value "${maskSensitiveValue(value, defined.isSecret)}" is not valid`,
          location: { file: defined.file, line: defined.line },
          fix: 'Use true, false, 1, 0, yes, or no',
        };
      }
      break;

    case 'json':
      try {
        JSON.parse(value);
      } catch {
        return {
          type: 'type-mismatch',
          severity: 'error',
          variable: name,
          message: `Variable "${name}" should be valid JSON but value is not parseable`,
          location: { file: defined.file, line: defined.line },
          fix: 'Ensure the value is valid JSON',
        };
      }
      break;

    case 'url':
      try {
        new URL(value);
      } catch {
        return {
          type: 'type-mismatch',
          severity: 'error',
          variable: name,
          message: `Variable "${name}" should be a valid URL`,
          location: { file: defined.file, line: defined.line },
          fix: 'Provide a valid URL (e.g., https://example.com)',
        };
      }
      break;

    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return {
          type: 'type-mismatch',
          severity: 'error',
          variable: name,
          message: `Variable "${name}" should be a valid email address`,
          location: { file: defined.file, line: defined.line },
          fix: 'Provide a valid email address',
        };
      }
      break;
  }

  return null;
}

/**
 * Validate a value against an inferred type from usage
 */
function validateInferredType(
  name: string,
  value: string,
  inferredType: string,
  defined: EnvVariable,
  usage: EnvUsage
): Issue | null {
  const actualType = inferValueType(value);

  // Skip if value is empty (might be intentional)
  if (!value) return null;

  switch (inferredType) {
    case 'number':
      if (actualType !== 'number') {
        return {
          type: 'type-mismatch',
          severity: 'warning',
          variable: name,
          message: `Variable "${name}" is used as a number at ${usage.file}:${usage.line} but value "${maskSensitiveValue(value, defined.isSecret)}" is not numeric`,
          location: { file: defined.file, line: defined.line },
          context: {
            usedAt: `${usage.file}:${usage.line}`,
          },
        };
      }
      break;

    case 'boolean':
      if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
        return {
          type: 'type-mismatch',
          severity: 'warning',
          variable: name,
          message: `Variable "${name}" is used as a boolean at ${usage.file}:${usage.line} but value may not be valid`,
          location: { file: defined.file, line: defined.line },
          context: {
            usedAt: `${usage.file}:${usage.line}`,
          },
        };
      }
      break;

    case 'json':
      if (actualType !== 'json') {
        try {
          JSON.parse(value);
        } catch {
          return {
            type: 'type-mismatch',
            severity: 'warning',
            variable: name,
            message: `Variable "${name}" is parsed as JSON at ${usage.file}:${usage.line} but value is not valid JSON`,
            location: { file: defined.file, line: defined.line },
            context: {
              usedAt: `${usage.file}:${usage.line}`,
            },
          };
        }
      }
      break;

    case 'array':
      // Arrays are typically split by comma, so any value with commas is probably fine
      if (!value.includes(',')) {
        return {
          type: 'type-mismatch',
          severity: 'info',
          variable: name,
          message: `Variable "${name}" is used as an array at ${usage.file}:${usage.line} but value doesn't contain comma separators`,
          location: { file: defined.file, line: defined.line },
          context: {
            usedAt: `${usage.file}:${usage.line}`,
          },
        };
      }
      break;
  }

  return null;
}

/**
 * Get the most common type from an array
 */
function getMostCommonType(types: string[]): string | undefined {
  const counts: Record<string, number> = {};
  for (const type of types) {
    counts[type] = (counts[type] || 0) + 1;
  }

  let maxCount = 0;
  let maxType: string | undefined;
  for (const [type, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  }

  return maxType;
}

/**
 * Mask sensitive values for display
 */
function maskSensitiveValue(value: string, isSecret?: boolean): string {
  if (!isSecret) return value;

  if (value.length <= 4) return '****';
  return value.slice(0, 2) + '****' + value.slice(-2);
}

