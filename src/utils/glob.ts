import { glob } from 'glob';
import { resolve } from 'node:path';

export interface GlobOptions {
  /** Root directory to search from */
  cwd: string;
  /** Patterns to include */
  include: string[];
  /** Patterns to exclude */
  exclude: string[];
  /** Follow symlinks */
  followSymlinks?: boolean;
}

/**
 * Find files matching glob patterns
 */
export async function findFiles(options: GlobOptions): Promise<string[]> {
  const { cwd, include, exclude, followSymlinks = false } = options;

  const files = await glob(include, {
    cwd,
    ignore: exclude,
    absolute: true,
    nodir: true,
    follow: followSymlinks,
  });

  return files.map((f) => resolve(f));
}

/**
 * Check if a path matches any of the given patterns
 */
export function matchesPattern(path: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Simple wildcard matching for now
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (path.startsWith(prefix)) {
        return true;
      }
    } else if (path === pattern || path.includes(pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a variable name matches ignore patterns
 */
export function shouldIgnoreVariable(
  variable: string,
  ignorePatterns: string[],
  ruleType?: string
): boolean {
  for (const pattern of ignorePatterns) {
    // Check for rule-specific ignore (e.g., "unused:DEBUG")
    if (pattern.includes(':')) {
      const [rule, varPattern] = pattern.split(':');
      if (ruleType && rule === ruleType) {
        if (matchesVariablePattern(variable, varPattern)) {
          return true;
        }
      }
    } else {
      // Check general variable pattern
      if (matchesVariablePattern(variable, pattern)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Match a variable name against a pattern with wildcard support
 */
function matchesVariablePattern(variable: string, pattern: string): boolean {
  if (pattern.endsWith('*')) {
    return variable.startsWith(pattern.slice(0, -1));
  }
  if (pattern.startsWith('*')) {
    return variable.endsWith(pattern.slice(1));
  }
  return variable === pattern;
}

