import { describe, it, expect, beforeEach } from 'vitest';
import { resolve } from 'node:path';
import { writeFile, mkdir, rm } from 'node:fs/promises';

// We'll test the parsing logic directly
describe('env-parser', () => {
  const testDir = resolve(__dirname, '../temp');
  const testEnvFile = resolve(testDir, 'test.env');

  beforeEach(async () => {
    // Create temp directory
    await mkdir(testDir, { recursive: true });
  });

  describe('parseEnvFile', () => {
    it('should parse basic key-value pairs', async () => {
      await writeFile(
        testEnvFile,
        `
DATABASE_URL=postgres://localhost:5432/db
PORT=3000
DEBUG=true
`.trim()
      );

      const { parseEnvFile } = await import('../../src/scanner/env-parser.js');
      const result = await parseEnvFile('test.env', testDir);

      expect(result.variables).toHaveLength(3);
      expect(result.variables[0].name).toBe('DATABASE_URL');
      expect(result.variables[0].value).toBe('postgres://localhost:5432/db');
      expect(result.variables[1].name).toBe('PORT');
      expect(result.variables[1].value).toBe('3000');
      expect(result.variables[2].name).toBe('DEBUG');
      expect(result.variables[2].value).toBe('true');
    });

    it('should handle quoted values', async () => {
      await writeFile(
        testEnvFile,
        `
SINGLE_QUOTED='hello world'
DOUBLE_QUOTED="hello world"
WITH_SPACES="  spaces  "
`.trim()
      );

      const { parseEnvFile } = await import('../../src/scanner/env-parser.js');
      const result = await parseEnvFile('test.env', testDir);

      expect(result.variables[0].value).toBe('hello world');
      expect(result.variables[1].value).toBe('hello world');
      expect(result.variables[2].value).toBe('  spaces  ');
    });

    it('should handle escape sequences in double quotes', async () => {
      await writeFile(testEnvFile, `ESCAPED="line1\\nline2"`);

      const { parseEnvFile } = await import('../../src/scanner/env-parser.js');
      const result = await parseEnvFile('test.env', testDir);

      expect(result.variables[0].value).toBe('line1\nline2');
    });

    it('should skip comments and empty lines', async () => {
      await writeFile(
        testEnvFile,
        `
# This is a comment
KEY1=value1

# Another comment
KEY2=value2
`.trim()
      );

      const { parseEnvFile } = await import('../../src/scanner/env-parser.js');
      const result = await parseEnvFile('test.env', testDir);

      expect(result.variables).toHaveLength(2);
      expect(result.variables[0].name).toBe('KEY1');
      expect(result.variables[1].name).toBe('KEY2');
    });

    it('should handle inline comments for unquoted values', async () => {
      await writeFile(testEnvFile, `KEY=value # this is a comment`);

      const { parseEnvFile } = await import('../../src/scanner/env-parser.js');
      const result = await parseEnvFile('test.env', testDir);

      expect(result.variables[0].value).toBe('value');
    });

    it('should handle export prefix', async () => {
      await writeFile(testEnvFile, `export KEY=value`);

      const { parseEnvFile } = await import('../../src/scanner/env-parser.js');
      const result = await parseEnvFile('test.env', testDir);

      expect(result.variables[0].name).toBe('KEY');
      expect(result.variables[0].value).toBe('value');
    });

    it('should detect secret variables by name', async () => {
      await writeFile(
        testEnvFile,
        `
API_KEY=secret123
DATABASE_PASSWORD=pass123
NORMAL_VAR=hello
`.trim()
      );

      const { parseEnvFile } = await import('../../src/scanner/env-parser.js');
      const result = await parseEnvFile('test.env', testDir);

      expect(result.variables[0].isSecret).toBe(true);
      expect(result.variables[1].isSecret).toBe(true);
      expect(result.variables[2].isSecret).toBe(false);
    });

    it('should detect secrets by value pattern', async () => {
      await writeFile(
        testEnvFile,
        `
STRIPE_KEY=sk_test_FAKE_TEST_KEY_DO_NOT_USE_1234567890
AWS_KEY=AKIAIOSFODNN7EXAMPLE
`.trim()
      );

      const { parseEnvFile } = await import('../../src/scanner/env-parser.js');
      const result = await parseEnvFile('test.env', testDir);

      expect(result.variables[0].isSecret).toBe(true);
      expect(result.variables[1].isSecret).toBe(true);
    });

    it('should track line numbers', async () => {
      await writeFile(
        testEnvFile,
        `
# Comment
KEY1=value1

KEY2=value2
KEY3=value3
`.trim()
      );

      const { parseEnvFile } = await import('../../src/scanner/env-parser.js');
      const result = await parseEnvFile('test.env', testDir);

      expect(result.variables[0].line).toBe(2);
      expect(result.variables[1].line).toBe(4);
      expect(result.variables[2].line).toBe(5);
    });

    it('should return errors for malformed lines', async () => {
      await writeFile(
        testEnvFile,
        `
VALID=value
INVALID_NO_EQUALS
123_INVALID_NAME=value
`.trim()
      );

      const { parseEnvFile } = await import('../../src/scanner/env-parser.js');
      const result = await parseEnvFile('test.env', testDir);

      expect(result.variables).toHaveLength(1);
      expect(result.errors).toHaveLength(2);
    });

    it('should return error for non-existent file', async () => {
      const { parseEnvFile } = await import('../../src/scanner/env-parser.js');
      const result = await parseEnvFile('nonexistent.env', testDir);

      expect(result.variables).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('not found');
    });
  });

  describe('inferValueType', () => {
    it('should infer number type', async () => {
      const { inferValueType } = await import('../../src/scanner/env-parser.js');

      expect(inferValueType('123')).toBe('number');
      expect(inferValueType('3.14')).toBe('number');
      expect(inferValueType('-42')).toBe('number');
    });

    it('should infer boolean type', async () => {
      const { inferValueType } = await import('../../src/scanner/env-parser.js');

      expect(inferValueType('true')).toBe('boolean');
      expect(inferValueType('false')).toBe('boolean');
    });

    it('should infer json type', async () => {
      const { inferValueType } = await import('../../src/scanner/env-parser.js');

      expect(inferValueType('{"key":"value"}')).toBe('json');
      expect(inferValueType('[1,2,3]')).toBe('json');
    });

    it('should infer array type', async () => {
      const { inferValueType } = await import('../../src/scanner/env-parser.js');

      expect(inferValueType('a,b,c')).toBe('array');
    });

    it('should default to string', async () => {
      const { inferValueType } = await import('../../src/scanner/env-parser.js');

      expect(inferValueType('hello world')).toBe('string');
      expect(inferValueType('https://example.com')).toBe('string');
    });
  });

  // Cleanup after tests
  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });
});

