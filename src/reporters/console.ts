import pc from 'picocolors';
import type { AnalysisResult, Issue, IssueType, Severity } from '../types/index.js';

const SEVERITY_ICONS: Record<Severity, string> = {
  error: pc.red('✗'),
  warning: pc.yellow('⚠'),
  info: pc.blue('ℹ'),
};

const SEVERITY_COLORS: Record<Severity, (text: string) => string> = {
  error: pc.red,
  warning: pc.yellow,
  info: pc.blue,
};

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  missing: 'Missing Variables',
  unused: 'Unused Variables',
  'type-mismatch': 'Type Mismatches',
  'sync-drift': 'Sync Drift',
  'secret-exposed': 'Exposed Secrets',
  'invalid-value': 'Invalid Values',
  'dynamic-access': 'Dynamic Access',
};

export interface ConsoleReporterOptions {
  /** Show verbose output */
  verbose?: boolean;
  /** Show colors (default: true) */
  colors?: boolean;
  /** Maximum issues to show per category */
  maxIssuesPerCategory?: number;
}

/**
 * Report analysis results to the console
 */
export function reportToConsole(
  result: AnalysisResult,
  options: ConsoleReporterOptions = {}
): void {
  const { verbose = false, maxIssuesPerCategory = 10 } = options;

  // Print header
  console.log();
  console.log(pc.bold(pc.cyan('env-doctor')) + pc.gray(' v1.0.0'));
  console.log();

  // Group issues by type
  const issuesByType = groupIssuesByType(result.issues);

  // Print framework info
  console.log(pc.gray(`Framework: ${result.framework}`));
  console.log(
    pc.gray(
      `Scanned ${result.stats.filesScanned} files, ${result.definedVariables.length} env variables`
    )
  );
  console.log();

  // Print issues by category
  let hasIssues = false;

  for (const [type, issues] of Object.entries(issuesByType)) {
    if (issues.length === 0) continue;
    hasIssues = true;

    const label = ISSUE_TYPE_LABELS[type as IssueType] || type;
    const severity = issues[0].severity;
    const icon = SEVERITY_ICONS[severity];
    const color = SEVERITY_COLORS[severity];

    console.log(color(pc.bold(`${icon} ${label} (${issues.length} ${issues.length === 1 ? 'issue' : 'issues'})`)));
    console.log();

    const displayIssues = issues.slice(0, maxIssuesPerCategory);
    for (const issue of displayIssues) {
      printIssue(issue, verbose);
    }

    if (issues.length > maxIssuesPerCategory) {
      console.log(
        pc.gray(`  ... and ${issues.length - maxIssuesPerCategory} more`)
      );
    }

    console.log();
  }

  // Print sync status if no sync issues
  if (!issuesByType['sync-drift']?.length && result.templateVariables) {
    console.log(pc.green('✓ ') + pc.bold('Sync Check'));
    console.log(pc.gray('  .env and template are in sync'));
    console.log();
  }

  // Print summary
  printSummary(result);

  // Print recommendations if there are critical issues
  if (result.stats.errorCount > 0) {
    console.log();
    console.log(pc.bold('Recommendations:'));
    console.log(pc.gray('  Run `env-doctor fix` to interactively resolve issues'));
    console.log(pc.gray('  Run `env-doctor init` to generate a .env.example file'));
  }

  if (!hasIssues) {
    console.log(pc.green(pc.bold('✓ No issues found!')));
    console.log();
  }
}

/**
 * Print a single issue
 */
function printIssue(issue: Issue, verbose: boolean): void {
  const { variable, message, location, fix } = issue;

  // Variable name
  console.log(`  ${pc.bold(variable)}`);

  // Message
  console.log(`    ${pc.gray(message)}`);

  // Location
  if (location) {
    const loc = location.column
      ? `${location.file}:${location.line}:${location.column}`
      : `${location.file}:${location.line}`;
    console.log(`    ${pc.dim('at')} ${pc.cyan(loc)}`);
  }

  // Fix suggestion
  if (fix && verbose) {
    console.log(`    ${pc.green('fix:')} ${fix}`);
  }

  console.log();
}

/**
 * Print summary
 */
function printSummary(result: AnalysisResult): void {
  const { errorCount, warningCount, infoCount, duration } = result.stats;

  console.log(pc.gray('─'.repeat(50)));
  console.log();

  const parts: string[] = [];

  if (errorCount > 0) {
    parts.push(pc.red(`${errorCount} ${errorCount === 1 ? 'error' : 'errors'}`));
  }
  if (warningCount > 0) {
    parts.push(pc.yellow(`${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}`));
  }
  if (infoCount > 0) {
    parts.push(pc.blue(`${infoCount} info`));
  }

  if (parts.length > 0) {
    console.log(`Summary: ${parts.join(', ')}`);
  } else {
    console.log(pc.green('Summary: All checks passed!'));
  }

  console.log(pc.gray(`Completed in ${duration}ms`));
  console.log();
}

/**
 * Group issues by type
 */
function groupIssuesByType(issues: Issue[]): Record<string, Issue[]> {
  const groups: Record<string, Issue[]> = {};

  // Initialize all types to maintain order
  for (const type of Object.keys(ISSUE_TYPE_LABELS)) {
    groups[type] = [];
  }

  for (const issue of issues) {
    if (!groups[issue.type]) {
      groups[issue.type] = [];
    }
    groups[issue.type].push(issue);
  }

  return groups;
}

/**
 * Format for CI output (minimal, good for logs)
 */
export function reportForCI(result: AnalysisResult): void {
  for (const issue of result.issues) {
    const level = issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'notice';
    const location = issue.location
      ? `${issue.location.file}:${issue.location.line}`
      : '';

    // GitHub Actions annotation format
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::${level} file=${location}::${issue.message}`);
    } else {
      console.log(`[${level.toUpperCase()}] ${location ? location + ': ' : ''}${issue.message}`);
    }
  }

  // Exit summary
  const { errorCount, warningCount } = result.stats;
  if (errorCount > 0) {
    console.log(`\nFound ${errorCount} error(s) and ${warningCount} warning(s)`);
  }
}

/**
 * Create a spinner for progress indication
 */
export function createSpinner(text: string): {
  start: () => void;
  stop: (success?: boolean) => void;
  update: (newText: string) => void;
} {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;
  let intervalId: NodeJS.Timeout | null = null;
  let currentText = text;
  const isTTY = process.stdout.isTTY;

  return {
    start() {
      if (isTTY) {
        process.stdout.write(`${pc.cyan(frames[frameIndex])} ${currentText}`);
        intervalId = setInterval(() => {
          frameIndex = (frameIndex + 1) % frames.length;
          process.stdout.clearLine?.(0);
          process.stdout.cursorTo?.(0);
          process.stdout.write(`${pc.cyan(frames[frameIndex])} ${currentText}`);
        }, 80);
      } else {
        console.log(`${pc.cyan('...')} ${currentText}`);
      }
    },
    stop(success = true) {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      const icon = success ? pc.green('✓') : pc.red('✗');
      if (isTTY) {
        process.stdout.clearLine?.(0);
        process.stdout.cursorTo?.(0);
      }
      console.log(`${icon} ${currentText}`);
    },
    update(newText: string) {
      currentText = newText;
    },
  };
}

