/**
 * @fileoverview Template generator from code analysis
 */

import type { EnvDoctorConfig, EnvVariable, EnvUsage } from '../types/index.js';
import type { EnrichedVariable, SyncConfig } from './types.js';
import { formatTemplate } from './formatter.js';
import { analyze } from '../core.js';

/**
 * Options for template generation
 */
export interface GenerateOptions {
  /** Root directory to analyze */
  rootDir?: string;
  /** Configuration */
  config?: EnvDoctorConfig;
  /** Sync configuration */
  syncConfig?: Partial<SyncConfig>;
  /** Whether to include variables from code */
  fromCode?: boolean;
  /** Whether to include variables from .env files */
  fromEnv?: boolean;
  /** Whether to include variables from config */
  fromConfig?: boolean;
}

/**
 * Result of template generation
 */
export interface GenerateResult {
  /** Generated template content */
  content: string;
  /** Variables included in template */
  variables: EnrichedVariable[];
  /** Variables from code not in .env */
  newFromCode: string[];
  /** Variables from .env not in code */
  unusedFromEnv: string[];
  /** Statistics */
  stats: {
    totalVariables: number;
    fromCode: number;
    fromEnv: number;
    fromConfig: number;
    secrets: number;
    required: number;
  };
}

/**
 * Generate a template from code analysis
 */
export async function generateFromCode(options: GenerateOptions = {}): Promise<GenerateResult> {
  const {
    rootDir = process.cwd(),
    config,
    syncConfig = {},
    fromCode = true,
    fromEnv = true,
    fromConfig = true,
  } = options;

  // Load config if not provided
  let effectiveConfig = config;
  if (!effectiveConfig) {
    const { loadConfig } = await import('../config.js');
    const result = await loadConfig(undefined, rootDir);
    effectiveConfig = result.config;
  }

  // Run analysis
  const analysisResult = await analyze({ config: effectiveConfig });

  // Build enriched variables
  const variableMap = new Map<string, EnrichedVariable>();
  const newFromCode: string[] = [];
  const unusedFromEnv: string[] = [];

  // Add variables from .env files
  if (fromEnv) {
    for (const envVar of analysisResult.definedVariables) {
      const enriched = enrichVariable(envVar, effectiveConfig);
      enriched.source = 'env';
      variableMap.set(envVar.name, enriched);
    }
  }

  // Add/update variables from code
  if (fromCode) {
    const definedNames = new Set(analysisResult.definedVariables.map(v => v.name));
    
    for (const usage of analysisResult.usedVariables) {
      if (usage.name === '<dynamic>') continue;

      if (!variableMap.has(usage.name)) {
        // New variable from code
        const enriched = enrichFromUsage(usage, effectiveConfig);
        enriched.source = 'code';
        variableMap.set(usage.name, enriched);
        
        if (!definedNames.has(usage.name)) {
          newFromCode.push(usage.name);
        }
      } else {
        // Update existing with usage info
        const existing = variableMap.get(usage.name)!;
        mergeUsageInfo(existing, usage);
      }
    }
  }

  // Add variables from config
  if (fromConfig && effectiveConfig.variables) {
    for (const [name, rule] of Object.entries(effectiveConfig.variables)) {
      if (!variableMap.has(name)) {
        const enriched = enrichFromConfig(name, rule);
        enriched.source = 'config';
        variableMap.set(name, enriched);
      } else {
        // Update existing with config info
        const existing = variableMap.get(name)!;
        mergeConfigInfo(existing, rule);
      }
    }
  }

  // Find unused variables (in env but not in code)
  if (fromEnv && fromCode) {
    const usedNames = new Set(analysisResult.usedVariables.map(u => u.name));
    for (const envVar of analysisResult.definedVariables) {
      if (!usedNames.has(envVar.name)) {
        unusedFromEnv.push(envVar.name);
      }
    }
  }

  // Convert to array and sort
  const variables = Array.from(variableMap.values());

  // Calculate statistics
  const stats = {
    totalVariables: variables.length,
    fromCode: variables.filter(v => v.source === 'code').length,
    fromEnv: variables.filter(v => v.source === 'env').length,
    fromConfig: variables.filter(v => v.source === 'config').length,
    secrets: variables.filter(v => v.isSecret).length,
    required: variables.filter(v => v.required).length,
  };

  // Generate template content
  const content = formatTemplate(variables, syncConfig);

  return {
    content,
    variables,
    newFromCode,
    unusedFromEnv,
    stats,
  };
}

/**
 * Enrich an EnvVariable with additional metadata
 */
function enrichVariable(
  variable: EnvVariable,
  config: EnvDoctorConfig
): EnrichedVariable {
  const enriched: EnrichedVariable = {
    ...variable,
    type: variable.inferredType || inferType(variable),
    required: false,
    hints: [],
  };

  // Check config for additional info
  const rule = config.variables[variable.name];
  if (rule) {
    mergeConfigInfo(enriched, rule);
  }

  // Detect if it's a secret
  if (!enriched.isSecret) {
    enriched.isSecret = detectSecret(variable.name, variable.value);
  }

  // Generate example
  enriched.example = generateExample(enriched);

  return enriched;
}

/**
 * Create enriched variable from usage info
 */
function enrichFromUsage(
  usage: EnvUsage,
  config: EnvDoctorConfig
): EnrichedVariable {
  const enriched: EnrichedVariable = {
    name: usage.name,
    value: '',
    line: 0,
    file: '',
    type: usage.inferredType,
    required: true, // If used in code, likely required
    hints: [],
  };

  // Check config for additional info
  const rule = config.variables[usage.name];
  if (rule) {
    mergeConfigInfo(enriched, rule);
  }

  // Detect if it's a secret
  enriched.isSecret = detectSecret(usage.name, '');

  // Generate example based on name
  enriched.example = generateExample(enriched);

  return enriched;
}

