import { resolve } from 'node:path';
import type { Framework } from '../types/index.js';
import { fileExists, readJsonFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

export interface FrameworkInfo {
  name: Framework;
  displayName: string;
  envPrefix: string[];
  clientPrefix: string[];
  serverOnly: boolean;
  configFiles: string[];
}

/**
 * Framework definitions
 */
export const FRAMEWORKS: Record<Exclude<Framework, 'auto'>, FrameworkInfo> = {
  nextjs: {
    name: 'nextjs',
    displayName: 'Next.js',
    envPrefix: ['NEXT_PUBLIC_'],
    clientPrefix: ['NEXT_PUBLIC_'],
    serverOnly: false,
    configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
  },
  vite: {
    name: 'vite',
    displayName: 'Vite',
    envPrefix: ['VITE_'],
    clientPrefix: ['VITE_'],
    serverOnly: false,
    configFiles: ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'],
  },
  cra: {
    name: 'cra',
    displayName: 'Create React App',
    envPrefix: ['REACT_APP_'],
    clientPrefix: ['REACT_APP_'],
    serverOnly: false,
    configFiles: [],
  },
  node: {
    name: 'node',
    displayName: 'Node.js',
    envPrefix: [],
    clientPrefix: [],
    serverOnly: true,
    configFiles: [],
  },
};

/**
 * Auto-detect the framework used in a project
 */
export async function detectFramework(rootDir: string): Promise<Framework> {
  logger.debug('Auto-detecting framework...');

  // Check for framework-specific config files
  for (const [framework, info] of Object.entries(FRAMEWORKS)) {
    for (const configFile of info.configFiles) {
      const configPath = resolve(rootDir, configFile);
      if (await fileExists(configPath)) {
        logger.debug(`Detected ${info.displayName} via ${configFile}`);
        return framework as Framework;
      }
    }
  }

  // Check package.json dependencies
  const packageJsonPath = resolve(rootDir, 'package.json');
  const packageJson = await readJsonFile<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }>(packageJsonPath);

  if (packageJson) {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for Next.js
    if ('next' in allDeps) {
      logger.debug('Detected Next.js via package.json');
      return 'nextjs';
    }

    // Check for Vite
    if ('vite' in allDeps) {
      logger.debug('Detected Vite via package.json');
      return 'vite';
    }

    // Check for Create React App
    if ('react-scripts' in allDeps) {
      logger.debug('Detected Create React App via package.json');
      return 'cra';
    }
  }

  // Default to Node.js
  logger.debug('No specific framework detected, defaulting to Node.js');
  return 'node';
}

/**
 * Get framework info
 */
export function getFrameworkInfo(framework: Framework): FrameworkInfo {
  if (framework === 'auto') {
    return FRAMEWORKS.node;
  }
  return FRAMEWORKS[framework];
}

/**
 * Check if a variable should be client-accessible for a framework
 */
export function isClientAccessible(variable: string, framework: Framework): boolean {
  const info = getFrameworkInfo(framework);

  if (info.serverOnly) {
    return false;
  }

  return info.clientPrefix.some((prefix) => variable.startsWith(prefix));
}

/**
 * Get the expected env file patterns for a framework
 */
export function getEnvFilePatterns(framework: Framework): string[] {
  const baseFiles = ['.env', '.env.local'];

  switch (framework) {
    case 'nextjs':
      return [
        ...baseFiles,
        '.env.development',
        '.env.development.local',
        '.env.production',
        '.env.production.local',
        '.env.test',
        '.env.test.local',
      ];
    case 'vite':
      return [
        ...baseFiles,
        '.env.development',
        '.env.development.local',
        '.env.production',
        '.env.production.local',
      ];
    case 'cra':
      return [
        ...baseFiles,
        '.env.development',
        '.env.development.local',
        '.env.production',
        '.env.production.local',
        '.env.test',
        '.env.test.local',
      ];
    default:
      return baseFiles;
  }
}

/**
 * Validate that a variable follows framework conventions
 */
export function validateFrameworkConvention(
  variable: string,
  framework: Framework,
  isClientSide: boolean
): { valid: boolean; message?: string } {
  const info = getFrameworkInfo(framework);

  if (info.serverOnly) {
    return { valid: true };
  }

  const hasClientPrefix = info.clientPrefix.some((prefix) => variable.startsWith(prefix));

  if (isClientSide && !hasClientPrefix) {
    return {
      valid: false,
      message: `Variable "${variable}" is used on client-side but doesn't have required prefix (${info.clientPrefix.join(' or ')})`,
    };
  }

  return { valid: true };
}

