import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { detectFramework, getFrameworkInfo, isClientAccessible } from '../../src/frameworks/index.js';

describe('framework-detection', () => {
  const testDir = resolve(__dirname, '../temp-framework');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('detectFramework', () => {
    it('should detect Next.js by config file', async () => {
      await writeFile(resolve(testDir, 'next.config.js'), 'module.exports = {}');

      const framework = await detectFramework(testDir);
      expect(framework).toBe('nextjs');
    });

    it('should detect Next.js by package.json', async () => {
      await writeFile(
        resolve(testDir, 'package.json'),
        JSON.stringify({ dependencies: { next: '^14.0.0' } })
      );

      const framework = await detectFramework(testDir);
      expect(framework).toBe('nextjs');
    });

    it('should detect Vite by config file', async () => {
      await writeFile(resolve(testDir, 'vite.config.ts'), 'export default {}');

      const framework = await detectFramework(testDir);
      expect(framework).toBe('vite');
    });

    it('should detect Vite by package.json', async () => {
      await writeFile(
        resolve(testDir, 'package.json'),
        JSON.stringify({ devDependencies: { vite: '^5.0.0' } })
      );

      const framework = await detectFramework(testDir);
      expect(framework).toBe('vite');
    });

    it('should detect Create React App by package.json', async () => {
      await writeFile(
        resolve(testDir, 'package.json'),
        JSON.stringify({ dependencies: { 'react-scripts': '^5.0.0' } })
      );

      const framework = await detectFramework(testDir);
      expect(framework).toBe('cra');
    });

    it('should default to Node.js when no framework detected', async () => {
      await writeFile(
        resolve(testDir, 'package.json'),
        JSON.stringify({ name: 'plain-node-project' })
      );

      const framework = await detectFramework(testDir);
      expect(framework).toBe('node');
    });
  });

  describe('getFrameworkInfo', () => {
    it('should return correct info for Next.js', () => {
      const info = getFrameworkInfo('nextjs');

      expect(info.name).toBe('nextjs');
      expect(info.displayName).toBe('Next.js');
      expect(info.clientPrefix).toContain('NEXT_PUBLIC_');
    });

    it('should return correct info for Vite', () => {
      const info = getFrameworkInfo('vite');

      expect(info.name).toBe('vite');
      expect(info.displayName).toBe('Vite');
      expect(info.clientPrefix).toContain('VITE_');
    });

    it('should return correct info for CRA', () => {
      const info = getFrameworkInfo('cra');

      expect(info.name).toBe('cra');
      expect(info.displayName).toBe('Create React App');
      expect(info.clientPrefix).toContain('REACT_APP_');
    });

    it('should return node info for auto', () => {
      const info = getFrameworkInfo('auto');

      expect(info.name).toBe('node');
    });
  });

  describe('isClientAccessible', () => {
    it('should return true for NEXT_PUBLIC_ vars in Next.js', () => {
      expect(isClientAccessible('NEXT_PUBLIC_API_URL', 'nextjs')).toBe(true);
    });

    it('should return false for non-public vars in Next.js', () => {
      expect(isClientAccessible('DATABASE_URL', 'nextjs')).toBe(false);
    });

    it('should return true for VITE_ vars in Vite', () => {
      expect(isClientAccessible('VITE_API_URL', 'vite')).toBe(true);
    });

    it('should return true for REACT_APP_ vars in CRA', () => {
      expect(isClientAccessible('REACT_APP_API_URL', 'cra')).toBe(true);
    });

    it('should return false for all vars in Node.js', () => {
      expect(isClientAccessible('ANY_VAR', 'node')).toBe(false);
    });
  });
});

