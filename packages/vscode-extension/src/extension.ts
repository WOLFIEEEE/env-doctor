/**
 * @fileoverview VS Code Extension for env-doctor
 */

import * as vscode from 'vscode';

// Types from env-doctor LSP
interface DocumentAnalysis {
  uri: string;
  version: number;
  usages: Array<{
    name: string;
    file: string;
    line: number;
    column: number;
  }>;
  issues: Array<{
    type: string;
    severity: string;
    variable: string;
    message: string;
    location?: { file: string; line: number; column?: number };
    fix?: string;
  }>;
  timestamp: number;
}

interface EnvVariable {
  name: string;
  value: string;
  file: string;
  line: number;
  isSecret?: boolean;
  inferredType?: string;
}

/**
 * Extension state
 */
let diagnosticCollection: vscode.DiagnosticCollection;
let definedVariables: EnvVariable[] = [];
let allUsages: Map<string, DocumentAnalysis['usages']> = new Map();

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('env-doctor extension activating...');

  // Create diagnostic collection
  diagnosticCollection = vscode.languages.createDiagnosticCollection('env-doctor');
  context.subscriptions.push(diagnosticCollection);

  // Register providers
  registerCompletionProvider(context);
  registerHoverProvider(context);
  registerDefinitionProvider(context);
  registerCodeActionsProvider(context);
  registerCodeLensProvider(context);

  // Register commands
  registerCommands(context);

  // Set up file watchers
  setupFileWatchers(context);

  // Initial analysis
  runInitialAnalysis();

  console.log('env-doctor extension activated');
}

/**
 * Deactivate the extension
 */
export function deactivate(): void {
  diagnosticCollection?.dispose();
}

/**
 * Register completion provider for process.env
 */
function registerCompletionProvider(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerCompletionItemProvider(
    ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
    {
      provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.slice(0, position.character);

        // Check if we're after process.env. or import.meta.env.
        if (!linePrefix.match(/(?:process\.env|import\.meta\.env)\.\s*\w*$/)) {
          return undefined;
        }

        const config = vscode.workspace.getConfiguration('envDoctor');
        const showValues = config.get<boolean>('autocomplete.showValues', true);
        const redactSecrets = config.get<boolean>('autocomplete.redactSecrets', true);

        return definedVariables.map(v => {
          const item = new vscode.CompletionItem(v.name, vscode.CompletionItemKind.Variable);
          
          // Set detail (value preview)
          if (showValues) {
            if (v.isSecret && redactSecrets) {
              item.detail = '****';
            } else {
              item.detail = v.value;
            }
          }

          // Set documentation
          item.documentation = new vscode.MarkdownString()
            .appendCodeblock(`${v.name}=${v.isSecret ? '****' : v.value}`, 'dotenv')
            .appendMarkdown(`\n\n*Source: \`${v.file}:${v.line}\`*`);

          if (v.inferredType) {
            item.documentation.appendMarkdown(`\n\n*Type: ${v.inferredType}*`);
          }

          return item;
        });
      },
    },
    '.' // Trigger on dot
  );

  context.subscriptions.push(provider);
}

/**
 * Register hover provider
 */
