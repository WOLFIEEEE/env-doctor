import { describe, it, expect } from 'vitest';
import type { EnvVariable, EnvUsage, EnvDoctorConfig } from '../../src/types/index.js';
import { analyzeMissing } from '../../src/analyzers/missing.js';
import { analyzeUnused } from '../../src/analyzers/unused.js';
import { analyzeTypeMismatch } from '../../src/analyzers/type-mismatch.js';
import { analyzeSyncDrift } from '../../src/analyzers/sync-check.js';
import { analyzeSecrets } from '../../src/analyzers/secret-patterns.js';
import { defaultConfig } from '../../src/types/config.js';

describe('analyzers', () => {
  const createConfig = (overrides: Partial<EnvDoctorConfig> = {}): EnvDoctorConfig => ({
    ...defaultConfig,
    ...overrides,
  });

  describe('analyzeMissing', () => {
    it('should detect missing variables', () => {
      const definedVariables: EnvVariable[] = [
        { name: 'DEFINED_VAR', value: 'value', line: 1, file: '.env' },
      ];

      const usedVariables: EnvUsage[] = [
        { name: 'DEFINED_VAR', file: 'test.ts', line: 1, column: 0, accessPattern: 'direct' },
        { name: 'MISSING_VAR', file: 'test.ts', line: 2, column: 0, accessPattern: 'direct' },
      ];

      const issues = analyzeMissing({
        definedVariables,
        usedVariables,
        config: createConfig(),
      });

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('missing');
      expect(issues[0].variable).toBe('MISSING_VAR');
    });

    it('should mark required variables as errors', () => {
      const definedVariables: EnvVariable[] = [];
      const usedVariables: EnvUsage[] = [
        { name: 'REQUIRED_VAR', file: 'test.ts', line: 1, column: 0, accessPattern: 'direct' },
      ];

      const issues = analyzeMissing({
        definedVariables,
        usedVariables,
        config: createConfig({
          variables: {
            REQUIRED_VAR: { required: true },
          },
        }),
      });

      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('error');
    });

    it('should skip variables with defaults', () => {
      const definedVariables: EnvVariable[] = [];
      const usedVariables: EnvUsage[] = [
        { name: 'VAR_WITH_DEFAULT', file: 'test.ts', line: 1, column: 0, accessPattern: 'direct' },
      ];

      const issues = analyzeMissing({
        definedVariables,
        usedVariables,
        config: createConfig({
          variables: {
            VAR_WITH_DEFAULT: { default: 'default_value' },
          },
        }),
      });

      expect(issues).toHaveLength(0);
    });

    it('should skip ignored variables', () => {
      const definedVariables: EnvVariable[] = [];
      const usedVariables: EnvUsage[] = [
        { name: 'IGNORED_VAR', file: 'test.ts', line: 1, column: 0, accessPattern: 'direct' },
        { name: 'LEGACY_VAR', file: 'test.ts', line: 2, column: 0, accessPattern: 'direct' },
      ];

      const issues = analyzeMissing({
        definedVariables,
        usedVariables,
        config: createConfig({
          ignore: ['IGNORED_VAR', 'LEGACY_*'],
        }),
      });

      expect(issues).toHaveLength(0);
    });

    it('should skip dynamic access', () => {
      const definedVariables: EnvVariable[] = [];
      const usedVariables: EnvUsage[] = [
        { name: '<dynamic>', file: 'test.ts', line: 1, column: 0, accessPattern: 'dynamic' },
      ];

      const issues = analyzeMissing({
        definedVariables,
        usedVariables,
        config: createConfig(),
      });

      expect(issues).toHaveLength(0);
    });
  });

  describe('analyzeUnused', () => {
    it('should detect unused variables', () => {
      const definedVariables: EnvVariable[] = [
        { name: 'USED_VAR', value: 'value', line: 1, file: '.env' },
        { name: 'UNUSED_VAR', value: 'value', line: 2, file: '.env' },
      ];

      const usedVariables: EnvUsage[] = [
        { name: 'USED_VAR', file: 'test.ts', line: 1, column: 0, accessPattern: 'direct' },
      ];

      const issues = analyzeUnused({
        definedVariables,
        usedVariables,
        config: createConfig(),
        framework: 'node',
      });

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('unused');
      expect(issues[0].variable).toBe('UNUSED_VAR');
    });

    it('should not report common runtime variables', () => {
      const definedVariables: EnvVariable[] = [
        { name: 'NODE_ENV', value: 'development', line: 1, file: '.env' },
        { name: 'PORT', value: '3000', line: 2, file: '.env' },
        { name: 'DEBUG', value: 'true', line: 3, file: '.env' },
      ];

      const usedVariables: EnvUsage[] = [];

      const issues = analyzeUnused({
        definedVariables,
        usedVariables,
        config: createConfig(),
        framework: 'node',
      });

      expect(issues).toHaveLength(0);
    });

    it('should skip placeholder values', () => {
      const definedVariables: EnvVariable[] = [
        { name: 'PLACEHOLDER_VAR', value: 'your_api_key', line: 1, file: '.env' },
        { name: 'EMPTY_VAR', value: '', line: 2, file: '.env' },
      ];

      const usedVariables: EnvUsage[] = [];

      const issues = analyzeUnused({
        definedVariables,
        usedVariables,
        config: createConfig(),
        framework: 'node',
      });

      expect(issues).toHaveLength(0);
    });
  });

  describe('analyzeTypeMismatch', () => {
    it('should detect number type mismatch', () => {
      const definedVariables: EnvVariable[] = [
        { name: 'PORT', value: 'not_a_number', line: 1, file: '.env' },
      ];

      const usedVariables: EnvUsage[] = [
        {
          name: 'PORT',
          file: 'test.ts',
          line: 1,
          column: 0,
          accessPattern: 'direct',
          inferredType: 'number',
        },
      ];

      const issues = analyzeTypeMismatch({
        definedVariables,
        usedVariables,
        config: createConfig(),
      });

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('type-mismatch');
    });

    it('should validate explicit type from config', () => {
      const definedVariables: EnvVariable[] = [
        { name: 'PORT', value: 'hello', line: 1, file: '.env' },
      ];

      // Need at least one usage to trigger the check
      const usedVariables: EnvUsage[] = [
        { name: 'PORT', file: 'test.ts', line: 1, column: 0, accessPattern: 'direct' },
      ];

      const issues = analyzeTypeMismatch({
        definedVariables,
        usedVariables,
        config: createConfig({
          variables: {
            PORT: { type: 'number' },
          },
        }),
      });

      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('error');
    });

    it('should validate pattern from config', () => {
      const definedVariables: EnvVariable[] = [
        { name: 'DATABASE_URL', value: 'invalid_url', line: 1, file: '.env' },
      ];

      // Need at least one usage to trigger the check
      const usedVariables: EnvUsage[] = [
        { name: 'DATABASE_URL', file: 'test.ts', line: 1, column: 0, accessPattern: 'direct' },
      ];

      const issues = analyzeTypeMismatch({
        definedVariables,
        usedVariables,
        config: createConfig({
          variables: {
            DATABASE_URL: { pattern: /^postgres:\/\// },
          },
        }),
      });

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('invalid-value');
    });

    it('should validate enum from config', () => {
      const definedVariables: EnvVariable[] = [
        { name: 'NODE_ENV', value: 'invalid', line: 1, file: '.env' },
      ];

      // Need at least one usage to trigger the check
      const usedVariables: EnvUsage[] = [
        { name: 'NODE_ENV', file: 'test.ts', line: 1, column: 0, accessPattern: 'direct' },
      ];

      const issues = analyzeTypeMismatch({
        definedVariables,
        usedVariables,
        config: createConfig({
          variables: {
            NODE_ENV: { enum: ['development', 'production', 'test'] },
          },
        }),
      });

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('invalid-value');
      expect(issues[0].message).toContain('development');
    });
  });

  describe('analyzeSyncDrift', () => {
    it('should detect variables missing from template', () => {
      const envVariables: EnvVariable[] = [
        { name: 'VAR1', value: 'value', line: 1, file: '.env' },
        { name: 'VAR2', value: 'value', line: 2, file: '.env' },
      ];

      const templateVariables: EnvVariable[] = [
        { name: 'VAR1', value: '', line: 1, file: '.env.example' },
      ];

      const result = analyzeSyncDrift({
        envVariables,
        templateVariables,
        templateFile: '.env.example',
      });

      expect(result.missingFromTemplate).toContain('VAR2');
      expect(result.inSync).toBe(false);
    });

    it('should detect variables missing from env', () => {
      const envVariables: EnvVariable[] = [
        { name: 'VAR1', value: 'value', line: 1, file: '.env' },
      ];

      const templateVariables: EnvVariable[] = [
        { name: 'VAR1', value: '', line: 1, file: '.env.example' },
        { name: 'VAR2', value: '', line: 2, file: '.env.example' },
      ];

      const result = analyzeSyncDrift({
        envVariables,
        templateVariables,
        templateFile: '.env.example',
      });

      expect(result.missingFromEnv).toContain('VAR2');
      expect(result.inSync).toBe(false);
    });

    it('should report in sync when matching', () => {
      const envVariables: EnvVariable[] = [
        { name: 'VAR1', value: 'value', line: 1, file: '.env' },
      ];

      const templateVariables: EnvVariable[] = [
        { name: 'VAR1', value: '', line: 1, file: '.env.example' },
      ];

      const result = analyzeSyncDrift({
        envVariables,
        templateVariables,
        templateFile: '.env.example',
      });

      expect(result.inSync).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('analyzeSecrets', () => {
    it('should detect secrets by variable name', () => {
      const variables: EnvVariable[] = [
        { name: 'API_KEY', value: 'real_api_key_value', line: 1, file: '.env' },
        { name: 'DATABASE_PASSWORD', value: 'mypassword', line: 2, file: '.env' },
      ];

      const issues = analyzeSecrets({ variables });

      expect(issues.length).toBeGreaterThanOrEqual(2);
      expect(issues.every((i) => i.type === 'secret-exposed')).toBe(true);
    });

    it('should detect secrets by value pattern', () => {
      const variables: EnvVariable[] = [
        { name: 'STRIPE', value: 'sk_test_FAKE_TEST_KEY_DO_NOT_USE_1234567890', line: 1, file: '.env' },
        { name: 'GITHUB', value: 'ghp_abcdefghijklmnopqrstuvwxyz1234567890', line: 2, file: '.env' },
      ];

      const issues = analyzeSecrets({ variables });

      expect(issues.length).toBeGreaterThanOrEqual(1);
    });

    it('should skip placeholder values', () => {
      const variables: EnvVariable[] = [
        { name: 'API_KEY', value: 'your_api_key', line: 1, file: '.env' },
        { name: 'SECRET', value: 'placeholder', line: 2, file: '.env' },
        { name: 'TOKEN', value: 'changeme', line: 3, file: '.env' },
      ];

      const issues = analyzeSecrets({ variables });

      expect(issues).toHaveLength(0);
    });

    it('should skip empty secret values', () => {
      const variables: EnvVariable[] = [
        { name: 'API_KEY', value: '', line: 1, file: '.env', isSecret: true },
      ];

      const issues = analyzeSecrets({ variables });

      expect(issues).toHaveLength(0);
    });
  });
});

