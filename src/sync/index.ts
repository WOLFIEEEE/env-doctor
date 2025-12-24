/**
 * @fileoverview Smart .env.example sync module
 */

export * from './types.js';
export * from './generator.js';
export * from './merger.js';
export * from './formatter.js';

// Re-export sync-related functionality from analyzers
export { analyzeSyncDrift, compareTemplateWithEnv } from '../analyzers/sync-check.js';