function registerHoverProvider(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerHoverProvider(
    ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
    {
      provideHover(document, position) {
        const wordRange = document.getWordRangeAtPosition(position, /\w+/);
        if (!wordRange) return null;

        const word = document.getText(wordRange);
        const lineText = document.lineAt(position.line).text;

        // Check if this is an env variable access
        const beforeWord = lineText.slice(0, wordRange.start.character);
        if (!beforeWord.match(/(?:process\.env|import\.meta\.env)\.$/)) {
          return null;
        }

        const variable = definedVariables.find(v => v.name === word);
        if (!variable) {
          return new vscode.Hover(
            new vscode.MarkdownString(`⚠️ **${word}** is not defined in any .env file`)
          );
        }

        const config = vscode.workspace.getConfiguration('envDoctor');
        const showUsages = config.get<boolean>('hover.showUsages', true);
        const maxUsages = config.get<number>('hover.maxUsages', 5);

        const md = new vscode.MarkdownString();
        md.appendMarkdown(`### ${variable.name}\n\n`);
        md.appendCodeblock(`${variable.name}=${variable.isSecret ? '****' : variable.value}`, 'dotenv');
        md.appendMarkdown(`\n\n**Source:** \`${variable.file}:${variable.line}\`\n`);

        if (variable.inferredType) {
          md.appendMarkdown(`\n**Type:** ${variable.inferredType}\n`);
        }

        // Show usages
        if (showUsages) {
          const usages: Array<{ file: string; line: number }> = [];
          for (const [file, fileUsages] of allUsages) {
            for (const usage of fileUsages) {
              if (usage.name === word) {
                usages.push({ file, line: usage.line });
              }
            }
          }

          if (usages.length > 0) {
            md.appendMarkdown(`\n**Used in:**\n`);
            const displayed = usages.slice(0, maxUsages);
            for (const u of displayed) {
              md.appendMarkdown(`- \`${u.file}:${u.line}\`\n`);
            }
            if (usages.length > maxUsages) {
              md.appendMarkdown(`\n*...and ${usages.length - maxUsages} more*\n`);
            }
          }
        }

        return new vscode.Hover(md);
      },
    }
  );

  context.subscriptions.push(provider);
}

/**
 * Register definition provider (go to .env file)
 */
function registerDefinitionProvider(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerDefinitionProvider(
    ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
    {
      provideDefinition(document, position) {
        const wordRange = document.getWordRangeAtPosition(position, /\w+/);
        if (!wordRange) return null;

        const word = document.getText(wordRange);
        const lineText = document.lineAt(position.line).text;

        // Check if this is an env variable access
        const beforeWord = lineText.slice(0, wordRange.start.character);
        if (!beforeWord.match(/(?:process\.env|import\.meta\.env)\.$/)) {
          return null;
        }

        const variable = definedVariables.find(v => v.name === word);
        if (!variable) return null;

        const uri = vscode.Uri.file(variable.file);
        const pos = new vscode.Position(variable.line - 1, 0);
        return new vscode.Location(uri, pos);
      },
    }
  );

  context.subscriptions.push(provider);
}

/**
 * Register code actions provider (quick fixes)
 */
function registerCodeActionsProvider(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerCodeActionsProvider(
    ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
    {
      provideCodeActions(document, range, context) {
        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
          if (diagnostic.source !== 'env-doctor') continue;

          if (diagnostic.code === 'env-doctor/missing') {
            const match = diagnostic.message.match(/"([^"]+)"/);
            if (match) {
              const varName = match[1];

              // Add to .env action
              const addAction = new vscode.CodeAction(
                `Add ${varName} to .env`,
                vscode.CodeActionKind.QuickFix
              );
              addAction.command = {
                command: 'env-doctor.addToEnv',
                title: 'Add to .env',
                arguments: [varName],
              };
              addAction.diagnostics = [diagnostic];
              actions.push(addAction);

              // Add to .env.example action
              const addExampleAction = new vscode.CodeAction(
                `Add ${varName} to .env.example`,
                vscode.CodeActionKind.QuickFix
              );
              addExampleAction.command = {
                command: 'env-doctor.addToEnv',
                title: 'Add to .env.example',
                arguments: [varName, '.env.example'],
              };
              addExampleAction.diagnostics = [diagnostic];
              actions.push(addExampleAction);
            }
          }
        }

        return actions;
      },
    },
    {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }
  );

  context.subscriptions.push(provider);
}

/**
 * Register CodeLens provider for .env files
 */
