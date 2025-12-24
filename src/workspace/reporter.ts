/**
 * @fileoverview Reporter for workspace analysis results
 */

import pc from 'picocolors';
import type { WorkspaceAnalysisResult, PackageAnalysisResult, VariableConflict } from './types.js';

/**
 * Report workspace analysis results to console
 */
export function reportWorkspaceToConsole(
  result: WorkspaceAnalysisResult,
  options: { verbose?: boolean } = {}
): void {
  const { verbose = false } = options;

  console.log();
  console.log(pc.bold('Monorepo Environment Analysis'));
  console.log('═'.repeat(78));
  console.log();

  // Workspace info
  console.log(pc.gray(`Detected: ${formatWorkspaceType(result.workspace.type)} workspace`));
  console.log(pc.gray(`Root: ${result.workspace.rootDir}`));
  console.log(pc.gray(`Packages: ${result.stats.totalPackages} packages found`));
  console.log();

  // Per-package results
  console.log('─'.repeat(78));
  console.log();

  for (const pkg of result.packages) {
    reportPackageResult(pkg, verbose);
  }

  // Shared variables
  if (result.sharedVariables.length > 0) {
    console.log('═'.repeat(78));
    console.log();
    console.log(pc.bold('Shared Variables (from root .env)'));
    console.log('─'.repeat(55));
    
    // Table header
    console.log(
      pc.gray(padRight('Variable', 25)) + ' │ ' +
      pc.gray('Used by')
    );
    console.log('─'.repeat(55));

    for (const shared of result.sharedVariables) {
      const usedBy = shared.usedBy.slice(0, 3).join(', ');
      const more = shared.usedBy.length > 3 ? ` +${shared.usedBy.length - 3} more` : '';
      
      console.log(
        padRight(shared.name, 25) + ' │ ' +
        pc.gray(usedBy + more)
      );
    }
    console.log();
  }

  // Conflicts
  if (result.conflicts.length > 0) {
    console.log('═'.repeat(78));
    console.log();
    console.log(pc.yellow(pc.bold('⚠ Conflicts Detected')));
    console.log('─'.repeat(55));
    console.log();

    for (const conflict of result.conflicts) {
      reportConflict(conflict);
    }
  }

  // Summary
  console.log('═'.repeat(78));
  console.log();
  console.log(pc.bold('Summary'));
  console.log('─'.repeat(55));
  console.log(`  Packages scanned:    ${result.stats.totalPackages}`);
  console.log(`  Total variables:     ${result.stats.totalVariables} (${result.stats.sharedVariablesCount} shared)`);
  console.log();

  const passingCount = result.stats.totalPackages - result.stats.packagesWithIssues;
  console.log(`  ${pc.green('✓')} Passing:           ${passingCount} packages`);
  
  if (result.stats.packagesWithIssues > 0) {
    console.log(`  ${pc.yellow('⚠')} With issues:       ${result.stats.packagesWithIssues} packages`);
  }
  
  if (result.stats.conflictsCount > 0) {
    const conflictColor = result.conflicts.some(c => c.severity === 'error') ? pc.red : pc.yellow;
    console.log(`  ${conflictColor('!')} Conflicts:         ${result.stats.conflictsCount}`);
  }

  console.log();
  console.log(pc.gray(`Completed in ${result.stats.duration}ms`));
  console.log('═'.repeat(78));
  console.log();
}

/**
 * Report results for a single package
 */
function reportPackageResult(result: PackageAnalysisResult, verbose: boolean): void {
  const { package: pkg, analysis } = result;
  
  // Package header with framework
  const frameworkBadge = pkg.framework !== 'auto' ? ` (${pkg.framework})` : '';
  console.log(pc.bold(`📦 ${pkg.name}${pc.gray(frameworkBadge)}`));
  
  // Env files info
  if (pkg.envFiles.length > 0) {
    console.log(pc.gray(`   .env: ${pkg.envFiles.join(', ')}`));
  } else {
    console.log(pc.gray('   No .env file'));
  }

  // Variables summary
  const definedCount = analysis.definedVariables.length;
  const usedCount = analysis.usedVariables.filter(u => u.name !== '<dynamic>').length;
  console.log(pc.gray(`   ${definedCount} defined, ${usedCount} used`));

  // Issues
  const { errorCount, warningCount, infoCount } = analysis.stats;
  
  if (errorCount === 0 && warningCount === 0) {
    console.log(`   ${pc.green('✓')} No issues`);
  } else {
    if (errorCount > 0) {
      console.log(`   ${pc.red('✗')} ${errorCount} error${errorCount > 1 ? 's' : ''}`);
    }
    if (warningCount > 0) {
      console.log(`   ${pc.yellow('⚠')} ${warningCount} warning${warningCount > 1 ? 's' : ''}`);
    }

    // Show issues if verbose
    if (verbose) {
      for (const issue of analysis.issues) {
        const icon = issue.severity === 'error' ? pc.red('✗') : 
                     issue.severity === 'warning' ? pc.yellow('⚠') : pc.blue('ℹ');
        console.log(`     ${icon} ${issue.variable}: ${issue.message}`);
      }
    }
  }

  console.log();
  console.log('─'.repeat(78));
  console.log();
}

/**
 * Report a single conflict
 */
function reportConflict(conflict: VariableConflict): void {
  const icon = conflict.isAllowed ? pc.gray('ℹ') : 
               conflict.severity === 'error' ? pc.red('✗') : pc.yellow('⚠');
  
  console.log(`  ${icon} ${pc.bold(conflict.name)}`);
  
  for (const def of conflict.definitions) {
    const location = def.package === 'root' ? def.file : `${def.package}/${def.file}`;
    const value = def.value.length > 30 ? def.value.slice(0, 30) + '...' : def.value;
    console.log(pc.gray(`    ${location}: ${value}`));
  }

  if (conflict.isAllowed) {
    console.log(pc.gray('    ℹ This conflict is allowed by configuration'));
  }

  console.log();
}

/**
 * Format workspace type for display
 */
function formatWorkspaceType(type: string): string {
  const names: Record<string, string> = {
    npm: 'npm',
    yarn: 'Yarn',
    pnpm: 'pnpm',
    turbo: 'Turborepo',
    nx: 'Nx',
    lerna: 'Lerna',
    none: 'None',
  };
  return names[type] || type;
}

/**
 * Pad a string to the right
 */
function padRight(str: string, length: number): string {
  if (str.length >= length) return str;
  return str + ' '.repeat(length - str.length);
}

/**
 * Generate JSON report for workspace
 */
export function reportWorkspaceToJSON(result: WorkspaceAnalysisResult): string {
  return JSON.stringify({
    workspace: {
      type: result.workspace.type,
      rootDir: result.workspace.rootDir,
      configFile: result.workspace.configFile,
    },
    rootVariables: result.rootVariables.map(v => ({
      name: v.name,
      file: v.file,
      isSecret: v.isSecret,
    })),
    packages: result.packages.map(pkg => ({
      name: pkg.package.name,
      path: pkg.package.path,
      framework: pkg.package.framework,
      envFiles: pkg.package.envFiles,
      issues: pkg.analysis.issues,
      stats: pkg.analysis.stats,
    })),
    sharedVariables: result.sharedVariables,
    conflicts: result.conflicts,
    stats: result.stats,
  }, null, 2);
}

