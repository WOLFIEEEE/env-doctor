/**
 * @fileoverview Validators for runtime environment variable validation
 */

import type {
  VariableSchema,
  StringSchema,
  NumberSchema,
  BooleanSchema,
  UrlSchema,
  EmailSchema,
  JsonSchema,
  ArraySchema,
  ValidationError,
} from './types.js';

/**
 * Validate a single environment variable
 */
export function validateVariable(
  name: string,
  rawValue: string | undefined,
  schema: VariableSchema
): { value: unknown; error?: ValidationError } {
  // Handle missing value
  if (rawValue === undefined || rawValue === '') {
    if (schema.default !== undefined) {
      return { value: schema.default };
    }
    if (schema.required !== false) {
      return {
        value: undefined,
        error: {
          variable: name,
          message: `Missing required variable`,
          expected: schema.description || `a ${schema.type} value`,
        },
      };
    }
    return { value: undefined };
  }

  // Validate based on type
  switch (schema.type) {
    case 'string':
      return validateString(name, rawValue, schema);
    case 'number':
      return validateNumber(name, rawValue, schema);
    case 'boolean':
      return validateBoolean(name, rawValue, schema);
    case 'url':
      return validateUrl(name, rawValue, schema);
    case 'email':
      return validateEmail(name, rawValue, schema);
    case 'json':
      return validateJson(name, rawValue, schema);
    case 'array':
      return validateArray(name, rawValue, schema);
    default:
      return { value: rawValue };
  }
}

/**
 * Validate string variable
 */
function validateString(
  name: string,
  value: string,
  schema: StringSchema
): { value: string; error?: ValidationError } {
  // Check enum
  if (schema.enum && !schema.enum.includes(value)) {
    return {
      value,
      error: {
        variable: name,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        expected: schema.enum.join(' | '),
        received: value,
      },
    };
  }

  // Check pattern
  if (schema.pattern && !schema.pattern.test(value)) {
    return {
      value,
      error: {
        variable: name,
        message: `Value does not match required pattern`,
        expected: `match ${schema.pattern}`,
        received: value,
      },
    };
  }

  // Check length
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    return {
      value,
      error: {
        variable: name,
        message: `Value must be at least ${schema.minLength} characters`,
        expected: `min length ${schema.minLength}`,
        received: `${value.length} characters`,
      },
    };
  }

  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    return {
      value,
      error: {
        variable: name,
        message: `Value must be at most ${schema.maxLength} characters`,
        expected: `max length ${schema.maxLength}`,
        received: `${value.length} characters`,
      },
    };
  }

  // Apply transform
  const finalValue = schema.transform ? schema.transform(value) : value;

  return { value: finalValue };
}

/**
 * Validate number variable
 */
function validateNumber(
  name: string,
  value: string,
  schema: NumberSchema
): { value: number; error?: ValidationError } {
  const num = Number(value);

  if (isNaN(num)) {
    return {
      value: num,
      error: {
        variable: name,
        message: `Expected a number`,
        expected: 'number',
        received: value,
      },
    };
  }

  // Check integer
  if (schema.integer && !Number.isInteger(num)) {
    return {
      value: num,
      error: {
        variable: name,
        message: `Expected an integer`,
        expected: 'integer',
        received: value,
      },
    };
  }

  // Check min
  if (schema.min !== undefined && num < schema.min) {
    return {
      value: num,
      error: {
        variable: name,
        message: `Value must be at least ${schema.min}`,
        expected: `>= ${schema.min}`,
        received: value,
      },
    };
  }

  // Check max
  if (schema.max !== undefined && num > schema.max) {
    return {
      value: num,
      error: {
        variable: name,
        message: `Value must be at most ${schema.max}`,
        expected: `<= ${schema.max}`,
        received: value,
      },
    };
  }

  return { value: num };
}

/**
 * Validate boolean variable
 */
function validateBoolean(
  name: string,
  value: string,
  _schema: BooleanSchema
): { value: boolean; error?: ValidationError } {
  const lower = value.toLowerCase();

  // Accept various truthy/falsy values
  const truthyValues = ['true', '1', 'yes', 'on'];
  const falsyValues = ['false', '0', 'no', 'off'];

  if (truthyValues.includes(lower)) {
    return { value: true };
  }

  if (falsyValues.includes(lower)) {
    return { value: false };
  }

  return {
    value: false,
    error: {
      variable: name,
      message: `Expected a boolean value`,
      expected: 'true, false, 1, 0, yes, no, on, or off',
      received: value,
    },
  };
}

