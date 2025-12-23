import { readFile, access, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Read a file as text, returning null if it doesn't exist
 */
export async function readFileText(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Read a JSON file, returning null if it doesn't exist or is invalid
 */
export async function readJsonFile<T = unknown>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Resolve a path relative to a root directory
 */
export function resolvePath(root: string, ...paths: string[]): string {
  return resolve(root, ...paths);
}

/**
 * Get relative path from root
 */
export function relativePath(root: string, path: string): string {
  return relative(root, path);
}

/**
 * Get directory name from path
 */
export function getDirname(path: string): string {
  return dirname(path);
}

/**
 * Find a file by searching up the directory tree
 */
export async function findUp(filename: string, startDir: string): Promise<string | null> {
  let currentDir = resolve(startDir);
  const root = resolve('/');

  while (currentDir !== root) {
    const filePath = resolve(currentDir, filename);
    if (await fileExists(filePath)) {
      return filePath;
    }
    currentDir = dirname(currentDir);
  }

  return null;
}