function registerCodeLensProvider(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerCodeLensProvider(
    { pattern: '**/.env*' },
    {
      provideCodeLenses(document) {
        const config = vscode.workspace.getConfiguration('envDoctor');
        if (!config.get<boolean>('codeLens.enable', true)) {
          return [];
        }

        const lenses: vscode.CodeLens[] = [];

        for (let i = 0; i < document.lineCount; i++) {
          const line = document.lineAt(i);
          const match = line.text.match(/^([A-Z][A-Z0-9_]*)=/);

          if (match) {
            const varName = match[1];

            // Count references
            let refCount = 0;
            for (const [, fileUsages] of allUsages) {
              refCount += fileUsages.filter(u => u.name === varName).length;
            }

            // Check if it's a secret
            const variable = definedVariables.find(v => v.name === varName);
            const isSecret = variable?.isSecret ?? false;

            const range = new vscode.Range(i, 0, i, match[0].length);
            const lens = new vscode.CodeLens(range);
            lens.command = {
              title: `${refCount} reference${refCount !== 1 ? 's' : ''}${isSecret ? ' | Secret' : ''}`,
              command: 'env-doctor.findReferences',
              arguments: [varName],
            };
            lenses.push(lens);
          }
        }

        return lenses;
      },
    }
  );

  context.subscriptions.push(provider);
}

/**
 * Register commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // Analyze command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.analyze', async () => {
      await runFullAnalysis();
      vscode.window.showInformationMessage('env-doctor: Analysis complete');
    })
  );

  // Add to .env command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.addToEnv', async (varName: string, fileName = '.env') => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) return;

      const value = await vscode.window.showInputBox({
        prompt: `Enter value for ${varName}`,
        placeHolder: 'value',
      });

      if (value === undefined) return;

      const envPath = vscode.Uri.joinPath(workspaceFolder.uri, fileName);
      
      try {
        const existing = await vscode.workspace.fs.readFile(envPath);
        const content = new TextDecoder().decode(existing);
        const newContent = content.endsWith('\n') 
          ? `${content}${varName}=${value}\n`
          : `${content}\n${varName}=${value}\n`;
        
        await vscode.workspace.fs.writeFile(envPath, new TextEncoder().encode(newContent));
        vscode.window.showInformationMessage(`Added ${varName} to ${fileName}`);
        
        // Refresh analysis
        await runFullAnalysis();
      } catch {
        // File doesn't exist, create it
        await vscode.workspace.fs.writeFile(envPath, new TextEncoder().encode(`${varName}=${value}\n`));
        vscode.window.showInformationMessage(`Created ${fileName} with ${varName}`);
        await runFullAnalysis();
      }
    })
  );

  // Sync template command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.syncTemplate', async () => {
      const terminal = vscode.window.createTerminal('env-doctor');
      terminal.sendText('npx env-doctor sync --interactive');
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

  // Find references command
  context.subscriptions.push(
    vscode.commands.registerCommand('env-doctor.findReferences', async (varName: string) => {
      const locations: vscode.Location[] = [];
      
      for (const [file, fileUsages] of allUsages) {
        for (const usage of fileUsages) {
          if (usage.name === varName) {
            locations.push(new vscode.Location(
              vscode.Uri.file(file),
              new vscode.Position(usage.line - 1, usage.column)
            ));
          }
        }
      }

      if (locations.length === 0) {
        vscode.window.showInformationMessage(`No references found for ${varName}`);
        return;
      }

      await vscode.commands.executeCommand('editor.action.showReferences',
        locations[0].uri,
        locations[0].range.start,
        locations
      );
    })
  );
}

/**
 * Set up file watchers
 */
function setupFileWatchers(context: vscode.ExtensionContext): void {
  // Watch for .env file changes
  const envWatcher = vscode.workspace.createFileSystemWatcher('**/.env*');
  
  envWatcher.onDidChange(() => runFullAnalysis());
  envWatcher.onDidCreate(() => runFullAnalysis());
  envWatcher.onDidDelete(() => runFullAnalysis());
  
  context.subscriptions.push(envWatcher);

  // Watch for document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document.languageId.match(/typescript|javascript/)) {
        analyzeDocument(event.document);
      }
    })
  );

  // Watch for document open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(document => {
      if (document.languageId.match(/typescript|javascript/)) {
        analyzeDocument(document);
      }
    })
  );
}

/**
 * Run initial analysis
 */
