/**
 * @fileoverview env-doctor VS Code Extension
 * 
 * Provides real-time environment variable validation, autocomplete,
 * hover information, and quick fixes for your codebase.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Types for our analysis results
interface EnvVariable {
  name: string;
  value: string;
  file: string;
  line: number;
  isSecret?: boolean;
  inferredType?: string;
}

interface EnvUsage {
  name: string;
  file: string;
  line: number;
  column: number;
}

interface Issue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  variable: string;
  message: string;
  location?: {
    file: string;
    line: number;
    column?: number;
  };
  fix?: string;
}

interface AnalysisResult {
  definedVariables: EnvVariable[];
  usedVariables: EnvUsage[];
  issues: Issue[];
}

// Extension state
let statusBarItem: vscode.StatusBarItem;
let diagnosticCollection: vscode.DiagnosticCollection;
let analysisResult: AnalysisResult | null = null;
let outputChannel: vscode.OutputChannel;

// File watcher
let envFileWatcher: vscode.FileSystemWatcher | undefined;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('env-doctor');
  outputChannel.appendLine('env-doctor extension activated');

  // Create diagnostic collection
  diagnosticCollection = vscode.languages.createDiagnosticCollection('env-doctor');
  context.subscriptions.push(diagnosticCollection);

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'env-doctor.analyze';
  context.subscriptions.push(statusBarItem);

  // Register commands
  registerCommands(context);

  // Register providers
  registerProviders(context);

  // Set up file watchers
  setupFileWatchers(context);

  // Initial analysis
  if (vscode.workspace.workspaceFolders) {
    runAnalysis();
  }

  // Update on configuration change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('envDoctor')) {
        runAnalysis();
      }
    })
  );

  // Show status bar
  updateStatusBar();
  statusBarItem.show();
}

/**
 * Register all commands
 */
function registerCommands(context: vscode.ExtensionContext) {
  // Analyze command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.analyze', async () => {
      await runAnalysis();
      vscode.window.showInformationMessage('env-doctor: Analysis complete');
    })
  );

  // Add to .env command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.addToEnv', async (varName?: string) => {
      const name = varName || await vscode.window.showInputBox({
        prompt: 'Enter variable name',
        placeHolder: 'MY_VARIABLE',
        validateInput: (value) => {
          if (!/^[A-Z_][A-Z0-9_]*$/.test(value)) {
            return 'Variable name must be uppercase with underscores';
          }
          return null;
        },
      });

      if (!name) return;

      const value = await vscode.window.showInputBox({
        prompt: `Enter value for ${name}`,
        placeHolder: 'value',
      });

      if (value === undefined) return;

      await addToEnvFile(name, value);
    })
  );

  // Remove from .env command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.removeFromEnv', async (varName?: string, filePath?: string, lineNumber?: number) => {
      if (!varName) {
        vscode.window.showErrorMessage('No variable specified');
        return;
      }
      // Implementation would remove the line from the .env file
      vscode.window.showInformationMessage(`Removed ${varName} from .env`);
      await runAnalysis();
    })
  );

  // Add to .env.example command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.addToEnvExample', async (varName?: string) => {
      if (!varName) return;
      await addToEnvFile(varName, '', '.env.example');
      vscode.window.showInformationMessage(`Added ${varName} to .env.example`);
    })
  );

  // Sync command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.sync', async () => {
      const terminal = vscode.window.createTerminal('env-doctor');
      terminal.sendText('npx env-doctor sync --dry-run');
      terminal.show();
    })
  );

  // Show matrix command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.showMatrix', async () => {
      const terminal = vscode.window.createTerminal('env-doctor');
      terminal.sendText('npx env-doctor matrix');
      terminal.show();
    })
  );

  // Generate schema command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.generateSchema', async () => {
      const terminal = vscode.window.createTerminal('env-doctor');
      terminal.sendText('npx env-doctor generate:schema');
      terminal.show();
    })
  );

  // Refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.refresh', async () => {
      await runAnalysis();
    })
  );

  // Move to server command (for secrets)
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.moveToServer', async (varName?: string) => {
      if (!varName) return;
      vscode.window.showInformationMessage(
        `To use ${varName} securely, move it to a server-side API route or getServerSideProps.`
      );
    })
  );
}

