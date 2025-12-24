/**
 * @fileoverview LSP Code Actions Provider for env-doctor
 * 
 * Provides quick fixes and code actions for environment variable issues:
 * - Add missing variable to .env
 * - Fix typo (suggest similar variable names)
 * - Remove unused variable from .env
 * - Add variable to .env.example
 */

import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
  TextEdit,
  WorkspaceEdit,
} from 'vscode-languageserver/node';

import type { EnvVariable } from '../types/index.js';
import { DIAGNOSTIC_CODES } from './types.js';

/**
 * Create code action to add variable to .env file
 */
export function createAddToEnvAction(
  varName: string,
  envFilePath: string,
  diagnostic: Diagnostic
): CodeAction {
  return {
    title: `Add "${varName}" to .env`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    isPreferred: true,
    command: {
      title: `Add ${varName} to .env`,
      command: 'env-doctor.addToEnv',
      arguments: [varName, envFilePath],
    },
  };
}

/**
 * Create code action to fix typo with similar variable name
 */
export function createTypoFixAction(
  originalName: string,
  suggestedName: string,
  range: Range,
  uri: string,
  diagnostic: Diagnostic
): CodeAction {
  const edit: WorkspaceEdit = {
    changes: {
      [uri]: [
        TextEdit.replace(range, suggestedName),
      ],
    },
  };

  return {
    title: `Change to "${suggestedName}"`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit,
  };
}

/**
 * Create code action to remove unused variable from .env
 */
export function createRemoveFromEnvAction(
  varName: string,
  envFilePath: string,
  lineNumber: number,
  diagnostic: Diagnostic
): CodeAction {
  return {
    title: `Remove "${varName}" from .env`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    command: {
      title: `Remove ${varName}`,
      command: 'env-doctor.removeFromEnv',
      arguments: [varName, envFilePath, lineNumber],
    },
  };
}

/**
 * Create code action to add variable to .env.example
 */
export function createAddToExampleAction(
  varName: string,
  diagnostic: Diagnostic
): CodeAction {
  return {
    title: `Add "${varName}" to .env.example`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    command: {
      title: `Add ${varName} to .env.example`,
      command: 'env-doctor.addToEnvExample',
      arguments: [varName],
    },
  };
}

/**
 * Create code action to run env-doctor sync
 */
export function createSyncAction(): CodeAction {
  return {
    title: 'Sync .env.example with code',
    kind: CodeActionKind.Source,
    command: {
      title: 'Run env-doctor sync',
      command: 'env-doctor.sync',
    },
  };
}

/**
 * Create code action to move secret from client to server
 */
export function createMoveToServerAction(
  varName: string,
  diagnostic: Diagnostic
): CodeAction {
  return {
    title: `Move "${varName}" to server-side code`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    command: {
      title: `Move ${varName} to server`,
      command: 'env-doctor.moveToServer',
      arguments: [varName],
    },
  };
}

/**
 * Get code actions for a diagnostic
 */
export function getCodeActionsForDiagnostic(
  diagnostic: Diagnostic,
  uri: string,
  envFilePath: string,
  similarVariables: string[]
): CodeAction[] {
  const actions: CodeAction[] = [];
  const code = diagnostic.code as string;

  // Extract variable name from diagnostic message
  const varNameMatch = diagnostic.message.match(/"([^"]+)"/);
  const varName = varNameMatch ? varNameMatch[1] : '';

  if (!varName) return actions;

  switch (code) {
    case DIAGNOSTIC_CODES.MISSING_VARIABLE:
      // Add to .env
      actions.push(createAddToEnvAction(varName, envFilePath, diagnostic));

      // Suggest similar names (typo fixes)
      for (const suggestion of similarVariables.slice(0, 3)) {
        actions.push(
          createTypoFixAction(
            varName,
            suggestion,
            diagnostic.range,
            uri,
            diagnostic
          )
        );
      }

      // Add to .env.example
      actions.push(createAddToExampleAction(varName, diagnostic));
      break;

    case DIAGNOSTIC_CODES.UNUSED_VARIABLE:
      actions.push(
        createRemoveFromEnvAction(
          varName,
          envFilePath,
          diagnostic.range.start.line + 1,
          diagnostic
        )
      );
      break;

    case DIAGNOSTIC_CODES.SECRET_EXPOSED:
      actions.push(createMoveToServerAction(varName, diagnostic));
      break;
  }

  return actions;
}

/**
 * Create source actions available in a file
 */
export function getSourceActions(_uri: string): CodeAction[] {
  return [
    createSyncAction(),
    {
      title: 'Run env-doctor analysis',
      kind: CodeActionKind.Source,
      command: {
        title: 'Analyze environment variables',
        command: 'env-doctor.analyze',
      },
    },
    {
      title: 'Generate TypeScript schema',
      kind: CodeActionKind.Source,
      command: {
        title: 'Generate schema',
        command: 'env-doctor.generateSchema',
      },
    },
  ];
}

/**
 * Calculate Levenshtein distance for typo detection
 */
export function levenshteinDistance(a: string, b: string): number {
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
 * Find similar variable names (for typo suggestions)
 */
export function findSimilarVariables(
  name: string,
  definedVariables: EnvVariable[],
  maxDistance: number = 3,
  maxResults: number = 3
): string[] {
  const similar: Array<{ name: string; distance: number }> = [];

  for (const v of definedVariables) {
    const distance = levenshteinDistance(
      name.toLowerCase(),
      v.name.toLowerCase()
    );
    if (distance <= maxDistance && distance > 0) {
      similar.push({ name: v.name, distance });
    }
  }

  return similar
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults)
    .map(s => s.name);
}

