#!/usr/bin/env node

import { Command } from 'commander';
import pc from 'picocolors';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { loadConfig, generateConfigTemplate, getEnvSpecificConfig } from './config.js';
import { analyze } from './core.js';
import { reportToConsole, reportForCI, createSpinner } from './reporters/console.js';
import { reportToJSON } from './reporters/json.js';
import { reportToSARIF } from './reporters/sarif.js';
import { scanGitHistory } from './scanner/git-scanner.js';
import { generateTemplate } from './analyzers/sync-check.js';
import { getSecurityRecommendations } from './analyzers/secret-patterns.js';
import { logger } from './utils/logger.js';
import { fileExists } from './utils/fs.js';
import type { AnalysisResult } from './types/index.js';

const VERSION = '1.0.0';

const program = new Command();

program
  .name('env-doctor')
  .description('Analyze and validate environment variables in your codebase')
  .version(VERSION);

// Default command - scan
program
  .argument('[directory]', 'Directory to scan', process.cwd())
  .option('-c, --config <path>', 'Path to config file')
  .option('-e, --env <environment>', 'Target environment (development, production, test)')
  .option('-f, --format <format>', 'Output format (console, json, sarif)', 'console')
  .option('--ci', 'CI mode - exit with code 1 on errors')
  .option('-v, --verbose', 'Verbose output')
  .option('--strict', 'Treat warnings as errors')
  .action(async (directory: string, options) => {
    await runScan(directory, options);
  });

// Init command - create config and .env.example
program
  .command('init')
  .description('Initialize env-doctor in your project')
  .option('--config-only', 'Only create config file')
  .option('--example-only', 'Only create .env.example')
  .option('-f, --force', 'Overwrite existing files')
  .action(async (options) => {
    await runInit(options);
  });

// Fix command - interactive fixing
program
  .command('fix')
  .description('Interactively fix environment issues')
  .option('-c, --config <path>', 'Path to config file')
  .option('--dry-run', 'Show what would be fixed without making changes')
  .action(async (options) => {
    await runFix(options);
  });

// Scan history command
program
  .command('scan-history')
  .description('Scan git history for leaked secrets')
  .option('-d, --depth <number>', 'Number of commits to scan', '100')
  .option('-f, --format <format>', 'Output format (console, json)', 'console')
  .action(async (options) => {
    await runScanHistory(options);
  });

// Watch command
program
  .command('watch')
  .description('Watch for changes and re-analyze')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    await runWatch(options);
  });

// Parse and execute
program.parse();

/**
 * Main scan command
 */
