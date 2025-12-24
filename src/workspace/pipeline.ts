/**
 * @fileoverview Turborepo and Nx pipeline support
 */

import { resolve } from 'node:path';
import { readJsonFile, fileExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

/**
 * Pipeline definition
 */
export interface Pipeline {
  name: string;
  /** Environment variables that should be passed to this pipeline */
  env?: string[];
  /** Environment variables from .env files */
  dotEnv?: string[];
  /** Dependencies on other pipelines */
  dependsOn?: string[];
  /** Whether this pipeline outputs to cache */
  cache?: boolean;
}

/**
 * Turborepo configuration
 */
export interface TurboConfig {
  /** Base pipeline definitions */
  pipeline?: Record<string, {
    dependsOn?: string[];
    env?: string[];
    dotEnv?: string[];
    cache?: boolean;
    outputs?: string[];
  }>;
  /** Global env vars */
  globalEnv?: string[];
  /** Global dotenv files */
  globalDotEnv?: string[];
}

/**
 * Nx configuration
 */
export interface NxConfig {
  /** Named inputs */
  namedInputs?: Record<string, string[]>;
  /** Target defaults */
  targetDefaults?: Record<string, {
    dependsOn?: string[];
    inputs?: string[];
    cache?: boolean;
  }>;
  /** Affected configuration */
  affected?: {
    defaultBase?: string;
  };
}

/**
 * Parsed pipeline configuration
 */
export interface PipelineConfig {
  type: 'turbo' | 'nx' | 'none';
  pipelines: Pipeline[];
  globalEnv: string[];
  globalDotEnv: string[];
}

/**
 * Parse Turborepo configuration
 */
export async function parseTurboConfig(rootDir: string): Promise<PipelineConfig | null> {
  const turboPath = resolve(rootDir, 'turbo.json');

  if (!await fileExists(turboPath)) {
    return null;
  }

  logger.debug('Parsing turbo.json...');

  const turboConfig = await readJsonFile<TurboConfig>(turboPath);
  if (!turboConfig) {
    return null;
  }

  const pipelines: Pipeline[] = [];

  if (turboConfig.pipeline) {
    for (const [name, config] of Object.entries(turboConfig.pipeline)) {
      pipelines.push({
        name,
        env: config.env,
        dotEnv: config.dotEnv,
        dependsOn: config.dependsOn,
        cache: config.cache,
      });
    }
  }

  return {
    type: 'turbo',
    pipelines,
    globalEnv: turboConfig.globalEnv || [],
    globalDotEnv: turboConfig.globalDotEnv || [],
  };
}

/**
 * Parse Nx configuration
 */
export async function parseNxConfig(rootDir: string): Promise<PipelineConfig | null> {
  const nxPath = resolve(rootDir, 'nx.json');

  if (!await fileExists(nxPath)) {
    return null;
  }

  logger.debug('Parsing nx.json...');

  const nxConfig = await readJsonFile<NxConfig>(nxPath);
  if (!nxConfig) {
    return null;
  }

  const pipelines: Pipeline[] = [];

  // Extract pipelines from target defaults
  if (nxConfig.targetDefaults) {
    for (const [name, config] of Object.entries(nxConfig.targetDefaults)) {
      // Nx stores env in namedInputs
      const envInputs = config.inputs?.filter(i => 
        typeof i === 'string' && i.startsWith('{env.')
      ) || [];

      const env = envInputs.map(i => {
        const match = i.match(/\{env\.(\w+)\}/);
        return match ? match[1] : null;
      }).filter(Boolean) as string[];

      pipelines.push({
        name,
        env,
        dependsOn: config.dependsOn,
        cache: config.cache,
      });
    }
  }

  return {
    type: 'nx',
    pipelines,
    globalEnv: [],
    globalDotEnv: [],
  };
}

/**
 * Get pipeline configuration for a workspace
 */
export async function getPipelineConfig(rootDir: string): Promise<PipelineConfig> {
  // Try Turbo first
  const turboConfig = await parseTurboConfig(rootDir);
  if (turboConfig) {
    return turboConfig;
  }

  // Try Nx
  const nxConfig = await parseNxConfig(rootDir);
  if (nxConfig) {
    return nxConfig;
  }

  // No pipeline configuration found
  return {
    type: 'none',
    pipelines: [],
    globalEnv: [],
    globalDotEnv: [],
  };
}

/**
 * Validate env vars for a specific pipeline
 */
export function validatePipelineEnv(
  pipeline: Pipeline,
  definedVars: Set<string>,
  globalEnv: string[]
): { missing: string[]; extra: string[] } {
  const missing: string[] = [];
  const extra: string[] = [];

  // Check if all required env vars are defined
  const requiredVars = new Set([
    ...(pipeline.env || []),
    ...globalEnv,
  ]);

  for (const varName of requiredVars) {
    // Handle wildcards
    if (varName.includes('*')) {
      const pattern = new RegExp('^' + varName.replace(/\*/g, '.*') + '$');
      const hasMatch = Array.from(definedVars).some(v => pattern.test(v));
      if (!hasMatch) {
        missing.push(varName);
      }
    } else if (!definedVars.has(varName)) {
      missing.push(varName);
    }
  }

  return { missing, extra };
}

/**
 * Get env vars required by a pipeline
 */
export function getPipelineEnvVars(
  pipelineName: string,
  config: PipelineConfig
): { env: string[]; dotEnv: string[] } {
  const pipeline = config.pipelines.find(p => p.name === pipelineName);

  if (!pipeline) {
    return { env: [], dotEnv: [] };
  }

  return {
    env: [...(pipeline.env || []), ...config.globalEnv],
    dotEnv: [...(pipeline.dotEnv || []), ...config.globalDotEnv],
  };
}

/**
 * Report pipeline configuration
 */
export function formatPipelineReport(config: PipelineConfig): string {
  const lines: string[] = [];

  lines.push(`Pipeline Configuration (${config.type})`);
  lines.push('═'.repeat(50));
  lines.push('');

  if (config.globalEnv.length > 0) {
    lines.push('Global Environment Variables:');
    for (const env of config.globalEnv) {
      lines.push(`  • ${env}`);
    }
    lines.push('');
  }

  if (config.globalDotEnv.length > 0) {
    lines.push('Global .env Files:');
    for (const dotEnv of config.globalDotEnv) {
      lines.push(`  • ${dotEnv}`);
    }
    lines.push('');
  }

  if (config.pipelines.length > 0) {
    lines.push('Pipelines:');
    for (const pipeline of config.pipelines) {
      lines.push(`  ${pipeline.name}:`);
      if (pipeline.env && pipeline.env.length > 0) {
        lines.push(`    env: ${pipeline.env.join(', ')}`);
      }
      if (pipeline.dotEnv && pipeline.dotEnv.length > 0) {
        lines.push(`    dotEnv: ${pipeline.dotEnv.join(', ')}`);
      }
      if (pipeline.dependsOn && pipeline.dependsOn.length > 0) {
        lines.push(`    dependsOn: ${pipeline.dependsOn.join(', ')}`);
      }
    }
  }

  return lines.join('\n');
}

