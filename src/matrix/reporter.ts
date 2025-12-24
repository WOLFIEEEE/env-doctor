/**
 * @fileoverview Reporter for matrix validation results
 */

import pc from 'picocolors';
import type { MatrixResult, MatrixRow, MatrixIssue, EnvironmentVariableInfo } from './types.js';

/**
 * Report matrix to console as a table
 */
export function reportMatrixToConsole(
  result: MatrixResult,
  options: { verbose?: boolean } = {}
): void {
  const { verbose = false } = options;
  const envs = result.environments;

  console.log();
  console.log(pc.bold('Environment Variable Matrix'));
  console.log('═'.repeat(78));
  console.log();

  // Calculate column widths
  const varWidth = Math.min(25, Math.max(...result.rows.map(r => r.name.length), 8));
  const envWidth = Math.max(14, ...envs.map(e => e.length));

  // Header
  console.log(
    pc.gray(padRight('Variable', varWidth)) + ' │ ' +
    envs.map(e => pc.gray(padCenter(e, envWidth))).join(' │ ') + ' │ ' +
    pc.gray('Status')
  );
  console.log('─'.repeat(varWidth) + '─┼─' + envs.map(() => '─'.repeat(envWidth)).join('─┼─') + '─┼─' + '─'.repeat(8));

  // Rows
  for (const row of result.rows) {
    const varName = row.name.length > varWidth 
      ? row.name.slice(0, varWidth - 2) + '..'
      : row.name;

    const cells = envs.map(env => {
      const info = row.environments[env];
      return formatCell(info, envWidth);
    });

    const statusIcon = getStatusIcon(row.status);
    
    console.log(
      padRight(varName, varWidth) + ' │ ' +
      cells.join(' │ ') + ' │ ' +
      statusIcon
    );

    // Show issues for this row if verbose or if there are errors
    if ((verbose || row.status === 'error') && row.issues.length > 0) {
      for (const issue of row.issues) {
        const issueIcon = issue.severity === 'error' ? pc.red('✗') :
                         issue.severity === 'warning' ? pc.yellow('⚠') : pc.blue('ℹ');
        console.log(pc.gray('  ' + ' '.repeat(varWidth) + '  ' + issueIcon + ' ' + issue.message));
      }
    }
  }

  console.log('─'.repeat(varWidth) + '─┴─' + envs.map(() => '─'.repeat(envWidth)).join('─┴─') + '─┴─' + '─'.repeat(8));
  console.log();

  // Summary
  console.log(pc.bold('Summary:'));
  console.log(`  Total variables: ${result.summary.totalVariables}`);
  console.log(`  ${pc.green('✓')} Consistent: ${result.summary.consistentVariables}`);
  
  if (result.summary.errorCount > 0) {
    console.log(`  ${pc.red('✗')} Errors: ${result.summary.errorCount}`);
  }
  if (result.summary.warningCount > 0) {
    console.log(`  ${pc.yellow('⚠')} Warnings: ${result.summary.warningCount}`);
  }
  if (result.summary.infoCount > 0) {
    console.log(`  ${pc.blue('ℹ')} Info: ${result.summary.infoCount}`);
  }

  console.log();

  // Detailed issues
  if (result.issues.length > 0) {
    const errors = result.issues.filter(i => i.severity === 'error');
    const warnings = result.issues.filter(i => i.severity === 'warning');

    if (errors.length > 0) {
      console.log(pc.red(pc.bold('Errors:')));
      for (let i = 0; i < errors.length; i++) {
        const issue = errors[i];
        console.log(`  ${i + 1}. ${issue.variable} - ${issue.message}`);
        if (issue.fix) {
          console.log(pc.gray(`     💡 ${issue.fix}`));
        }
      }
      console.log();
    }

    if (warnings.length > 0 && verbose) {
      console.log(pc.yellow(pc.bold('Warnings:')));
      for (let i = 0; i < warnings.length; i++) {
        const issue = warnings[i];
        console.log(`  ${i + 1}. ${issue.variable} - ${issue.message}`);
      }
      console.log();
    }
  }

  // Recommendations
  if (result.issues.length > 0) {
    console.log(pc.bold('Recommendations:'));
    console.log(pc.gray('  • Run `env-doctor matrix --fix` to interactively resolve issues'));
    console.log(pc.gray('  • Add missing variables to the appropriate environment files'));
    console.log();
  }

  console.log('═'.repeat(78));
  console.log();
}

/**
 * Format a cell for the table
 */
function formatCell(info: EnvironmentVariableInfo, width: number): string {
  let text: string;
  let color: (s: string) => string;

  switch (info.status) {
    case 'set':
      if (info.isSecret) {
        text = '✓ ****';
      } else if (info.value && info.value.length > width - 4) {
        text = '✓ ' + info.value.slice(0, width - 6) + '..';
      } else {
        text = '✓ ' + (info.value || '');
      }
      color = info.valid ? pc.green : pc.red;
      break;
    case 'empty':
      text = '✓ (empty)';
      color = pc.yellow;
      break;
    case 'missing':
      text = '✗ MISSING';
      color = info.valid ? pc.gray : pc.red;
      break;
    case 'invalid':
      text = '✗ INVALID';
      color = pc.red;
      break;
    default:
      text = '?';
      color = pc.gray;
  }

  return color(padCenter(text, width));
}