async function runInitialAnalysis(): Promise<void> {
  await runFullAnalysis();

  // Analyze open documents
  for (const document of vscode.workspace.textDocuments) {
    if (document.languageId.match(/typescript|javascript/)) {
      await analyzeDocument(document);
    }
  }
}

/**
 * Run full analysis using env-doctor
 */
async function runFullAnalysis(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  try {
    // For now, we'll parse env files directly
    // In production, this would use the env-doctor analyze function
    const config = vscode.workspace.getConfiguration('envDoctor');
    const envFiles = config.get<string[]>('envFiles', ['.env', '.env.local']);

    definedVariables = [];

    for (const envFile of envFiles) {
      const envPath = vscode.Uri.joinPath(workspaceFolder.uri, envFile);
      try {
        const content = await vscode.workspace.fs.readFile(envPath);
        const text = new TextDecoder().decode(content);
        const vars = parseEnvContent(text, envPath.fsPath);
        definedVariables.push(...vars);
      } catch {
        // File doesn't exist, skip
      }
    }

    console.log(`env-doctor: Found ${definedVariables.length} variables`);
  } catch (error) {
    console.error('env-doctor: Analysis failed', error);
  }
}

/**
 * Parse .env file content
 */
function parseEnvContent(content: string, filePath: string): EnvVariable[] {
  const variables: EnvVariable[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, name, value] = match;
      const isSecret = /secret|password|key|token|api/i.test(name);
      
      variables.push({
        name,
        value,
        file: filePath,
        line: i + 1,
        isSecret,
        inferredType: inferType(value),
      });
    }
  }

  return variables;
}

/**
 * Infer type from value
 */
function inferType(value: string): string | undefined {
  if (/^\d+$/.test(value)) return 'number';
  if (/^(true|false)$/i.test(value)) return 'boolean';
  if (/^https?:\/\//.test(value)) return 'url';
  if (value.startsWith('{') || value.startsWith('[')) return 'json';
  return 'string';
}

/**
 * Analyze a single document
 */
async function analyzeDocument(document: vscode.TextDocument): Promise<void> {
  const config = vscode.workspace.getConfiguration('envDoctor');
  if (!config.get<boolean>('enable', true)) return;

  const text = document.getText();
  const uri = document.uri.toString();
  const filePath = document.uri.fsPath;

  // Find env variable usages
  const usages: DocumentAnalysis['usages'] = [];
  const issues: DocumentAnalysis['issues'] = [];

  const envRegex = /(?:process\.env|import\.meta\.env)\.(\w+)/g;
  let match;

  while ((match = envRegex.exec(text)) !== null) {
    const varName = match[1];
    const position = document.positionAt(match.index + match[0].indexOf(varName));

    usages.push({
      name: varName,
      file: filePath,
      line: position.line + 1,
      column: position.character,
    });

    // Check if variable is defined
    const defined = definedVariables.find(v => v.name === varName);
    if (!defined && config.get<boolean>('diagnostics.showMissing', true)) {
      issues.push({
        type: 'missing',
        severity: 'warning',
        variable: varName,
        message: `"${varName}" is not defined in any .env file`,
        location: { file: filePath, line: position.line + 1, column: position.character },
      });
    }
  }

  // Update usages map
  allUsages.set(filePath, usages);

  // Update diagnostics
  const diagnostics: vscode.Diagnostic[] = issues.map(issue => {
    const line = (issue.location?.line || 1) - 1;
    const col = issue.location?.column || 0;
    const range = new vscode.Range(line, col, line, col + issue.variable.length);

    const diagnostic = new vscode.Diagnostic(
      range,
      issue.message,
      issue.severity === 'error' ? vscode.DiagnosticSeverity.Error :
      issue.severity === 'warning' ? vscode.DiagnosticSeverity.Warning :
      vscode.DiagnosticSeverity.Information
    );
    diagnostic.code = `env-doctor/${issue.type}`;
    diagnostic.source = 'env-doctor';

    return diagnostic;
  });

  diagnosticCollection.set(document.uri, diagnostics);
}