async function runScan(
  directory: string,
  options: {
    config?: string;
    env?: string;
    format: string;
    ci?: boolean;
    verbose?: boolean;
    strict?: boolean;
  }
): Promise<void> {
  const rootDir = resolve(directory);

  if (options.verbose) {
    logger.setVerbose(true);
  }

  try {
    // Load config
    let { config } = await loadConfig(options.config, rootDir);

    // Apply environment-specific overrides
    if (options.env) {
      config = getEnvSpecificConfig(config, options.env);
    }

    // Apply strict mode
    if (options.strict) {
      config.strict = true;
    }

    // Run analysis
    const spinner = options.format === 'console' && !options.ci ? createSpinner('Scanning project...') : null;
    spinner?.start();

    const result = await analyze({ config, verbose: options.verbose });

    spinner?.stop(result.stats.errorCount === 0);

    // Output results
    switch (options.format) {
      case 'json':
        console.log(reportToJSON(result));
        break;
      case 'sarif':
        console.log(reportToSARIF(result));
        break;
      default:
        if (options.ci) {
          reportForCI(result);
        } else {
          reportToConsole(result, { verbose: options.verbose });
        }
    }

    // Exit with appropriate code
    const hasErrors = config.strict
      ? result.stats.errorCount > 0 || result.stats.warningCount > 0
      : result.stats.errorCount > 0;

    if (options.ci && hasErrors) {
      process.exit(1);
    }
  } catch (err) {
    logger.error('Analysis failed:', err instanceof Error ? err.message : 'Unknown error');
    if (options.verbose && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

/**
 * Init command
 */
async function runInit(options: {
  configOnly?: boolean;
  exampleOnly?: boolean;
  force?: boolean;
}): Promise<void> {
  const rootDir = process.cwd();

  console.log();
  console.log(pc.bold(pc.cyan('env-doctor')) + ' init');
  console.log();

  // Create config file
  if (!options.exampleOnly) {
    const configPath = resolve(rootDir, 'env-doctor.config.js');

    if ((await fileExists(configPath)) && !options.force) {
      logger.warn('Config file already exists. Use --force to overwrite.');
    } else {
      await writeFile(configPath, generateConfigTemplate());
      logger.success(`Created ${pc.cyan('env-doctor.config.js')}`);
    }
  }

  // Create .env.example
  if (!options.configOnly) {
    const examplePath = resolve(rootDir, '.env.example');

    if ((await fileExists(examplePath)) && !options.force) {
      logger.warn('.env.example already exists. Use --force to overwrite.');
    } else {
      // Scan the project first to find all used variables
      const { config } = await loadConfig(undefined, rootDir);
      const result = await analyze({ config });

      // Generate template from used variables
      const allVars = [
        ...result.definedVariables,
        ...result.usedVariables
          .filter((u) => u.name !== '<dynamic>')
          .filter((u) => !result.definedVariables.find((d) => d.name === u.name))
          .map((u) => ({
            name: u.name,
            value: '',
            line: 0,
            file: '.env.example',
          })),
      ];

      // Remove duplicates
      const uniqueVars = Array.from(new Map(allVars.map((v) => [v.name, v])).values());

      const templateContent = generateTemplate(uniqueVars, {
        includeComments: true,
        groupByPrefix: true,
        maskSecrets: true,
      });

      await writeFile(examplePath, templateContent);
      logger.success(`Created ${pc.cyan('.env.example')} with ${uniqueVars.length} variables`);
    }
  }

  console.log();
  console.log(pc.gray('Next steps:'));
  console.log(pc.gray('  1. Edit env-doctor.config.js to customize rules'));
  console.log(pc.gray('  2. Run `env-doctor` to scan your project'));
  console.log();
}

/**
 * Fix command - interactive mode
 */
async function runFix(options: {
  config?: string;
  dryRun?: boolean;
}): Promise<void> {
  const rootDir = process.cwd();

  console.log();
  console.log(pc.bold(pc.cyan('env-doctor')) + ' fix');
  console.log();

  try {
    // Load config and analyze
    const { config } = await loadConfig(options.config, rootDir);
    const result = await analyze({ config });

    if (result.issues.length === 0) {
      logger.success('No issues to fix!');
      return;
    }

    // Import inquirer dynamically
    const { select, confirm, input } = await import('@inquirer/prompts');

    // Group fixable issues
    const missingIssues = result.issues.filter((i) => i.type === 'missing');
    const syncIssues = result.issues.filter((i) => i.type === 'sync-drift');

    if (missingIssues.length > 0) {
      console.log(pc.yellow(`\nFound ${missingIssues.length} missing variable(s)`));

      for (const issue of missingIssues) {
        const action = await select({
          message: `${issue.variable} - ${issue.message}`,
          choices: [
            { name: 'Add to .env', value: 'add' },
            { name: 'Add to ignore list', value: 'ignore' },
            { name: 'Skip', value: 'skip' },
          ],
        });

        if (action === 'add') {
          const value = await input({
            message: `Enter value for ${issue.variable}:`,
            default: '',
          });

          if (!options.dryRun) {
            // Append to .env file
            const envPath = resolve(rootDir, '.env');
            const content = `\n${issue.variable}=${value}\n`;
            await writeFile(envPath, content, { flag: 'a' });
            logger.success(`Added ${issue.variable} to .env`);
          } else {
            logger.info(`[dry-run] Would add ${issue.variable}=${value} to .env`);
          }
        } else if (action === 'ignore') {
          logger.info(`Add '${issue.variable}' to ignore list in config`);
        }
      }
    }

    if (syncIssues.length > 0) {
      console.log(pc.yellow(`\nFound ${syncIssues.length} sync issue(s)`));

      const shouldSync = await confirm({
        message: 'Update .env.example to match .env?',
        default: true,
      });

      if (shouldSync && !options.dryRun) {
        const examplePath = resolve(rootDir, '.env.example');
        const templateContent = generateTemplate(result.definedVariables, {
          includeComments: true,
          groupByPrefix: true,
          maskSecrets: true,
        });

        await writeFile(examplePath, templateContent);
        logger.success('Updated .env.example');
      }
    }

    // Show security recommendations if applicable
    const recommendations = getSecurityRecommendations(result.issues);
    if (recommendations.length > 0) {
      console.log();
      console.log(pc.bold('Security Recommendations:'));
      for (const rec of recommendations) {
        console.log(pc.gray(`  • ${rec}`));
      }
    }

    console.log();
  } catch (err) {
    if ((err as Error).name === 'ExitPromptError') {
      // User cancelled
      console.log();
      return;
    }
    throw err;
  }
}

/**
 * Scan git history command
 */
async function runScanHistory(options: {
  depth: string;
  format: string;
}): Promise<void> {
  const rootDir = process.cwd();
  const depth = parseInt(options.depth, 10);

  console.log();
  console.log(pc.bold(pc.cyan('env-doctor')) + ' scan-history');
  console.log();

  const spinner = createSpinner(`Scanning last ${depth} commits...`);
  spinner.start();

  const { results, error } = await scanGitHistory({
    rootDir,
    depth,
  });

  spinner.stop(!error);

  if (error) {
    logger.error(error);
    process.exit(1);
  }

  if (results.length === 0) {
    logger.success('No leaked secrets found in git history');
    return;
  }

  if (options.format === 'json') {
    console.log(JSON.stringify({ results }, null, 2));
    return;
  }

  console.log(pc.red(`\n⚠ Found ${results.length} potential secret(s) in git history:\n`));

  for (const result of results) {
    console.log(pc.bold(`  ${result.variable}`));
    console.log(pc.gray(`    Commit: ${result.commit.slice(0, 8)}`));
    console.log(pc.gray(`    File: ${result.file}:${result.line}`));
    console.log(pc.gray(`    Author: ${result.author}`));
    console.log(pc.gray(`    Date: ${result.date}`));
    console.log(pc.gray(`    Value: ${result.redactedValue}`));
    console.log();
  }

  console.log(pc.yellow('Recommendation: Consider rotating these credentials and using git-filter-branch or BFG to remove them from history.'));
  console.log();

  process.exit(1);
}

/**
 * Watch command
 */
async function runWatch(options: { config?: string }): Promise<void> {
  const rootDir = process.cwd();

  console.log();
  console.log(pc.bold(pc.cyan('env-doctor')) + ' watch');
  console.log(pc.gray('Watching for changes... Press Ctrl+C to stop.'));
  console.log();

  const { config } = await loadConfig(options.config, rootDir);

  let analysisResult: AnalysisResult | null = null;
  let debounceTimer: NodeJS.Timeout | null = null;

  const runAnalysis = async () => {
    try {
      const result = await analyze({ config });

      // Only report if something changed
      if (
        !analysisResult ||
        result.issues.length !== analysisResult.issues.length ||
        result.stats.errorCount !== analysisResult.stats.errorCount
      ) {
        console.clear();
        console.log(pc.bold(pc.cyan('env-doctor')) + ' watch');
        console.log(pc.gray(`Last updated: ${new Date().toLocaleTimeString()}`));
        console.log();
        reportToConsole(result, { verbose: false });
        analysisResult = result;
      }
    } catch (err) {
      logger.error('Analysis error:', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Initial run
  await runAnalysis();

  // Watch for file changes using fs.watch
  const { watch } = await import('node:fs');
  const watchedDirs = new Set<string>();

  // Watch .env files
  for (const envFile of config.envFiles) {
    const envPath = resolve(rootDir, envFile);
    try {
      watch(envPath, () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runAnalysis, 300);
      });
      watchedDirs.add(envPath);
    } catch {
      // File might not exist
    }
  }

  // Watch src directory
  const srcDir = resolve(rootDir, 'src');
  try {
    watch(srcDir, { recursive: true }, (_event, filename) => {
      if (filename && /\.(ts|js|tsx|jsx)$/.test(filename)) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runAnalysis, 300);
      }
    });
    watchedDirs.add(srcDir);
  } catch {
    // Directory might not exist
  }

  // Keep process alive
  process.on('SIGINT', () => {
    console.log();
    console.log(pc.gray('Stopped watching.'));
    process.exit(0);
  });

  // Prevent exit
  await new Promise(() => {});
}

