/**
 * @fileoverview LSP Module Entry Point for env-doctor
 * 
 * Exports the main LSP server and all provider utilities.
 */

// Main server
export { EnvDoctorServer, createServer } from './server.js';

// Types
export * from './types.js';

// Diagnostics
export {
  debounce,
  mapSeverity,
  getDiagnosticCode,
  issueToDiagnostic,
  issuesToDiagnostics,
  filterDiagnosticsByUri,
  createMissingVariableDiagnostic,
  createUnusedVariableDiagnostic,
  createSecretExposedDiagnostic,
  createTypeMismatchDiagnostic,
} from './diagnostics.js';

// Completion
export {
  COMPLETION_TRIGGERS,
  isEnvContext,
  createCompletionItem,
  createCompletionItems,
  createBracketCompletionItems,
  createEnvSnippets,
  resolveCompletionItem,
} from './completion.js';

// Hover
export {
  findEnvVariableAtPosition,
  buildHoverContent,
  createHover,
  createHoverData,
  createEnvFileHover,
} from './hover.js';

// Definition
export {
  createDefinitionLocation,
  createDefinitionLocationLink,
  findDefinition,
  findReferences,
  findUsagesOfEnvVariable,
  parseEnvFileLine,
  isEnvFile,
} from './definition.js';

// Actions
export {
  createAddToEnvAction,
  createTypoFixAction,
  createRemoveFromEnvAction,
  createAddToExampleAction,
  createSyncAction,
  createMoveToServerAction,
  getCodeActionsForDiagnostic,
  getSourceActions,
  levenshteinDistance,
  findSimilarVariables,
} from './actions.js';
