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
  .option('-w, --workspaces [patterns]', 'Scan all workspace packages (monorepo mode)')
  .option('--pipeline <pipeline>', 'Validate env vars for specific Turborepo/Nx pipeline')
  .action(async (directory: string, options) => {
    if (options.workspaces !== undefined || options.pipeline) {
      await runWorkspaceScan(directory, options);
    } else {
      await runScan(directory, options);
    }
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

// Sync command - generate/update .env.example
program
  .command('sync')
  .description('Generate or update .env.example from code analysis')
  .option('-c, --config <path>', 'Path to config file')
  .option('-o, --output <path>', 'Output file path', '.env.example')
  .option('--generate', 'Generate from scratch (overwrite existing)')
  .option('--update', 'Update existing template (preserve comments)')
  .option('--dry-run', 'Preview changes without writing')
  .option('--interactive', 'Interactive mode for resolving changes')
  .option('--strategy <strategy>', 'Generation strategy: from-code, from-env, merge', 'merge')
  .option('--format <format>', 'Output format: grouped, alphabetical, categorized', 'categorized')
  .action(async (options) => {
    await runSync(options);
  });

// Matrix command - multi-environment validation
program
  .command('matrix')
  .description('Validate environment variables across multiple environments')
  .option('-c, --config <path>', 'Path to config file')
  .option('-e, --envs <environments>', 'Comma-separated list of environments to check')
  .option('-f, --format <format>', 'Output format: table, json, csv, html', 'table')
  .option('--fix', 'Interactive fix mode')
  .option('--ci', 'CI mode - exit with code 1 on errors')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    await runMatrix(options);
  });

// Generate schema command
program
  .command('generate:schema')
  .description('Generate runtime validation schema from config')
  .option('-c, --config <path>', 'Path to config file')
  .option('-o, --output <path>', 'Output file path', 'src/env.ts')
  .option('--format <format>', 'Output format: typescript, javascript', 'typescript')
  .option('--framework <framework>', 'Override framework detection')
  .option('--include-docs', 'Include JSDoc comments')
  .action(async (options) => {
    await runGenerateSchema(options);
  });