/**
 * Create enriched variable from config rule
 */
function enrichFromConfig(
  name: string,
  rule: NonNullable<EnvDoctorConfig['variables']>[string]
): EnrichedVariable {
  const enriched: EnrichedVariable = {
    name,
    value: rule.default?.toString() || '',
    line: 0,
    file: '',
    type: rule.type,
    description: rule.description,
    required: rule.required,
    isSecret: rule.secret,
    hints: [],
  };

  // Generate example
  enriched.example = generateExample(enriched);

  return enriched;
}

/**
 * Merge usage info into existing enriched variable
 */
function mergeUsageInfo(enriched: EnrichedVariable, usage: EnvUsage): void {
  // If used in code, mark as required unless explicitly optional
  if (!enriched.required) {
    enriched.required = true;
  }

  // Update type if we have better info from usage
  if (usage.inferredType && !enriched.type) {
    enriched.type = usage.inferredType;
  }
}

/**
 * Merge config info into existing enriched variable
 */
function mergeConfigInfo(
  enriched: EnrichedVariable,
  rule: NonNullable<EnvDoctorConfig['variables']>[string]
): void {
  if (rule.type) enriched.type = rule.type;
  if (rule.description) enriched.description = rule.description;
  if (rule.required !== undefined) enriched.required = rule.required;
  if (rule.secret !== undefined) enriched.isSecret = rule.secret;
  if (rule.default !== undefined && !enriched.value) {
    enriched.value = rule.default.toString();
  }
  if (rule.enum) {
    enriched.hints = enriched.hints || [];
    enriched.hints.push(`Allowed values: ${rule.enum.join(', ')}`);
  }
}

/**
 * Infer type from variable value
 */
function inferType(variable: EnvVariable): EnrichedVariable['type'] {
  const { name, value } = variable;

  // Check by name
  if (name.includes('PORT') || name.includes('TIMEOUT') || name.includes('SIZE')) {
    return 'number';
  }
  if (name.includes('URL') || name.includes('URI') || name.includes('ENDPOINT')) {
    return 'url';
  }
  if (name.includes('EMAIL')) {
    return 'email';
  }
  if (name.startsWith('ENABLE_') || name.startsWith('DISABLE_') || 
      name.includes('_ENABLED') || name.includes('_DISABLED') ||
      name.startsWith('IS_') || name.startsWith('HAS_')) {
    return 'boolean';
  }

  // Check by value
  if (!value) return 'string';

  if (/^\d+$/.test(value)) return 'number';
  if (/^(true|false|yes|no|on|off|1|0)$/i.test(value)) return 'boolean';
  if (/^https?:\/\//.test(value)) return 'url';
  if (value.startsWith('{') || value.startsWith('[')) return 'json';

  return 'string';
}

/**
 * Detect if a variable is a secret
 */
function detectSecret(name: string, value: string): boolean {
  const secretPatterns = [
    /secret/i,
    /password/i,
    /api[_-]?key/i,
    /auth[_-]?token/i,
    /access[_-]?token/i,
    /private[_-]?key/i,
    /credential/i,
    /jwt/i,
    /bearer/i,
  ];

  for (const pattern of secretPatterns) {
    if (pattern.test(name)) return true;
  }

  // Check for high-entropy values that look like secrets
  if (value && value.length > 20) {
    const entropy = calculateEntropy(value);
    if (entropy > 4.0) return true;
  }

  return false;
}

/**
 * Calculate Shannon entropy of a string
 */
function calculateEntropy(str: string): number {
  const freq = new Map<string, number>();
  for (const char of str) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / str.length;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Generate an example value based on variable info
 */
function generateExample(variable: EnrichedVariable): string {
  const { name, type, value } = variable;

  // Use existing value if not a secret
  if (value && !variable.isSecret) {
    return value;
  }

  // Generate based on name patterns
  if (name.includes('DATABASE_URL') || name.includes('DB_URL')) {
    return 'postgres://user:password@localhost:5432/dbname';
  }
  if (name.includes('REDIS_URL')) {
    return 'redis://localhost:6379';
  }
  if (name.includes('MONGO')) {
    return 'mongodb://localhost:27017/dbname';
  }
  if (name === 'PORT') {
    return '3000';
  }
  if (name === 'NODE_ENV') {
    return 'development';
  }
  if (name.includes('API_URL') || name.includes('ENDPOINT')) {
    return 'https://api.example.com';
  }

  // Generate based on type
  switch (type) {
    case 'number':
      return '0';
    case 'boolean':
      return 'false';
    case 'url':
      return 'https://example.com';
    case 'email':
      return 'user@example.com';
    case 'json':
      return '{}';
    case 'array':
      return 'value1,value2,value3';
    default:
      return '';
  }
}

/**
 * Generate template for a list of variable names
 */
export function generateMinimalTemplate(names: string[]): string {
  const variables: EnrichedVariable[] = names.map(name => ({
    name,
    value: '',
    line: 0,
    file: '',
    isSecret: detectSecret(name, ''),
  }));

  return formatTemplate(variables, {
    include: {
      types: false,
      defaults: false,
      examples: false,
      descriptions: false,
      secretWarnings: true,
      docsLinks: false,
      required: false,
    },
  });
}

