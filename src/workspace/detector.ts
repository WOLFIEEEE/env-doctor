/**
 * @fileoverview Workspace detection for monorepos
 */

import { resolve, join } from 'node:path';
import { readFile, readdir, stat } from 'node:fs/promises';
import type { WorkspaceDetectionResult, WorkspaceType, PackageInfo } from './types.js';
import { fileExists, readJsonFile } from '../utils/fs.js';
import { findFiles } from '../utils/glob.js';
import { logger } from '../utils/logger.js';
import { detectFramework } from '../frameworks/index.js';

/**
 * Detect workspace configuration
 */
export async function detectWorkspace(rootDir: string): Promise<WorkspaceDetectionResult> {
  logger.debug('Detecting workspace type...');

  // Check for various workspace configurations in order of priority
  const detectors: Array<() => Promise<WorkspaceDetectionResult | null>> = [
    () => detectTurbo(rootDir),
    () => detectNx(rootDir),
    () => detectPnpm(rootDir),
    () => detectYarn(rootDir),
    () => detectNpm(rootDir),
    () => detectLerna(rootDir),
  ];

  for (const detect of detectors) {
    const result = await detect();
    if (result) {
      logger.debug(`Detected workspace type: ${result.type}`);
      return result;
    }
  }

  return {
    type: 'none',
    rootDir,
    patterns: [],
  };
}

/**
 * Detect Turborepo configuration
 */
async function detectTurbo(rootDir: string): Promise<WorkspaceDetectionResult | null> {
  const turboPath = resolve(rootDir, 'turbo.json');
  
  if (!await fileExists(turboPath)) {
    return null;
  }

  // Turbo uses npm/yarn/pnpm workspaces under the hood
  const packageJson = await readJsonFile<{
    workspaces?: string[] | { packages?: string[] };
  }>(resolve(rootDir, 'package.json'));

  let patterns: string[] = [];
  if (packageJson?.workspaces) {
    patterns = Array.isArray(packageJson.workspaces)
      ? packageJson.workspaces
      : packageJson.workspaces.packages || [];
  }

  return {
    type: 'turbo',
    rootDir,
    patterns,
    configFile: turboPath,
  };
}

/**
 * Detect Nx configuration
 */
async function detectNx(rootDir: string): Promise<WorkspaceDetectionResult | null> {
  const nxPath = resolve(rootDir, 'nx.json');
  
  if (!await fileExists(nxPath)) {
    return null;
  }

  // Nx can use various project structures
  const nxConfig = await readJsonFile<{
    workspaceLayout?: { appsDir?: string; libsDir?: string };
  }>(nxPath);

  const patterns: string[] = [];
  if (nxConfig?.workspaceLayout) {
    if (nxConfig.workspaceLayout.appsDir) {
      patterns.push(`${nxConfig.workspaceLayout.appsDir}/*`);
    }
    if (nxConfig.workspaceLayout.libsDir) {
      patterns.push(`${nxConfig.workspaceLayout.libsDir}/*`);
    }
  } else {
    // Default Nx structure
    patterns.push('apps/*', 'libs/*', 'packages/*');
  }

  return {
    type: 'nx',
    rootDir,
    patterns,
    configFile: nxPath,
  };
}

/**
 * Detect pnpm workspace
 */