/**
 * Validate URL variable
 */
function validateUrl(
  name: string,
  value: string,
  schema: UrlSchema
): { value: string; error?: ValidationError } {
  try {
    const url = new URL(value);

    // Check protocols
    if (schema.protocols && schema.protocols.length > 0) {
      const protocol = url.protocol.replace(':', '');
      if (!schema.protocols.includes(protocol)) {
        return {
          value,
          error: {
            variable: name,
            message: `URL must use one of these protocols: ${schema.protocols.join(', ')}`,
            expected: schema.protocols.join(' | '),
            received: protocol,
          },
        };
      }
    }

    return { value };
  } catch {
    return {
      value,
      error: {
        variable: name,
        message: `Expected a valid URL`,
        expected: 'valid URL',
        received: value,
      },
    };
  }
}

/**
 * Validate email variable
 */
function validateEmail(
  name: string,
  value: string,
  _schema: EmailSchema
): { value: string; error?: ValidationError } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(value)) {
    return {
      value,
      error: {
        variable: name,
        message: `Expected a valid email address`,
        expected: 'email address',
        received: value,
      },
    };
  }

  return { value };
}

/**
 * Validate JSON variable
 */
function validateJson(
  name: string,
  value: string,
  _schema: JsonSchema
): { value: unknown; error?: ValidationError } {
  try {
    const parsed = JSON.parse(value);
    return { value: parsed };
  } catch {
    return {
      value: undefined,
      error: {
        variable: name,
        message: `Expected valid JSON`,
        expected: 'valid JSON',
        received: value.slice(0, 50) + (value.length > 50 ? '...' : ''),
      },
    };
  }
}

/**
 * Validate array variable
 */
function validateArray(
  name: string,
  value: string,
  schema: ArraySchema
): { value: (string | number)[]; error?: ValidationError } {
  const separator = schema.separator || ',';
  const items = value.split(separator).map(s => s.trim()).filter(Boolean);

  // Check item count
  if (schema.minItems !== undefined && items.length < schema.minItems) {
    return {
      value: items,
      error: {
        variable: name,
        message: `Array must have at least ${schema.minItems} items`,
        expected: `min ${schema.minItems} items`,
        received: `${items.length} items`,
      },
    };
  }

  if (schema.maxItems !== undefined && items.length > schema.maxItems) {
    return {
      value: items,
      error: {
        variable: name,
        message: `Array must have at most ${schema.maxItems} items`,
        expected: `max ${schema.maxItems} items`,
        received: `${items.length} items`,
      },
    };
  }

  // Convert to numbers if needed
  if (schema.itemType === 'number') {
    const numbers: number[] = [];
    for (const item of items) {
      const num = Number(item);
      if (isNaN(num)) {
        return {
          value: items,
          error: {
            variable: name,
            message: `Array items must be numbers`,
            expected: 'number[]',
            received: item,
          },
        };
      }
      numbers.push(num);
    }
    return { value: numbers };
  }

  return { value: items };
}

/**
 * Format validation errors for console output
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  const lines: string[] = [
    '',
    '🔴 env-doctor: Environment validation failed!',
    '',
  ];

  // Group by type
  const missing = errors.filter(e => e.message.includes('Missing'));
  const invalid = errors.filter(e => !e.message.includes('Missing'));

  if (missing.length > 0) {
    lines.push('Missing required variables:');
    for (const error of missing) {
      lines.push(`  ✗ ${error.variable}`);
      if (error.expected) {
        lines.push(`    Expected: ${error.expected}`);
      }
    }
    lines.push('');
  }

  if (invalid.length > 0) {
    lines.push('Invalid variables:');
    for (const error of invalid) {
      lines.push(`  ✗ ${error.variable}${error.received ? ` = "${error.received}"` : ''}`);
      lines.push(`    ${error.message}`);
      if (error.expected) {
        lines.push(`    Expected: ${error.expected}`);
      }
    }
    lines.push('');
  }

  lines.push('Hint: Create a .env file with the required variables.');
  lines.push('Run `npx env-doctor init` to generate a template.');
  lines.push('');

  return lines.join('\n');
}