// Graph command - visualize dependencies
program
  .command('graph')
  .description('Generate dependency graph visualization for monorepo')
  .option('-c, --config <path>', 'Path to config file')
  .option('-f, --format <format>', 'Output format: ascii, mermaid, dot, json', 'ascii')
  .option('-o, --output <path>', 'Output file path (optional)')
  .action(async (options) => {
    await runGraph(options);
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

/**
 * Sync command - generate/update .env.example
 */
async function runSync(options: {
  config?: string;
  output: string;
  generate?: boolean;
  update?: boolean;
  dryRun?: boolean;
  interactive?: boolean;
  strategy: string;
  format: string;
}): Promise<void> {
  const rootDir = process.cwd();

  console.log();
  console.log(pc.bold(pc.cyan('env-doctor')) + ' sync');
  console.log();

  try {
    // Import sync module
    const { generateFromCode, mergeTemplate, generateDiff, applyMerge } = await import('./sync/index.js');
    const { loadConfig } = await import('./config.js');

    // Load config
    const { config } = await loadConfig(options.config, rootDir);

    // Build sync config from options
    const syncConfig = config.sync || {};
    if (options.format === 'grouped') {
      syncConfig.groupBy = 'prefix';
    } else if (options.format === 'alphabetical') {
      syncConfig.groupBy = 'none';
    } else if (options.format === 'categorized') {
      syncConfig.groupBy = 'category';
    }

    // Generate template
    const spinner = createSpinner('Analyzing project...');
    spinner.start();

    const result = await generateFromCode({
      rootDir,
      config,
      syncConfig,
      fromCode: options.strategy !== 'from-env',
      fromEnv: options.strategy !== 'from-code',
      fromConfig: true,
    });

    spinner.stop(true);

    // Show statistics
    console.log(pc.gray(`Found ${result.stats.totalVariables} variables:`));
    console.log(pc.gray(`  • ${result.stats.fromCode} from code`));
    console.log(pc.gray(`  • ${result.stats.fromEnv} from .env files`));
    console.log(pc.gray(`  • ${result.stats.secrets} secrets`));
    console.log(pc.gray(`  • ${result.stats.required} required`));
    console.log();

    if (result.newFromCode.length > 0) {
      console.log(pc.yellow(`New variables found in code (not in .env):`));
      for (const name of result.newFromCode) {
        console.log(pc.yellow(`  + ${name}`));
      }
      console.log();
    }

    if (result.unusedFromEnv.length > 0) {
      console.log(pc.gray(`Unused variables in .env (not in code):`));
      for (const name of result.unusedFromEnv) {
        console.log(pc.gray(`  - ${name}`));
      }
      console.log();
    }

    // Check if we need to merge or generate
    const outputPath = resolve(rootDir, options.output);
    const { fileExists } = await import('./utils/fs.js');
    const exists = await fileExists(outputPath);

    if (exists && !options.generate) {
      // Merge with existing
      const mergeResult = await mergeTemplate({
        templatePath: options.output,
        newVariables: result.variables,
        syncConfig,
        rootDir,
      });

      if (options.dryRun) {
        // Show diff
        const { readFile } = await import('node:fs/promises');
        const oldContent = await readFile(outputPath, 'utf-8');
        const diff = generateDiff(oldContent, mergeResult.content);
        
        console.log(pc.bold('Changes to ' + options.output + ':'));
        console.log('═'.repeat(60));
        console.log(diff);
        console.log('═'.repeat(60));
        console.log();
        console.log(pc.gray('Run without --dry-run to apply changes.'));
      } else if (options.interactive) {
        // Interactive mode
        const { confirm } = await import('@inquirer/prompts');

        if (mergeResult.added.length > 0) {
          console.log(pc.green(`+ ${mergeResult.added.length} variables to add`));
          for (const name of mergeResult.added) {
            console.log(pc.green(`    ${name}`));
          }
        }
        if (mergeResult.removed.length > 0) {
          console.log(pc.red(`- ${mergeResult.removed.length} variables to remove`));
          for (const name of mergeResult.removed) {
            console.log(pc.red(`    ${name}`));
          }
        }
        if (mergeResult.updated.length > 0) {
          console.log(pc.yellow(`~ ${mergeResult.updated.length} variables to update`));
          for (const name of mergeResult.updated) {
            console.log(pc.yellow(`    ${name}`));
          }
        }
        if (mergeResult.preserved.length > 0) {
          console.log(pc.gray(`= ${mergeResult.preserved.length} custom variables preserved`));
        }
        console.log();

        const shouldApply = await confirm({
          message: 'Apply these changes?',
          default: true,
        });

        if (shouldApply) {
          await applyMerge(options.output, mergeResult, rootDir);
          logger.success(`Updated ${pc.cyan(options.output)}`);
        } else {
          console.log(pc.gray('Cancelled.'));
        }
      } else {
        // Apply directly
        await applyMerge(options.output, mergeResult, rootDir);
        logger.success(`Updated ${pc.cyan(options.output)}`);

        if (mergeResult.added.length > 0) {
          console.log(pc.green(`  + ${mergeResult.added.length} variables added`));
        }
        if (mergeResult.removed.length > 0) {
          console.log(pc.red(`  - ${mergeResult.removed.length} variables removed`));
        }
        if (mergeResult.preserved.length > 0) {
          console.log(pc.gray(`  = ${mergeResult.preserved.length} custom variables preserved`));
        }
      }
    } else {
      // Generate from scratch
      if (options.dryRun) {
        console.log(pc.bold('Generated ' + options.output + ':'));
        console.log('═'.repeat(60));
        console.log(result.content);
        console.log('═'.repeat(60));
        console.log();
        console.log(pc.gray('Run without --dry-run to write file.'));
      } else {
        const { writeFile } = await import('node:fs/promises');
        await writeFile(outputPath, result.content, 'utf-8');
        logger.success(`Created ${pc.cyan(options.output)} with ${result.stats.totalVariables} variables`);
      }
    }

    console.log();
  } catch (err) {
    if ((err as Error).name === 'ExitPromptError') {
      console.log();
      return;
    }
    logger.error('Sync failed:', err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Workspace scan command
 */
async function runWorkspaceScan(
  directory: string,
  options: {
    config?: string;
    workspaces?: boolean | string;
    pipeline?: string;
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
    // Import workspace module
    const { 
      analyzeWorkspace, 
      reportWorkspaceToConsole, 
      reportWorkspaceToJSON,
      getPipelineConfig,
      getPipelineEnvVars,
      formatPipelineReport,
    } = await import('./workspace/index.js');

    // Handle pipeline-specific validation
    if (options.pipeline) {
      const pipelineConfig = await getPipelineConfig(rootDir);
      
      if (pipelineConfig.type === 'none') {
        logger.error('No Turborepo or Nx configuration found.');
        process.exit(1);
      }

      console.log();
      console.log(pc.bold(pc.cyan('env-doctor')) + ` pipeline validation: ${options.pipeline}`);
      console.log();

      const { env, dotEnv } = getPipelineEnvVars(options.pipeline, pipelineConfig);

      if (env.length === 0 && dotEnv.length === 0) {
        logger.warn(`Pipeline "${options.pipeline}" has no env configuration.`);
        console.log();
        console.log(formatPipelineReport(pipelineConfig));
        return;
      }

      console.log(pc.bold('Required for this pipeline:'));
      if (env.length > 0) {
        console.log(pc.gray('  Environment variables:'));
        for (const v of env) {
          console.log(pc.gray(`    • ${v}`));
        }
      }
      if (dotEnv.length > 0) {
        console.log(pc.gray('  .env files:'));
        for (const f of dotEnv) {
          console.log(pc.gray(`    • ${f}`));
        }
      }
      console.log();
      return;
    }

    // Parse patterns if provided
    let patterns: string[] | undefined;
    if (typeof options.workspaces === 'string') {
      patterns = options.workspaces.split(',').map(p => p.trim());
    }

    // Run workspace analysis
    const spinner = options.format === 'console' && !options.ci ? createSpinner('Scanning workspace...') : null;
    spinner?.start();

    const { config } = await loadConfig(options.config, rootDir);

    const result = await analyzeWorkspace({
      rootDir,
      patterns,
      config,
      verbose: options.verbose,
    });

    spinner?.stop(result.stats.totalErrors === 0);

    // Output results
    switch (options.format) {
      case 'json':
        console.log(reportWorkspaceToJSON(result));
        break;
      default:
        if (options.ci) {
          // Simplified CI output
          console.log(`Workspace: ${result.workspace.type}`);
          console.log(`Packages: ${result.stats.totalPackages}`);
          console.log(`Errors: ${result.stats.totalErrors}`);
          console.log(`Warnings: ${result.stats.totalWarnings}`);
          console.log(`Conflicts: ${result.stats.conflictsCount}`);
        } else {
          reportWorkspaceToConsole(result, { verbose: options.verbose });
        }
    }

    // Exit with appropriate code
    const hasErrors = options.strict
      ? result.stats.totalErrors > 0 || result.stats.totalWarnings > 0
      : result.stats.totalErrors > 0;

    // Also count non-allowed conflicts as errors
    const criticalConflicts = result.conflicts.filter(c => !c.isAllowed && c.severity === 'error');
    
    if (options.ci && (hasErrors || criticalConflicts.length > 0)) {
      process.exit(1);
    }
  } catch (err) {
    logger.error('Workspace scan failed:', err instanceof Error ? err.message : 'Unknown error');
    if (options.verbose && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

/**
 * Matrix command - multi-environment validation
 */
async function runMatrix(options: {
  config?: string;
  envs?: string;
  format: string;
  fix?: boolean;
  ci?: boolean;
  verbose?: boolean;
}): Promise<void> {
  const rootDir = process.cwd();

  if (options.verbose) {
    logger.setVerbose(true);
  }

  console.log();
  console.log(pc.bold(pc.cyan('env-doctor')) + ' matrix');
  console.log();

  try {
    // Import matrix module
    const {
      analyzeMatrix,
      detectEnvironments,
      reportMatrixToConsole,
      reportMatrixToJSON,
      reportMatrixToCSV,
      reportMatrixToHTML,
    } = await import('./matrix/index.js');

    // Determine environments
    let environments: string[] | undefined;
    if (options.envs) {
      environments = options.envs.split(',').map(e => e.trim());
    } else {
      // Auto-detect from files
      const detected = await detectEnvironments(rootDir);
      if (detected.length > 0) {
        console.log(pc.gray(`Detected environments: ${detected.join(', ')}`));
        environments = detected;
      }
    }

    // Load config
    const { config } = await loadConfig(options.config, rootDir);

    // Run analysis
    const spinner = options.format === 'table' && !options.ci ? createSpinner('Analyzing environments...') : null;
    spinner?.start();

    const result = await analyzeMatrix({
      rootDir,
      config,
      environments,
      verbose: options.verbose,
    });

    spinner?.stop(result.summary.errorCount === 0);

    // Handle fix mode
    if (options.fix) {
      await runMatrixFix(result, rootDir);
      return;
    }

    // Output results
    switch (options.format) {
      case 'json':
        console.log(reportMatrixToJSON(result));
        break;
      case 'csv':
        console.log(reportMatrixToCSV(result));
        break;
      case 'html':
        console.log(reportMatrixToHTML(result));
        break;
      default:
        if (options.ci) {
          // Simplified CI output
          console.log(`Environments: ${result.environments.join(', ')}`);
          console.log(`Variables: ${result.summary.totalVariables}`);
          console.log(`Errors: ${result.summary.errorCount}`);
          console.log(`Warnings: ${result.summary.warningCount}`);
          
          if (result.summary.errorCount > 0) {
            console.log();
            console.log('Errors:');
            for (const issue of result.issues.filter(i => i.severity === 'error')) {
              console.log(`  - ${issue.variable}: ${issue.message}`);
            }
          }
        } else {
          reportMatrixToConsole(result, { verbose: options.verbose });
        }
    }

    // Exit with appropriate code
    if (options.ci && result.summary.errorCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    logger.error('Matrix analysis failed:', err instanceof Error ? err.message : 'Unknown error');
    if (options.verbose && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

/**
 * Interactive fix mode for matrix issues
 */
async function runMatrixFix(
  result: Awaited<ReturnType<typeof import('./matrix/index.js').analyzeMatrix>>,
  rootDir: string
): Promise<void> {
  const { select, input, confirm } = await import('@inquirer/prompts');

  const errors = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');

  if (errors.length === 0 && warnings.length === 0) {
    logger.success('No issues to fix!');
    return;
  }

  console.log(pc.bold('Matrix Fix Mode'));
  console.log('═'.repeat(60));
  console.log();

  let fixCount = 0;

  // Handle errors first
  for (let i = 0; i < errors.length; i++) {
    const issue = errors[i];
    console.log(pc.red(`Issue ${i + 1}/${errors.length}: ${issue.variable}`));
    console.log(pc.gray(`  ${issue.message}`));
    console.log();

    if (issue.type === 'missing') {
      // Show current values in other environments
      const row = result.rows.find(r => r.name === issue.variable);
      if (row) {
        for (const env of result.environments) {
          const info = row.environments[env];
          if (info.status === 'set') {
            const displayValue = info.isSecret ? '****' : info.value;
            console.log(pc.gray(`  ${env}: ${displayValue}`));
          } else {
            console.log(pc.red(`  ${env}: ✗ MISSING`));
          }
        }
      }
      console.log();

      const action = await select({
        message: 'What would you like to do?',
        choices: [
          { name: 'Enter value manually', value: 'enter' },
          { name: 'Copy from another environment', value: 'copy' },
          { name: 'Skip for now', value: 'skip' },
          { name: 'Mark as intentionally different', value: 'ignore' },
        ],
      });

      if (action === 'enter') {
        const value = await input({
          message: `Enter value for ${issue.variable}:`,
        });

        for (const env of issue.environments) {
          await appendToEnvFile(rootDir, env, issue.variable, value);
          logger.success(`Added ${issue.variable} to .env.${env}`);
          fixCount++;
        }
      } else if (action === 'copy') {
        // Find environment with value
        const sourceEnv = result.environments.find(env => {
          const info = result.rows.find(r => r.name === issue.variable)?.environments[env];
          return info?.status === 'set';
        });

        if (sourceEnv) {
          const sourceValue = result.rows.find(r => r.name === issue.variable)?.environments[sourceEnv].value;
          if (sourceValue) {
            for (const env of issue.environments) {
              await appendToEnvFile(rootDir, env, issue.variable, sourceValue);
              logger.success(`Copied ${issue.variable} to .env.${env}`);
              fixCount++;
            }
          }
        }
      }
    }

    console.log('─'.repeat(60));
    console.log();
  }

  // Handle warnings if user wants
  if (warnings.length > 0) {
    const handleWarnings = await confirm({
      message: `Also handle ${warnings.length} warning(s)?`,
      default: false,
    });

    if (handleWarnings) {
      for (const issue of warnings) {
        console.log(pc.yellow(`Warning: ${issue.variable}`));
        console.log(pc.gray(`  ${issue.message}`));
        
        const action = await select({
          message: 'What would you like to do?',
          choices: [
            { name: 'Fix it', value: 'fix' },
            { name: 'Skip', value: 'skip' },
          ],
        });

        if (action === 'fix' && issue.type === 'inconsistent') {
          // Handle inconsistency by adding to missing environments
          const value = await input({
            message: `Enter value for ${issue.variable}:`,
          });

          for (const env of issue.environments) {
            await appendToEnvFile(rootDir, env, issue.variable, value);
            logger.success(`Added ${issue.variable} to .env.${env}`);
            fixCount++;
          }
        }
      }
    }
  }

  console.log();
  console.log(pc.bold('Summary:'));
  console.log(`  Fixed ${fixCount} issue(s)`);
  console.log();
}

/**
 * Generate runtime schema command
 */
async function runGenerateSchema(options: {
  config?: string;
  output: string;
  format: string;
  framework?: string;
  includeDocs?: boolean;
}): Promise<void> {
  const rootDir = process.cwd();

  console.log();
  console.log(pc.bold(pc.cyan('env-doctor')) + ' generate:schema');
  console.log();

  try {
    const { config } = await loadConfig(options.config, rootDir);
    const { detectFramework } = await import('./frameworks/index.js');

    // Detect or use provided framework
    const framework = options.framework || await detectFramework(rootDir);

    // Generate schema content
    const schemaContent = generateSchemaFile(config, framework, options);

    // Write output
    const outputPath = resolve(rootDir, options.output);
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { dirname } = await import('node:path');

    // Ensure directory exists
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, schemaContent, 'utf-8');

    logger.success(`Generated schema at ${pc.cyan(options.output)}`);
    console.log();
    console.log(pc.gray('Usage:'));
    console.log(pc.gray('  import { env } from "./env";'));
    console.log(pc.gray('  console.log(env.DATABASE_URL);'));
    console.log();
  } catch (err) {
    logger.error('Schema generation failed:', err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Graph command - visualize dependencies
 */
async function runGraph(options: {
  config?: string;
  format: string;
  output?: string;
}): Promise<void> {
  const rootDir = process.cwd();

  console.log();
  console.log(pc.bold(pc.cyan('env-doctor')) + ' graph');
  console.log();

  try {
    const {
      analyzeWorkspace,
      buildDependencyGraph,
      generateMermaidDiagram,
      generateAsciiDiagram,
      generateGraphJSON,
      generateDotDiagram,
    } = await import('./workspace/index.js');

    const { config } = await loadConfig(options.config, rootDir);

    // Run workspace analysis
    const spinner = createSpinner('Analyzing workspace...');
    spinner.start();

    const result = await analyzeWorkspace({
      rootDir,
      config,
    });

    spinner.stop(true);

    // Build graph
    const graph = buildDependencyGraph(result);

    // Generate output based on format
    let output: string;
    switch (options.format) {
      case 'mermaid':
        output = generateMermaidDiagram(graph);
        break;
      case 'dot':
        output = generateDotDiagram(graph);
        break;
      case 'json':
        output = generateGraphJSON(graph);
        break;
      case 'ascii':
      default:
        output = generateAsciiDiagram(result);
        break;
    }

    // Write to file or stdout
    if (options.output) {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(resolve(rootDir, options.output), output, 'utf-8');
      logger.success(`Graph saved to ${pc.cyan(options.output)}`);
    } else {
      console.log(output);
    }

    console.log();
  } catch (err) {
    if ((err as Error).message.includes('No workspace')) {
      logger.error('This command requires a monorepo workspace.');
      logger.info('Run this command from a workspace root with multiple packages.');
    } else {
      logger.error('Graph generation failed:', err instanceof Error ? err.message : 'Unknown error');
    }
    process.exit(1);
  }
}

/**
 * Generate the schema file content
 */
function generateSchemaFile(
  config: Awaited<ReturnType<typeof loadConfig>>['config'],
  framework: string,
  options: { format: string; includeDocs?: boolean }
): string {
  const isTypeScript = options.format === 'typescript';
  const lines: string[] = [];

  // Header
  lines.push('/**');
  lines.push(' * Auto-generated by env-doctor');
  lines.push(' * Do not edit manually - run `npx env-doctor generate:schema` to regenerate');
  lines.push(` * Generated at: ${new Date().toISOString()}`);
  lines.push(' */');
  lines.push('');

  // Import
  if (isTypeScript) {
    lines.push("import { createEnv } from '@theaccessibleteam/env-doctor/runtime';");
  } else {
    lines.push("const { createEnv } = require('@theaccessibleteam/env-doctor/runtime');");
  }
  lines.push('');

  // Determine client prefix
  const clientPrefixes: Record<string, string> = {
    nextjs: 'NEXT_PUBLIC_',
    vite: 'VITE_',
    cra: 'REACT_APP_',
    node: '',
  };
  const clientPrefix = clientPrefixes[framework] || '';

  // Separate server and client variables
  const serverVars: Record<string, typeof config.variables[string]> = {};
  const clientVars: Record<string, typeof config.variables[string]> = {};

  for (const [name, rule] of Object.entries(config.variables)) {
    if (clientPrefix && name.startsWith(clientPrefix)) {
      clientVars[name] = rule;
    } else {
      serverVars[name] = rule;
    }
  }

  // Generate schema
  if (isTypeScript) {
    lines.push('export const env = createEnv({');
  } else {
    lines.push('exports.env = createEnv({');
  }

  // Server variables
  if (Object.keys(serverVars).length > 0) {
    lines.push('  server: {');
    for (const [name, rule] of Object.entries(serverVars)) {
      if (options.includeDocs && rule.description) {
        lines.push(`    /** ${rule.description} */`);
      }
      lines.push(`    ${name}: ${formatRuleSchema(rule)},`);
    }
    lines.push('  },');
  }

  // Client variables
  if (Object.keys(clientVars).length > 0) {
    lines.push('  client: {');
    for (const [name, rule] of Object.entries(clientVars)) {
      if (options.includeDocs && rule.description) {
        lines.push(`    /** ${rule.description} */`);
      }
      lines.push(`    ${name}: ${formatRuleSchema(rule)},`);
    }
    lines.push('  },');
  }

  lines.push(`  framework: '${framework}',`);
  lines.push('});');
  lines.push('');

  // Type export for TypeScript
  if (isTypeScript) {
    lines.push('// Type export for use in other files');
    lines.push('export type Env = typeof env;');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format a variable rule as a schema object
 */
function formatRuleSchema(rule: { type?: string; required?: boolean; secret?: boolean; enum?: string[]; default?: unknown; description?: string }): string {
  const parts: string[] = [];

  // Type
  const type = rule.type || 'string';
  parts.push(`type: '${type}'`);

  // Required
  if (rule.required) {
    parts.push('required: true');
  }

  // Default
  if (rule.default !== undefined) {
    if (typeof rule.default === 'string') {
      parts.push(`default: '${rule.default}'`);
    } else {
      parts.push(`default: ${rule.default}`);
    }
  }

  // Enum
  if (rule.enum && rule.enum.length > 0) {
    parts.push(`enum: [${rule.enum.map(v => `'${v}'`).join(', ')}]`);
  }

  return `{ ${parts.join(', ')} }`;
}

/**
 * Append a variable to an env file
 */
async function appendToEnvFile(
  rootDir: string,
  env: string,
  variable: string,
  value: string
): Promise<void> {
  const { resolve } = await import('node:path');
  const { writeFile, readFile } = await import('node:fs/promises');
  const { fileExists } = await import('./utils/fs.js');

  // Determine file path
  const fileName = env === 'development' ? '.env' : `.env.${env}`;
  const filePath = resolve(rootDir, fileName);

  let content = '';
  if (await fileExists(filePath)) {
    content = await readFile(filePath, 'utf-8');
    if (!content.endsWith('\n')) {
      content += '\n';
    }
  }

  content += `${variable}=${value}\n`;
  await writeFile(filePath, content, 'utf-8');
}