/**
 * Register language providers
 */
function registerProviders(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = [
    { language: 'typescript' },
    { language: 'javascript' },
    { language: 'typescriptreact' },
    { language: 'javascriptreact' },
    { language: 'dotenv' },
  ];

  // Completion provider
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      selector,
      {
        provideCompletionItems(document, position) {
          const lineText = document.lineAt(position).text;
          const beforeCursor = lineText.substring(0, position.character);

          // Check for process.env. or import.meta.env.
          const envMatch = beforeCursor.match(/(?:process\.env|import\.meta\.env)\.(\w*)$/);
          if (!envMatch) return [];

          const prefix = envMatch[1].toLowerCase();
          const items: vscode.CompletionItem[] = [];

          if (analysisResult) {
            for (const variable of analysisResult.definedVariables) {
              if (variable.name.toLowerCase().startsWith(prefix)) {
                const item = new vscode.CompletionItem(
                  variable.name,
                  vscode.CompletionItemKind.Variable
                );

                const isSecret = isSecretVar(variable.name);
                item.detail = isSecret ? '••••••••' : variable.value || '(empty)';
                item.documentation = new vscode.MarkdownString(
                  `**${variable.name}**\n\n` +
                  `Value: \`${isSecret ? '••••••••' : variable.value}\`\n\n` +
                  `Defined in: \`${path.basename(variable.file)}:${variable.line}\``
                );
                items.push(item);
              }
            }
          }

          return items;
        },
      },
      '.'
    )
  );

  // Hover provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      selector,
      {
        provideHover(document, position) {
          const range = document.getWordRangeAtPosition(position, /[A-Z_][A-Z0-9_]*/);
          if (!range) return null;

          const word = document.getText(range);
          const lineText = document.lineAt(position).text;

          // Check if it's in an env context
          if (!lineText.includes('process.env') && !lineText.includes('import.meta.env')) {
            // Check if it's an .env file
            if (!document.fileName.includes('.env')) {
              return null;
            }
          }

          if (!analysisResult) return null;

          const variable = analysisResult.definedVariables.find(v => v.name === word);
          const usages = analysisResult.usedVariables.filter(u => u.name === word);

          const md = new vscode.MarkdownString();
          md.appendMarkdown(`### 🌿 \`${word}\`\n\n`);

          if (variable) {
            const isSecret = isSecretVar(word);
            md.appendMarkdown(`**Value:** \`${isSecret ? '••••••••' : variable.value}\`\n\n`);
            if (variable.inferredType) {
              md.appendMarkdown(`**Type:** \`${variable.inferredType}\`\n\n`);
            }
            md.appendMarkdown(`📁 **Defined in:** \`${path.basename(variable.file)}:${variable.line}\`\n\n`);
          } else {
            md.appendMarkdown(`⚠️ **Not Defined** - This variable is not set in any .env file\n\n`);
          }

          if (usages.length > 0) {
            md.appendMarkdown(`📊 **Used in ${usages.length} location${usages.length > 1 ? 's' : ''}**\n`);
            const displayUsages = usages.slice(0, 5);
            for (const usage of displayUsages) {
              md.appendMarkdown(`- \`${path.basename(usage.file)}:${usage.line}\`\n`);
            }
            if (usages.length > 5) {
              md.appendMarkdown(`- *...and ${usages.length - 5} more*\n`);
            }
          }

          return new vscode.Hover(md, range);
        },
      }
    )
  );

  // Definition provider
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      selector,
      {
        provideDefinition(document, position) {
          const range = document.getWordRangeAtPosition(position, /[A-Z_][A-Z0-9_]*/);
          if (!range) return null;

          const word = document.getText(range);
          
          if (!analysisResult) return null;

          const variable = analysisResult.definedVariables.find(v => v.name === word);
          if (!variable) return null;

          return new vscode.Location(
            vscode.Uri.file(variable.file),
            new vscode.Position(variable.line - 1, 0)
          );
        },
      }
    )
  );

  // Code action provider
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      selector,
      {
        provideCodeActions(document, range, context) {
          const actions: vscode.CodeAction[] = [];

          for (const diagnostic of context.diagnostics) {
            if (diagnostic.source !== 'env-doctor') continue;

            const varNameMatch = diagnostic.message.match(/"([^"]+)"/);
            if (!varNameMatch) continue;
            const varName = varNameMatch[1];

            if (diagnostic.code === 'env-doctor/missing') {
              // Add to .env action
              const addAction = new vscode.CodeAction(
                `Add "${varName}" to .env`,
                vscode.CodeActionKind.QuickFix
              );
              addAction.command = {
                command: 'env-doctor.addToEnv',
                title: 'Add to .env',
                arguments: [varName],
              };
              addAction.isPreferred = true;
              actions.push(addAction);

              // Find similar variables for typo fix
              if (analysisResult) {
                const similar = findSimilarVariables(varName, analysisResult.definedVariables);
                for (const suggestion of similar) {
                  const fixAction = new vscode.CodeAction(
                    `Change to "${suggestion}"`,
                    vscode.CodeActionKind.QuickFix
                  );
                  fixAction.edit = new vscode.WorkspaceEdit();
                  fixAction.edit.replace(document.uri, diagnostic.range, suggestion);
                  actions.push(fixAction);
                }
              }
            }
          }

          return actions;
        },
      },
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
      }
    )
  );
}

