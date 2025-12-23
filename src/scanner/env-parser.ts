import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { EnvVariable } from '../types/index.js';
import { fileExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

/**
 * Common patterns that indicate a value is a secret
 */
const SECRET_PATTERNS = [
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /auth[_-]?token/i,
  /access[_-]?token/i,
  /private[_-]?key/i,
  /jwt/i,
  /bearer/i,
  /credential/i,
  /^AWS_/i,
  /^STRIPE_/i,
  /^GITHUB_TOKEN/i,
  /^DATABASE_URL$/i,
  /^REDIS_URL$/i,
  /^MONGODB_URI$/i,
];

/**
 * Patterns that indicate the value looks like it contains credentials
 */
const CREDENTIAL_VALUE_PATTERNS = [
  /^sk[-_]/i, // Stripe secret key
  /^pk[-_]/i, // Stripe publishable key
  /^ghp_/, // GitHub personal access token
  /^gho_/, // GitHub OAuth token
  /^github_pat_/, // GitHub PAT
  /^AKIA[A-Z0-9]{16}/, // AWS access key
  /^eyJ[A-Za-z0-9-_]+\.eyJ/, // JWT token
  /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, // Private key
];

export interface ParseResult {
  variables: EnvVariable[];
  errors: Array<{ line: number; message: string }>;
}

/**
 * Parse a .env file and extract all variables
 */
export async function parseEnvFile(
  filePath: string,
  rootDir: string = process.cwd()
): Promise<ParseResult> {
  const absolutePath = resolve(rootDir, filePath);
  const variables: EnvVariable[] = [];
  const errors: Array<{ line: number; message: string }> = [];

  if (!(await fileExists(absolutePath))) {
    logger.debug(`Env file not found: ${absolutePath}`);
    return { variables, errors: [{ line: 0, message: `File not found: ${filePath}` }] };
  }

  let content: string;
  try {
    content = await readFile(absolutePath, 'utf-8');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { variables, errors: [{ line: 0, message: `Failed to read file: ${message}` }] };
  }

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Parse the line
    const parsed = parseLine(line, lineNumber);

    if (parsed.error) {
      errors.push({ line: lineNumber, message: parsed.error });
      continue;
    }

    if (parsed.variable) {
      variables.push({
        ...parsed.variable,
        file: filePath,
        raw: rawLine,
        isSecret: isSecretVariable(parsed.variable.name, parsed.variable.value),
      });
    }
  }

  return { variables, errors };
}

interface LineParseResult {
  variable?: Omit<EnvVariable, 'file' | 'raw' | 'isSecret'>;
  error?: string;
}

/**
 * Parse a single line from an env file
 */
function parseLine(line: string, lineNumber: number): LineParseResult {
  // Handle export prefix
  let processedLine = line;
  if (processedLine.startsWith('export ')) {
    processedLine = processedLine.slice(7);
  }

  // Find the first = sign
  const equalIndex = processedLine.indexOf('=');

  if (equalIndex === -1) {
    // Line without = might be valid in some formats, skip with warning
    return { error: `Invalid format: missing '=' sign` };
  }

  const name = processedLine.slice(0, equalIndex).trim();
  let value = processedLine.slice(equalIndex + 1);

  // Validate variable name
  if (!isValidVariableName(name)) {
    return { error: `Invalid variable name: "${name}"` };
  }

  // Parse the value (handle quotes, multiline, etc.)
  value = parseValue(value);

  return {
    variable: {
      name,
      value,
      line: lineNumber,
    },
  };
}

/**
 * Parse a value, handling quotes and escape sequences
 */
function parseValue(value: string): string {
  value = value.trim();

  // Handle quoted values
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    const quote = value[0];
    value = value.slice(1, -1);

    // Handle escape sequences for double quotes
    if (quote === '"') {
      value = value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  } else {
    // Remove inline comments for unquoted values
    const commentIndex = value.indexOf(' #');
    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex).trim();
    }
  }

  return value;
}

/**
 * Check if a variable name is valid
 */
function isValidVariableName(name: string): boolean {
  // Must start with letter or underscore, followed by letters, numbers, or underscores
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

/**
 * Check if a variable is likely a secret based on name and value
 */
function isSecretVariable(name: string, value: string): boolean {
  // Check name patterns
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(name)) {
      return true;
    }
  }

  // Check value patterns (only if value is non-empty)
  if (value) {
    for (const pattern of CREDENTIAL_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Parse multiple env files and merge results
 */
export async function parseEnvFiles(
  filePaths: string[],
  rootDir: string = process.cwd()
): Promise<ParseResult> {
  const allVariables: EnvVariable[] = [];
  const allErrors: Array<{ line: number; message: string }> = [];
  const seenVariables = new Map<string, EnvVariable>();

  for (const filePath of filePaths) {
    const result = await parseEnvFile(filePath, rootDir);

    // Later files override earlier ones (like dotenv behavior)
    for (const variable of result.variables) {
      seenVariables.set(variable.name, variable);
    }

    allErrors.push(...result.errors);
  }

  // Convert map back to array
  allVariables.push(...seenVariables.values());

  return { variables: allVariables, errors: allErrors };
}

/**
 * Infer the type of a value
 */
export function inferValueType(
  value: string
): 'string' | 'number' | 'boolean' | 'json' | 'array' | undefined {
  if (!value) return undefined;

  // Boolean
  if (value === 'true' || value === 'false') {
    return 'boolean';
  }

  // Number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return 'number';
  }

  // JSON object or array
  if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
    try {
      JSON.parse(value);
      return 'json';
    } catch {
      // Not valid JSON, continue
    }
  }

  // Comma-separated array
  if (value.includes(',') && !value.includes(' ')) {
    return 'array';
  }

  return 'string';
}

/**
 * Get all secret patterns (built-in + custom)
 */
export function getSecretPatterns(customPatterns?: RegExp[]): RegExp[] {
  if (customPatterns) {
    return [...SECRET_PATTERNS, ...customPatterns];
  }
  return SECRET_PATTERNS;
}