async function detectPnpm(rootDir: string): Promise<WorkspaceDetectionResult | null> {
  const pnpmWorkspacePath = resolve(rootDir, 'pnpm-workspace.yaml');
  
  if (!await fileExists(pnpmWorkspacePath)) {
    return null;
  }

  // Parse YAML (simple regex-based for this use case)
  const content = await readFile(pnpmWorkspacePath, 'utf-8');
  const patterns: string[] = [];

  // Simple YAML parsing for packages array
  const packagesMatch = content.match(/packages:\s*\n((?:\s+-\s+.+\n?)+)/);
  if (packagesMatch) {
    const lines = packagesMatch[1].split('\n');
    for (const line of lines) {
      const match = line.match(/^\s+-\s+['"]?(.+?)['"]?\s*$/);
      if (match) {
        patterns.push(match[1]);
      }
    }
  }

  return {
    type: 'pnpm',
    rootDir,
    patterns,
    configFile: pnpmWorkspacePath,
  };
}

/**
 * Detect Yarn workspace (v1 or v2+)
 */
async function detectYarn(rootDir: string): Promise<WorkspaceDetectionResult | null> {
  // Check for yarn.lock
  const yarnLockPath = resolve(rootDir, 'yarn.lock');
  if (!await fileExists(yarnLockPath)) {
    return null;
  }

  const packageJson = await readJsonFile<{
    workspaces?: string[] | { packages?: string[] };
  }>(resolve(rootDir, 'package.json'));

  if (!packageJson?.workspaces) {
    return null;
  }

  const patterns = Array.isArray(packageJson.workspaces)
    ? packageJson.workspaces
    : packageJson.workspaces.packages || [];

  return {
    type: 'yarn',
    rootDir,
    patterns,
    configFile: resolve(rootDir, 'package.json'),
  };
}

/**
 * Detect npm workspace
 */
async function detectNpm(rootDir: string): Promise<WorkspaceDetectionResult | null> {
  const packageJson = await readJsonFile<{
    workspaces?: string[] | { packages?: string[] };
  }>(resolve(rootDir, 'package.json'));

  if (!packageJson?.workspaces) {
    return null;
  }

  const patterns = Array.isArray(packageJson.workspaces)
    ? packageJson.workspaces
    : packageJson.workspaces.packages || [];

  // Verify package-lock.json exists (to distinguish from yarn)
  const packageLockPath = resolve(rootDir, 'package-lock.json');
  if (!await fileExists(packageLockPath)) {
    return null;
  }

  return {
    type: 'npm',
    rootDir,
    patterns,
    configFile: resolve(rootDir, 'package.json'),
  };
}

/**
 * Detect Lerna workspace
 */
async function detectLerna(rootDir: string): Promise<WorkspaceDetectionResult | null> {
  const lernaPath = resolve(rootDir, 'lerna.json');
  
  if (!await fileExists(lernaPath)) {
    return null;
  }

  const lernaConfig = await readJsonFile<{
    packages?: string[];
  }>(lernaPath);

  return {
    type: 'lerna',
    rootDir,
    patterns: lernaConfig?.packages || ['packages/*'],
    configFile: lernaPath,
  };
}

/**
 * Find all packages in a workspace
 */
export async function findPackages(
  workspace: WorkspaceDetectionResult
): Promise<PackageInfo[]> {
  const packages: PackageInfo[] = [];

  if (workspace.type === 'none' || workspace.patterns.length === 0) {
    return packages;
  }

  logger.debug(`Finding packages with patterns: ${workspace.patterns.join(', ')}`);

  // Expand glob patterns to find package directories
  for (const pattern of workspace.patterns) {
    const packageDirs = await findPackageDirectories(workspace.rootDir, pattern);
    
    for (const dir of packageDirs) {
      const packageInfo = await getPackageInfo(dir, workspace.rootDir);
      if (packageInfo) {
        packages.push(packageInfo);
      }
    }
  }

  // Sort by name
  packages.sort((a, b) => a.name.localeCompare(b.name));

  logger.debug(`Found ${packages.length} packages`);
  return packages;
}

/**
 * Expand a pattern to find package directories
 */
async function findPackageDirectories(rootDir: string, pattern: string): Promise<string[]> {
  const dirs: string[] = [];

  // Handle negation patterns
  if (pattern.startsWith('!')) {
    return dirs;
  }

  // Simple glob expansion
  if (pattern.includes('*')) {
    // Replace glob with regex-like matching
    const baseDir = pattern.split('*')[0].replace(/\/$/, '');
    const basePath = resolve(rootDir, baseDir);

    try {
      const entries = await readdir(basePath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packagePath = join(basePath, entry.name);
          // Check if this directory has a package.json
          if (await fileExists(join(packagePath, 'package.json'))) {
            dirs.push(packagePath);
          }
        }
      }
    } catch {
      // Directory might not exist
    }
  } else {
    // Direct path
    const packagePath = resolve(rootDir, pattern);
    if (await fileExists(join(packagePath, 'package.json'))) {
      dirs.push(packagePath);
    }
  }

  return dirs;
}

/**
 * Get package information from a directory
 */
async function getPackageInfo(
  packageDir: string,
  rootDir: string
): Promise<PackageInfo | null> {
  const packageJsonPath = join(packageDir, 'package.json');
  
  if (!await fileExists(packageJsonPath)) {
    return null;
  }

  const packageJson = await readJsonFile<{
    name: string;
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }>(packageJsonPath);

  if (!packageJson?.name) {
    return null;
  }

  // Find env files
  const envFiles: string[] = [];
  const possibleEnvFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  
  for (const envFile of possibleEnvFiles) {
    if (await fileExists(join(packageDir, envFile))) {
      envFiles.push(envFile);
    }
  }

  // Detect framework
  const framework = await detectFramework(packageDir);

  // Find workspace dependencies
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const workspaceDeps = Object.keys(allDeps).filter(dep => {
    const version = allDeps[dep];
    return version.startsWith('workspace:') || version.startsWith('*') || version === '^';
  });

  // Calculate relative path
  const relativePath = packageDir.replace(rootDir, '').replace(/^[/\\]/, '');

  return {
    name: packageJson.name,
    path: relativePath,
    absolutePath: packageDir,
    framework,
    hasEnvFile: envFiles.length > 0,
    envFiles,
    packageJson: {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: packageJson.dependencies,
      devDependencies: packageJson.devDependencies,
    },
    workspaceDependencies: workspaceDeps,
  };
}

/**
 * Check if a directory is a valid package
 */
export async function isPackageDirectory(dir: string): Promise<boolean> {
  return fileExists(join(dir, 'package.json'));
}

