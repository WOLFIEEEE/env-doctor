import { describe, it, expect } from 'vitest';
import type { AnalysisResult, Issue } from '../../src/types/index.js';
import { toJSONReport, parseJSONReport, mergeJSONReports } from '../../src/reporters/json.js';
import { toSARIF, validateSARIF, mergeSARIF } from '../../src/reporters/sarif.js';

describe('reporters', () => {
  const createMockResult = (issues: Issue[] = []): AnalysisResult => ({
    issues,
    definedVariables: [
      { name: 'VAR1', value: 'value1', line: 1, file: '.env' },
    ],
    usedVariables: [
      { name: 'VAR1', file: 'test.ts', line: 5, column: 10, accessPattern: 'direct' },
    ],
    framework: 'node',
    stats: {
      filesScanned: 10,
      envFilesParsed: 1,
      duration: 100,
      errorCount: issues.filter((i) => i.severity === 'error').length,
      warningCount: issues.filter((i) => i.severity === 'warning').length,
      infoCount: issues.filter((i) => i.severity === 'info').length,
    },
  });

  describe('JSON reporter', () => {
    it('should generate valid JSON report', () => {
      const result = createMockResult([
        {
          type: 'missing',
          severity: 'error',
          variable: 'MISSING_VAR',
          message: 'Variable is missing',
          location: { file: 'test.ts', line: 10 },
        },
      ]);

      const report = toJSONReport(result);

      expect(report.version).toBe('1.0.0');
      expect(report.framework).toBe('node');
      expect(report.summary.totalIssues).toBe(1);
      expect(report.summary.errors).toBe(1);
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0].variable).toBe('MISSING_VAR');
    });

    it('should parse JSON report correctly', () => {
      const result = createMockResult();
      const json = JSON.stringify(toJSONReport(result));
      const parsed = parseJSONReport(json);

      expect(parsed).not.toBeNull();
      expect(parsed?.version).toBe('1.0.0');
    });

    it('should merge multiple reports', () => {
      const report1 = toJSONReport(
        createMockResult([
          {
            type: 'missing',
            severity: 'error',
            variable: 'VAR1',
            message: 'Missing',
          },
        ])
      );

      const report2 = toJSONReport(
        createMockResult([
          {
            type: 'unused',
            severity: 'warning',
            variable: 'VAR2',
            message: 'Unused',
          },
        ])
      );

      const merged = mergeJSONReports([report1, report2]);

      expect(merged.summary.totalIssues).toBe(2);
      expect(merged.issues).toHaveLength(2);
    });
  });

  describe('SARIF reporter', () => {
    it('should generate valid SARIF output', () => {
      const result = createMockResult([
        {
          type: 'missing',
          severity: 'error',
          variable: 'MISSING_VAR',
          message: 'Variable is missing',
          location: { file: 'test.ts', line: 10 },
        },
      ]);

      const sarif = toSARIF(result);

      expect(sarif.$schema).toContain('sarif');
      expect(sarif.version).toBe('2.1.0');
      expect(sarif.runs).toHaveLength(1);
      expect(sarif.runs[0].tool.driver.name).toBe('env-doctor');
      expect(sarif.runs[0].results).toHaveLength(1);
    });

    it('should validate SARIF structure', () => {
      const result = createMockResult();
      const sarif = toSARIF(result);

      expect(validateSARIF(sarif)).toBe(true);
      expect(validateSARIF({})).toBe(false);
      expect(validateSARIF(null)).toBe(false);
    });

    it('should map severity to SARIF level', () => {
      const result = createMockResult([
        { type: 'missing', severity: 'error', variable: 'V1', message: 'M1' },
        { type: 'unused', severity: 'warning', variable: 'V2', message: 'M2' },
        { type: 'sync-drift', severity: 'info', variable: 'V3', message: 'M3' },
      ]);

      const sarif = toSARIF(result);

      expect(sarif.runs[0].results[0].level).toBe('error');
      expect(sarif.runs[0].results[1].level).toBe('warning');
      expect(sarif.runs[0].results[2].level).toBe('note');
    });

    it('should include rule definitions', () => {
      const result = createMockResult([
        { type: 'missing', severity: 'error', variable: 'V1', message: 'M1' },
        { type: 'secret-exposed', severity: 'error', variable: 'V2', message: 'M2' },
      ]);

      const sarif = toSARIF(result);

      expect(sarif.runs[0].tool.driver.rules).toHaveLength(2);
      expect(sarif.runs[0].tool.driver.rules[0].id).toBe('env-doctor/missing');
      expect(sarif.runs[0].tool.driver.rules[1].id).toBe('env-doctor/secret-exposed');
    });

    it('should merge multiple SARIF reports', () => {
      const sarif1 = toSARIF(
        createMockResult([
          { type: 'missing', severity: 'error', variable: 'V1', message: 'M1' },
        ])
      );

      const sarif2 = toSARIF(
        createMockResult([
          { type: 'unused', severity: 'warning', variable: 'V2', message: 'M2' },
        ])
      );

      const merged = mergeSARIF([sarif1, sarif2]);

      expect(merged.runs).toHaveLength(2);
    });
  });
});

