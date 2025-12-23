import type { EnvVariable, Issue } from '../types/index.js';

export interface SyncCheckOptions {
  /** Variables defined in .env files */
  envVariables: EnvVariable[];
  /** Variables defined in template file (.env.example) */
  templateVariables: EnvVariable[];
  /** Template file name */
  templateFile: string;
}

export interface SyncCheckResult {
  /** Issues found */
  issues: Issue[];
  /** Variables in env but not in template */
  missingFromTemplate: string[];
  /** Variables in template but not in env */
  missingFromEnv: string[];
  /** Whether files are in sync */
  inSync: boolean;
}

/**
 * Check if .env files are in sync with the template file
 */
export function analyzeSyncDrift(options: SyncCheckOptions): SyncCheckResult {
  const { envVariables, templateVariables, templateFile } = options;
  const issues: Issue[] = [];

  // Create sets of variable names
  const envNames = new Set(envVariables.map((v) => v.name));
  const templateNames = new Set(templateVariables.map((v) => v.name));

  const missingFromTemplate: string[] = [];
  const missingFromEnv: string[] = [];

  // Find variables in env but not in template
  for (const variable of envVariables) {
    if (!templateNames.has(variable.name)) {
      missingFromTemplate.push(variable.name);

      issues.push({
        type: 'sync-drift',
        severity: 'warning',
        variable: variable.name,
        message: `Variable "${variable.name}" is defined in ${variable.file} but not in ${templateFile}`,
        location: {
          file: variable.file,
          line: variable.line,
        },
        fix: `Add ${variable.name}= to ${templateFile}`,
      });
    }
  }

  // Find variables in template but not in env
  for (const variable of templateVariables) {
    if (!envNames.has(variable.name)) {
      missingFromEnv.push(variable.name);

      issues.push({
        type: 'sync-drift',
        severity: 'info',
        variable: variable.name,
        message: `Variable "${variable.name}" is in ${templateFile} but not defined in any .env file`,
        location: {
          file: templateFile,
          line: variable.line,
        },
        fix: `Add ${variable.name}= to your .env file`,
      });
    }
  }

  const inSync = missingFromTemplate.length === 0 && missingFromEnv.length === 0;

  return {
    issues,
    missingFromTemplate,
    missingFromEnv,
    inSync,
  };
}

/**
 * Generate a template file content from env variables
 */
export function generateTemplate(
  variables: EnvVariable[],
  options: {
    includeComments?: boolean;
    groupByPrefix?: boolean;
    maskSecrets?: boolean;
  } = {}
): string {
  const { includeComments = true, groupByPrefix = true, maskSecrets = true } = options;

  const lines: string[] = [];

  if (includeComments) {
    lines.push('# Environment Variables Template');
    lines.push('# Copy this file to .env and fill in the values');
    lines.push('');
  }

  if (groupByPrefix) {
    // Group variables by prefix
    const groups: Record<string, EnvVariable[]> = {};

    for (const variable of variables) {
      const prefix = getPrefix(variable.name);
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(variable);
    }

    // Sort groups
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));

    for (const [prefix, vars] of sortedGroups) {
      if (includeComments && prefix) {
        lines.push(`# ${formatPrefixName(prefix)}`);
      }

      for (const variable of vars.sort((a, b) => a.name.localeCompare(b.name))) {
        lines.push(formatTemplateVariable(variable, maskSecrets));
      }

      lines.push('');
    }
  } else {
    // Simple alphabetical listing
    const sorted = [...variables].sort((a, b) => a.name.localeCompare(b.name));

    for (const variable of sorted) {
      lines.push(formatTemplateVariable(variable, maskSecrets));
    }
  }

  return lines.join('\n');
}

/**
 * Get the prefix of a variable name
 */
function getPrefix(name: string): string {
  // Common prefixes
  const prefixes = [
    'NEXT_PUBLIC_',
    'REACT_APP_',
    'VITE_',
    'DATABASE_',
    'DB_',
    'REDIS_',
    'AWS_',
    'STRIPE_',
    'AUTH_',
    'API_',
    'APP_',
  ];

  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      return prefix;
    }
  }

  // Try to find a prefix by underscore
  const parts = name.split('_');
  if (parts.length > 1) {
    return parts[0] + '_';
  }

  return '';
}

/**
 * Format a prefix name for display
 */
function formatPrefixName(prefix: string): string {
  return prefix
    .replace(/_$/, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a variable for the template file
 */
function formatTemplateVariable(variable: EnvVariable, maskSecrets: boolean): string {
  let value = '';

  if (variable.value && !maskSecrets) {
    value = variable.value;
  } else if (variable.isSecret) {
    value = ''; // Leave empty for secrets
  } else if (variable.value) {
    // For non-secrets, include a hint or example value
    value = getExampleValue(variable);
  }

  return `${variable.name}=${value}`;
}

/**
 * Get an example value for a variable
 */
function getExampleValue(variable: EnvVariable): string {
  const { name, value } = variable;

  // If it looks like a URL, show the format
  if (name.includes('URL') || name.includes('URI')) {
    if (value.startsWith('postgres://')) return 'postgres://user:pass@localhost:5432/db';
    if (value.startsWith('mysql://')) return 'mysql://user:pass@localhost:3306/db';
    if (value.startsWith('mongodb://')) return 'mongodb://localhost:27017/db';
    if (value.startsWith('redis://')) return 'redis://localhost:6379';
    if (value.startsWith('http')) return 'https://example.com';
    return '';
  }

  // If it's a number, show example
  if (/^\d+$/.test(value)) {
    return value;
  }

  // If it's a boolean, show example
  if (['true', 'false'].includes(value.toLowerCase())) {
    return value;
  }

  // For NODE_ENV
  if (name === 'NODE_ENV') {
    return 'development';
  }

  return '';
}

/**
 * Merge template variables with env variables to find diff
 */
export function compareTemplateWithEnv(
  template: EnvVariable[],
  env: EnvVariable[]
): {
  added: string[];
  removed: string[];
  changed: Array<{ name: string; templateValue: string; envValue: string }>;
} {
  const templateMap = new Map(template.map((v) => [v.name, v]));
  const envMap = new Map(env.map((v) => [v.name, v]));

  const added: string[] = [];
  const removed: string[] = [];
  const changed: Array<{ name: string; templateValue: string; envValue: string }> = [];

  // Find added (in env but not template)
  for (const [name] of envMap) {
    if (!templateMap.has(name)) {
      added.push(name);
    }
  }

  // Find removed (in template but not env)
  for (const [name] of templateMap) {
    if (!envMap.has(name)) {
      removed.push(name);
    }
  }

  // Find changed (different values - only for non-secret values)
  for (const [name, envVar] of envMap) {
    const templateVar = templateMap.get(name);
    if (templateVar && templateVar.value && envVar.value) {
      if (templateVar.value !== envVar.value && !envVar.isSecret) {
        changed.push({
          name,
          templateValue: templateVar.value,
          envValue: envVar.value,
        });
      }
    }
  }

  return { added, removed, changed };
}

