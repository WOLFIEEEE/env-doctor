import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EnvDoctorConfigSchema, defaultConfig, type EnvDoctorConfig } from './types/index.js';
import { fileExists, readJsonFile, findUp } from './utils/fs.js';
import { logger } from './utils/logger.js';

const CONFIG_FILENAMES = [
  'env-doctor.config.js',
  'env-doctor.config.mjs',
  'env-doctor.config.cjs',
  '.env-doctor.config.js',
  '.env-doctor.config.mjs',
  '.env-doctor.config.cjs',
  'env-doctor.config.json',
  '.env-doctorrc',
  '.env-doctorrc.json',
];

/**
 * Load configuration from file or use defaults
 */
export async function loadConfig(
  configPath?: string,
  rootDir: string = process.cwd()
): Promise<{ config: EnvDoctorConfig; configPath?: string }> {
  // If explicit path provided, use it
  if (configPath) {
    const absolutePath = resolve(rootDir, configPath);
    if (await fileExists(absolutePath)) {
      const config = await loadConfigFile(absolutePath);
      return { config: mergeWithDefaults(config), configPath: absolutePath };
    }
    logger.warn(`Config file not found: ${configPath}`);
    return { config: { ...defaultConfig, root: rootDir } };
  }

  // Search for config file
  for (const filename of CONFIG_FILENAMES) {
    const foundPath = await findUp(filename, rootDir);
    if (foundPath) {
      logger.debug(`Found config at ${foundPath}`);
      const config = await loadConfigFile(foundPath);
      return {
        config: mergeWithDefaults(config, dirname(foundPath)),
        configPath: foundPath,
      };
    }
  }

  // Check package.json for env-doctor key
  const packageJsonPath = resolve(rootDir, 'package.json');
  if (await fileExists(packageJsonPath)) {
    const packageJson = await readJsonFile<{ 'env-doctor'?: Partial<EnvDoctorConfig> }>(
      packageJsonPath
    );
    if (packageJson?.['env-doctor']) {
      logger.debug('Found config in package.json');
      return {
        config: mergeWithDefaults(packageJson['env-doctor'], rootDir),
        configPath: packageJsonPath,
      };
    }
  }

  // Use defaults
  logger.debug('No config found, using defaults');
  return { config: { ...defaultConfig, root: rootDir } };
}

/**
 * Load a config file
 */
async function loadConfigFile(filePath: string): Promise<Partial<EnvDoctorConfig>> {
  const ext = filePath.split('.').pop()?.toLowerCase();

  try {
    if (ext === 'json' || filePath.endsWith('rc')) {
      const content = await readJsonFile<Partial<EnvDoctorConfig>>(filePath);
      return content || {};
    }

    // For JS/MJS files, use dynamic import
    const fileUrl = pathToFileURL(filePath).href;
    const module = await import(fileUrl);
    return module.default || module;
  } catch (err) {
    logger.warn(`Failed to load config from ${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return {};
  }
}

/**
 * Merge user config with defaults
 */
function mergeWithDefaults(
  userConfig: Partial<EnvDoctorConfig>,
  rootDir?: string
): EnvDoctorConfig {
  const merged = {
    ...defaultConfig,
    ...userConfig,
    root: userConfig.root || rootDir || process.cwd(),
    variables: {
      ...defaultConfig.variables,
      ...userConfig.variables,
    },
  };

  // Validate with Zod
  const result = EnvDoctorConfigSchema.safeParse(merged);
  if (!result.success) {
    logger.warn('Config validation warnings:');
    for (const issue of result.error.issues) {
      logger.warn(`  ${issue.path.join('.')}: ${issue.message}`);
    }
  }

  return merged;
}

/**
 * Create a config file template
 */
export function generateConfigTemplate(): string {
  return `// env-doctor.config.js
// See https://github.com/yourusername/env-doctor for documentation

/** @type {import('env-doctor').EnvDoctorConfig} */
module.exports = {
  // Which env files to check
  envFiles: ['.env', '.env.local'],

  // Compare against this template
  templateFile: '.env.example',

  // Where to scan for usage
  include: ['src/**/*.{ts,js,tsx,jsx}', 'app/**/*.{ts,js,tsx,jsx}'],
  exclude: ['node_modules', 'dist', '**/*.test.*'],

  // Framework detection (auto-detected by default)
  framework: 'auto', // 'nextjs' | 'vite' | 'cra' | 'node' | 'auto'

  // Variable-specific rules
  variables: {
    // DATABASE_URL: {
    //   required: true,
    //   secret: true,
    //   pattern: /^postgres:\\/\\//
    // },
    // PORT: {
    //   type: 'number',
    //   default: 3000
    // },
    // NODE_ENV: {
    //   enum: ['development', 'production', 'test']
    // }
  },

  // Ignore specific issues
  ignore: [
    // 'LEGACY_*',           // Ignore variables matching pattern
    // 'unused:DEBUG',       // Ignore specific rule for specific var
  ],

  // Strict mode - treat warnings as errors
  strict: false,
};
`;
}

/**
 * Get environment-specific config overrides
 */
export function getEnvSpecificConfig(
  baseConfig: EnvDoctorConfig,
  env: string
): EnvDoctorConfig {
  // Map environment names to env file patterns
  const envFileMap: Record<string, string[]> = {
    development: ['.env', '.env.local', '.env.development', '.env.development.local'],
    production: ['.env', '.env.production', '.env.production.local'],
    test: ['.env', '.env.test', '.env.test.local'],
    staging: ['.env', '.env.staging', '.env.staging.local'],
  };

  const envFiles = envFileMap[env] || [`.env.${env}`];

  return {
    ...baseConfig,
    envFiles,
  };
}

/**
 * Validate that required config values are present
 */
export function validateConfig(config: EnvDoctorConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.envFiles || config.envFiles.length === 0) {
    errors.push('At least one env file must be specified');
  }

  if (!config.include || config.include.length === 0) {
    errors.push('At least one include pattern must be specified');
  }

  // Validate variable rules
  for (const [name, rule] of Object.entries(config.variables)) {
    if (rule.pattern && !(rule.pattern instanceof RegExp)) {
      errors.push(`Variable "${name}": pattern must be a RegExp`);
    }

    if (rule.enum && !Array.isArray(rule.enum)) {
      errors.push(`Variable "${name}": enum must be an array`);
    }

    if (rule.type && !['string', 'number', 'boolean', 'json', 'url', 'email'].includes(rule.type)) {
      errors.push(`Variable "${name}": invalid type "${rule.type}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}

