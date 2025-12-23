import simpleGit, { SimpleGit } from 'simple-git';
import type { GitScanResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Patterns that indicate a secret value in git history
 */
const SECRET_VALUE_PATTERNS = [
  // API Keys
  /^sk[-_]live[-_][a-zA-Z0-9]{24,}/,
  /^sk[-_]test[-_][a-zA-Z0-9]{24,}/,
  /^pk[-_]live[-_][a-zA-Z0-9]{24,}/,
  /^pk[-_]test[-_][a-zA-Z0-9]{24,}/,
  // AWS
  /^AKIA[A-Z0-9]{16}/,
  /^[a-zA-Z0-9/+=]{40}/, // AWS secret key pattern
  // GitHub
  /^ghp_[a-zA-Z0-9]{36}/,
  /^gho_[a-zA-Z0-9]{36}/,
  /^github_pat_[a-zA-Z0-9_]{22,}/,
  // JWT
  /^eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/,
  // Generic secrets (long alphanumeric strings)
  /^[a-zA-Z0-9]{32,}/,
  // Database URLs with credentials
  /^(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@/,
  // Private keys
  /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
];

/**
 * Variable names that typically contain secrets
 */
const SECRET_VAR_NAMES = [
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /access[_-]?token/i,
  /auth[_-]?token/i,
  /credentials?/i,
  /^AWS_SECRET/i,
  /^DATABASE_URL$/,
  /^REDIS_URL$/,
];

export interface GitScanOptions {
  /** Root directory of the git repository */
  rootDir: string;
  /** How many commits back to scan */
  depth?: number;
  /** Specific files to scan (glob patterns) */
  files?: string[];
  /** Include only specific branches */
  branches?: string[];
}

/**
 * Scan git history for leaked secrets
 */
export async function scanGitHistory(options: GitScanOptions): Promise<{
  results: GitScanResult[];
  error?: string;
}> {
  const { rootDir, depth = 100, files } = options;
  const results: GitScanResult[] = [];

  let git: SimpleGit;
  try {
    git = simpleGit(rootDir);

    // Check if this is a git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return { results: [], error: 'Not a git repository' };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { results: [], error: `Failed to initialize git: ${message}` };
  }

  try {
    // Get commit history
    const logOptions = [
      `-${depth}`,
      '--all',
      '--format=%H|%an|%ai',
      '-p', // Show patches
    ];

    if (files && files.length > 0) {
      logOptions.push('--', ...files);
    }

    const log = await git.raw(logOptions);

    // Parse the log output
    const commits = parseGitLog(log);

    for (const commit of commits) {
      // Look for env-like patterns in the diff
      const secrets = findSecretsInDiff(commit.diff);

      for (const secret of secrets) {
        results.push({
          commit: commit.hash,
          author: commit.author,
          date: commit.date,
          file: secret.file,
          line: secret.line,
          variable: secret.variable,
          redactedValue: redactValue(secret.value),
        });
      }
    }

    logger.debug(`Scanned ${commits.length} commits, found ${results.length} potential secrets`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { results, error: `Git scan error: ${message}` };
  }

  return { results };
}

interface ParsedCommit {
  hash: string;
  author: string;
  date: string;
  diff: string;
}

/**
 * Parse git log output
 */
function parseGitLog(log: string): ParsedCommit[] {
  const commits: ParsedCommit[] = [];
  const commitRegex = /^([a-f0-9]{40})\|([^|]*)\|([^|]*)\n([\s\S]*?)(?=\n[a-f0-9]{40}\||\n*$)/gm;

  let match;
  while ((match = commitRegex.exec(log)) !== null) {
    commits.push({
      hash: match[1],
      author: match[2],
      date: match[3],
      diff: match[4],
    });
  }

  // If regex didn't work, try line-by-line parsing
  if (commits.length === 0) {
    const lines = log.split('\n');
    let currentCommit: ParsedCommit | null = null;
    let diffLines: string[] = [];

    for (const line of lines) {
      const headerMatch = line.match(/^([a-f0-9]{40})\|([^|]*)\|(.*)$/);
      if (headerMatch) {
        if (currentCommit) {
          currentCommit.diff = diffLines.join('\n');
          commits.push(currentCommit);
        }
        currentCommit = {
          hash: headerMatch[1],
          author: headerMatch[2],
          date: headerMatch[3],
          diff: '',
        };
        diffLines = [];
      } else if (currentCommit) {
        diffLines.push(line);
      }
    }

    if (currentCommit) {
      currentCommit.diff = diffLines.join('\n');
      commits.push(currentCommit);
    }
  }

  return commits;
}

interface SecretMatch {
  file: string;
  line: number;
  variable: string;
  value: string;
}

/**
 * Find secrets in a git diff
 */
function findSecretsInDiff(diff: string): SecretMatch[] {
  const secrets: SecretMatch[] = [];
  const lines = diff.split('\n');

  let currentFile = '';
  let lineNumber = 0;

  for (const line of lines) {
    // Track file changes
    const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      lineNumber = 0;
      continue;
    }

    // Track line numbers
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunkMatch) {
      lineNumber = parseInt(hunkMatch[1], 10) - 1;
      continue;
    }

    // Only check added lines in env-like files
    if (line.startsWith('+') && !line.startsWith('+++')) {
      lineNumber++;

      // Check if this is an env file or contains env-like patterns
      if (isEnvFile(currentFile) || containsEnvPattern(line)) {
        const envMatch = line.match(/^\+\s*([A-Z_][A-Z0-9_]*)=(.+)$/);
        if (envMatch) {
          const [, variable, value] = envMatch;

          // Check if this looks like a secret
          if (isLikelySecret(variable, value)) {
            secrets.push({
              file: currentFile,
              line: lineNumber,
              variable,
              value,
            });
          }
        }
      }
    } else if (!line.startsWith('-')) {
      lineNumber++;
    }
  }

  return secrets;
}

/**
 * Check if a file is an env file
 */
function isEnvFile(filename: string): boolean {
  const envPatterns = [/^\.env/, /\.env$/, /\.env\./];
  return envPatterns.some((pattern) => pattern.test(filename));
}

/**
 * Check if a line contains env-like patterns
 */
function containsEnvPattern(line: string): boolean {
  return /[A-Z_][A-Z0-9_]*=.+/.test(line);
}

/**
 * Check if a variable/value pair looks like a secret
 */
function isLikelySecret(variable: string, value: string): boolean {
  // Check variable name
  for (const pattern of SECRET_VAR_NAMES) {
    if (pattern.test(variable)) {
      return true;
    }
  }

  // Check value patterns
  for (const pattern of SECRET_VALUE_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }

  // Check for high entropy (likely random strings)
  if (value.length > 20 && hasHighEntropy(value)) {
    return true;
  }

  return false;
}

/**
 * Simple entropy check for detecting random strings
 */
function hasHighEntropy(str: string): boolean {
  const charCounts: Record<string, number> = {};
  for (const char of str) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }

  const uniqueChars = Object.keys(charCounts).length;
  const ratio = uniqueChars / str.length;

  // High ratio of unique characters suggests randomness
  return ratio > 0.4 && uniqueChars > 10;
}

/**
 * Redact a secret value for display
 */
function redactValue(value: string): string {
  if (value.length <= 8) {
    return '****';
  }

  const visibleStart = value.slice(0, 4);
  const visibleEnd = value.slice(-4);
  return `${visibleStart}...${visibleEnd}`;
}

/**
 * Check if the current directory is a git repository
 */
export async function isGitRepository(rootDir: string): Promise<boolean> {
  try {
    const git = simpleGit(rootDir);
    return await git.checkIsRepo();
  } catch {
    return false;
  }
}