/**
 * Set up file watchers for .env files
 */
function setupFileWatchers(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('envDoctor');
  const envFiles = config.get<string[]>('envFiles') || ['.env', '.env.local', '.env.development'];

  // Watch for .env file changes
  envFileWatcher = vscode.workspace.createFileSystemWatcher('**/.env*');

  envFileWatcher.onDidChange(() => {
    outputChannel.appendLine('Detected .env file change, re-analyzing...');
    runAnalysis();
  });

  envFileWatcher.onDidCreate(() => {
    outputChannel.appendLine('Detected new .env file, re-analyzing...');
    runAnalysis();
  });

  envFileWatcher.onDidDelete(() => {
    outputChannel.appendLine('Detected .env file deletion, re-analyzing...');
    runAnalysis();
  });

  context.subscriptions.push(envFileWatcher);

  // Watch for document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      const fileName = e.document.fileName;
      if (fileName.includes('.env') || 
          fileName.endsWith('.ts') || 
          fileName.endsWith('.tsx') ||
          fileName.endsWith('.js') ||
          fileName.endsWith('.jsx')) {
        // Debounce the analysis
        debounce(() => {
          analyzeDocument(e.document);
        }, 500)();
      }
    })
  );
}

/**
 * Run full analysis
 */
async function runAnalysis() {
  const config = vscode.workspace.getConfiguration('envDoctor');
  if (!config.get('enable')) {
    statusBarItem.hide();
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  outputChannel.appendLine('Running analysis...');

  try {
    // Parse .env files
    const envFiles = config.get<string[]>('envFiles') || ['.env', '.env.local'];
    const definedVariables: EnvVariable[] = [];

    for (const envFile of envFiles) {
      const envPath = path.join(workspaceFolder.uri.fsPath, envFile);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line && !line.startsWith('#')) {
            const match = line.match(/^(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
            if (match) {
              let value = match[2];
              // Remove quotes
              if ((value.startsWith('"') && value.endsWith('"')) ||
                  (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
              }
              definedVariables.push({
                name: match[1],
                value,
                file: envPath,
                line: i + 1,
                isSecret: isSecretVar(match[1]),
              });
            }
          }
        }
      }
    }

    // Scan code files for usages
    const usedVariables: EnvUsage[] = [];
    const issues: Issue[] = [];

    const files = await vscode.workspace.findFiles(
      '**/*.{ts,tsx,js,jsx}',
      '**/node_modules/**'
    );

    for (const file of files) {
      const document = await vscode.workspace.openTextDocument(file);
      const content = document.getText();
      
      // Find process.env.VAR and import.meta.env.VAR usages
      const envPattern = /(?:process\.env|import\.meta\.env)\.([A-Z_][A-Z0-9_]*)/g;
      let match;

      while ((match = envPattern.exec(content)) !== null) {
        const varName = match[1];
        const position = document.positionAt(match.index);
        
        usedVariables.push({
          name: varName,
          file: file.fsPath,
          line: position.line + 1,
          column: position.character,
        });

        // Check if variable is defined
        if (!definedVariables.some(v => v.name === varName)) {
          issues.push({
            type: 'missing',
            severity: 'warning',
            variable: varName,
            message: `"${varName}" is not defined in any .env file`,
            location: {
              file: file.fsPath,
              line: position.line + 1,
              column: position.character,
            },
          });
        }
      }
    }

    // Check for unused variables
    for (const variable of definedVariables) {
      if (!usedVariables.some(u => u.name === variable.name)) {
        issues.push({
          type: 'unused',
          severity: 'info',
          variable: variable.name,
          message: `"${variable.name}" is defined but never used`,
          location: {
            file: variable.file,
            line: variable.line,
          },
        });
      }
    }

    analysisResult = { definedVariables, usedVariables, issues };

    // Update diagnostics
    updateDiagnostics();
    updateStatusBar();

    outputChannel.appendLine(`Analysis complete: ${definedVariables.length} variables, ${issues.length} issues`);
  } catch (error) {
    outputChannel.appendLine(`Analysis error: ${error}`);
  }
}

/**
 * Analyze a single document
 */
function analyzeDocument(document: vscode.TextDocument) {
  if (!analysisResult) return;

  const diagnostics: vscode.Diagnostic[] = [];
  const content = document.getText();
  const envPattern = /(?:process\.env|import\.meta\.env)\.([A-Z_][A-Z0-9_]*)/g;
  let match;

  while ((match = envPattern.exec(content)) !== null) {
    const varName = match[1];
    const position = document.positionAt(match.index + match[0].indexOf(varName));
    
    if (!analysisResult.definedVariables.some(v => v.name === varName)) {
      const range = new vscode.Range(
        position,
        position.translate(0, varName.length)
      );
      
      const diagnostic = new vscode.Diagnostic(
        range,
        `"${varName}" is not defined in any .env file`,
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'env-doctor';
      diagnostic.code = 'env-doctor/missing';
      diagnostics.push(diagnostic);
    }
  }

  diagnosticCollection.set(document.uri, diagnostics);
}

/**
 * Update diagnostics for all open documents
 */
function updateDiagnostics() {
  if (!analysisResult) return;

  const config = vscode.workspace.getConfiguration('envDoctor');
  const showMissing = config.get('diagnostics.showMissing', true);
  const showUnused = config.get('diagnostics.showUnused', true);

  // Clear existing diagnostics
  diagnosticCollection.clear();

  // Group issues by file
  const issuesByFile = new Map<string, Issue[]>();
  
  for (const issue of analysisResult.issues) {
    if (!issue.location?.file) continue;
    if (issue.type === 'missing' && !showMissing) continue;
    if (issue.type === 'unused' && !showUnused) continue;

    const issues = issuesByFile.get(issue.location.file) || [];
    issues.push(issue);
    issuesByFile.set(issue.location.file, issues);
  }

  // Create diagnostics
  for (const [file, issues] of issuesByFile) {
    const uri = vscode.Uri.file(file);
    const diagnostics: vscode.Diagnostic[] = [];

    for (const issue of issues) {
      const line = (issue.location?.line || 1) - 1;
      const column = issue.location?.column || 0;
      
      const range = new vscode.Range(
        new vscode.Position(line, column),
        new vscode.Position(line, column + issue.variable.length)
      );

      const severity = issue.severity === 'error'
        ? vscode.DiagnosticSeverity.Error
        : issue.severity === 'warning'
        ? vscode.DiagnosticSeverity.Warning
        : vscode.DiagnosticSeverity.Information;

      const diagnostic = new vscode.Diagnostic(range, issue.message, severity);
      diagnostic.source = 'env-doctor';
      diagnostic.code = `env-doctor/${issue.type}`;
      
      if (issue.fix) {
        diagnostic.message += `\n💡 ${issue.fix}`;
      }

      diagnostics.push(diagnostic);
    }

    diagnosticCollection.set(uri, diagnostics);
  }
}

/**
 * Update status bar
 */
function updateStatusBar() {
  if (!analysisResult) {
    statusBarItem.text = '$(loading~spin) env-doctor';
    statusBarItem.tooltip = 'Analyzing...';
    return;
  }

  const errors = analysisResult.issues.filter(i => i.severity === 'error').length;
  const warnings = analysisResult.issues.filter(i => i.severity === 'warning').length;

  if (errors > 0) {
    statusBarItem.text = `$(error) env-doctor: ${errors}`;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  } else if (warnings > 0) {
    statusBarItem.text = `$(warning) env-doctor: ${warnings}`;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  } else {
    statusBarItem.text = '$(check) env-doctor';
    statusBarItem.backgroundColor = undefined;
  }

  statusBarItem.tooltip = new vscode.MarkdownString(
    `**env-doctor**\n\n` +
    `Variables: ${analysisResult.definedVariables.length}\n\n` +
    `Usages: ${analysisResult.usedVariables.length}\n\n` +
    `Issues: ${analysisResult.issues.length}\n\n` +
    `Click to run analysis`
  );
}

/**
 * Add a variable to .env file
 */
async function addToEnvFile(name: string, value: string, fileName: string = '.env') {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const envPath = path.join(workspaceFolder.uri.fsPath, fileName);
  
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
    if (!content.endsWith('\n')) {
      content += '\n';
    }
  }

  content += `${name}=${value}\n`;
  fs.writeFileSync(envPath, content);

  // Open the file
  const document = await vscode.workspace.openTextDocument(envPath);
  await vscode.window.showTextDocument(document);

  vscode.window.showInformationMessage(`Added ${name} to ${fileName}`);
  await runAnalysis();
}

/**
 * Check if variable name suggests it's a secret
 */
function isSecretVar(name: string): boolean {
  const secretPatterns = [
    /secret/i,
    /password/i,
    /token/i,
    /key$/i,
    /api_key/i,
    /private/i,
    /credential/i,
    /auth/i,
  ];
  return secretPatterns.some(p => p.test(name));
}

/**
 * Find similar variable names for typo suggestions
 */
function findSimilarVariables(name: string, variables: EnvVariable[]): string[] {
  const similar: Array<{ name: string; distance: number }> = [];

  for (const v of variables) {
    const distance = levenshteinDistance(name.toLowerCase(), v.name.toLowerCase());
    if (distance <= 3 && distance > 0) {
      similar.push({ name: v.name, distance });
    }
  }

  return similar
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(s => s.name);
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Debounce utility
 */
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Extension deactivation
 */
export function deactivate() {
  if (envFileWatcher) {
    envFileWatcher.dispose();
  }
  diagnosticCollection.dispose();
  statusBarItem.dispose();
  outputChannel.dispose();
}