/**
 * Get status icon
 */
function getStatusIcon(status: MatrixRow['status']): string {
  switch (status) {
    case 'ok':
      return pc.green('OK');
    case 'error':
      return pc.red('ERROR');
    case 'warning':
      return pc.yellow('WARN');
    case 'info':
      return pc.blue('INFO');
    default:
      return '';
  }
}

/**
 * Pad string to right
 */
function padRight(str: string, len: number): string {
  if (str.length >= len) return str;
  return str + ' '.repeat(len - str.length);
}

/**
 * Pad string to center
 */
function padCenter(str: string, len: number): string {
  if (str.length >= len) return str;
  const left = Math.floor((len - str.length) / 2);
  const right = len - str.length - left;
  return ' '.repeat(left) + str + ' '.repeat(right);
}

/**
 * Report matrix as JSON
 */
export function reportMatrixToJSON(result: MatrixResult): string {
  // Redact secret values
  const redactedMatrix = { ...result };
  redactedMatrix.matrix = {};
  
  for (const [varName, envData] of Object.entries(result.matrix)) {
    redactedMatrix.matrix[varName] = {};
    for (const [envName, info] of Object.entries(envData)) {
      redactedMatrix.matrix[varName][envName] = {
        ...info,
        value: info.isSecret ? '[REDACTED]' : info.value,
      };
    }
  }

  return JSON.stringify(redactedMatrix, null, 2);
}

/**
 * Report matrix as CSV
 */
export function reportMatrixToCSV(result: MatrixResult): string {
  const lines: string[] = [];
  const envs = result.environments;

  // Header
  lines.push(['Variable', ...envs, 'Status'].join(','));

  // Rows
  for (const row of result.rows) {
    const cells = envs.map(env => {
      const info = row.environments[env];
      if (info.status === 'missing') return 'MISSING';
      if (info.status === 'invalid') return 'INVALID';
      if (info.isSecret) return '[SECRET]';
      return `"${(info.value || '').replace(/"/g, '""')}"`;
    });
    lines.push([`"${row.name}"`, ...cells, row.status.toUpperCase()].join(','));
  }

  return lines.join('\n');
}

/**
 * Report matrix as HTML
 */
export function reportMatrixToHTML(result: MatrixResult): string {
  const envs = result.environments;

  const css = `
    body { font-family: system-ui, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .ok { color: #22c55e; }
    .error { color: #ef4444; }
    .warning { color: #f59e0b; }
    .info { color: #3b82f6; }
    .missing { color: #9ca3af; }
    .secret { color: #6b7280; font-style: italic; }
    .summary { margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; }
    .issues { margin: 20px 0; }
    .issue { padding: 10px; margin: 5px 0; border-left: 3px solid; }
    .issue.error { border-color: #ef4444; background: #fef2f2; }
    .issue.warning { border-color: #f59e0b; background: #fffbeb; }
  `;

  const tableRows = result.rows.map(row => {
    const cells = envs.map(env => {
      const info = row.environments[env];
      let content = '';
      let className = '';

      if (info.status === 'missing') {
        content = '✗ MISSING';
        className = info.valid ? 'missing' : 'error';
      } else if (info.status === 'invalid') {
        content = '✗ INVALID';
        className = 'error';
      } else if (info.isSecret) {
        content = '✓ ****';
        className = 'secret';
      } else {
        content = '✓ ' + (info.value || '(empty)');
        className = 'ok';
      }

      return `<td class="${className}">${escapeHtml(content)}</td>`;
    }).join('');

    return `<tr><td>${escapeHtml(row.name)}</td>${cells}<td class="${row.status}">${row.status.toUpperCase()}</td></tr>`;
  }).join('\n');

  const issues = result.issues
    .filter(i => i.severity !== 'info')
    .map(i => `<div class="issue ${i.severity}"><strong>${escapeHtml(i.variable)}:</strong> ${escapeHtml(i.message)}</div>`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Environment Matrix Report</title>
  <style>${css}</style>
</head>
<body>
  <h1>Environment Variable Matrix</h1>
  <p>Generated: ${result.timestamp}</p>

  <table>
    <thead>
      <tr>
        <th>Variable</th>
        ${envs.map(e => `<th>${escapeHtml(e)}</th>`).join('')}
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="summary">
    <h2>Summary</h2>
    <p>Total variables: ${result.summary.totalVariables}</p>
    <p class="ok">Consistent: ${result.summary.consistentVariables}</p>
    ${result.summary.errorCount > 0 ? `<p class="error">Errors: ${result.summary.errorCount}</p>` : ''}
    ${result.summary.warningCount > 0 ? `<p class="warning">Warnings: ${result.summary.warningCount}</p>` : ''}
  </div>

  ${issues ? `<div class="issues"><h2>Issues</h2>${issues}</div>` : ''}
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

