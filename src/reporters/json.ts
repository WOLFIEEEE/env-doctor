import type { AnalysisResult, Issue } from '../types/index.js';

export interface JSONReport {
  /** Tool version */
  version: string;
  /** Timestamp of the report */
  timestamp: string;
  /** Detected framework */
  framework: string;
  /** Summary statistics */
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    info: number;
    filesScanned: number;
    envFilesParsed: number;
    duration: number;
  };
  /** All issues */
  issues: JSONIssue[];
  /** Environment variables defined */
  variables: {
    defined: Array<{
      name: string;
      file: string;
      line: number;
      hasValue: boolean;
      isSecret: boolean;
    }>;
    used: Array<{
      name: string;
      file: string;
      line: number;
      accessPattern: string;
      isClientSide: boolean;
    }>;
  };
}

export interface JSONIssue {
  type: string;
  severity: string;
  variable: string;
  message: string;
  location?: {
    file: string;
    line: number;
    column?: number;
  };
  fix?: string;
  context?: Record<string, unknown>;
}

/**
 * Convert analysis result to JSON report format
 */
export function toJSONReport(result: AnalysisResult): JSONReport {
  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    framework: result.framework,
    summary: {
      totalIssues: result.issues.length,
      errors: result.stats.errorCount,
      warnings: result.stats.warningCount,
      info: result.stats.infoCount,
      filesScanned: result.stats.filesScanned,
      envFilesParsed: result.stats.envFilesParsed,
      duration: result.stats.duration,
    },
    issues: result.issues.map(issueToJSON),
    variables: {
      defined: result.definedVariables.map((v) => ({
        name: v.name,
        file: v.file,
        line: v.line,
        hasValue: Boolean(v.value),
        isSecret: v.isSecret ?? false,
      })),
      used: result.usedVariables.map((u) => ({
        name: u.name,
        file: u.file,
        line: u.line,
        accessPattern: u.accessPattern,
        isClientSide: u.isClientSide ?? false,
      })),
    },
  };
}

/**
 * Convert a single issue to JSON format
 */
function issueToJSON(issue: Issue): JSONIssue {
  return {
    type: issue.type,
    severity: issue.severity,
    variable: issue.variable,
    message: issue.message,
    location: issue.location,
    fix: issue.fix,
    context: issue.context,
  };
}

/**
 * Report analysis results as JSON
 */
export function reportToJSON(result: AnalysisResult): string {
  const report = toJSONReport(result);
  return JSON.stringify(report, null, 2);
}

/**
 * Report analysis results as JSON (compact, for piping)
 */
export function reportToJSONCompact(result: AnalysisResult): string {
  const report = toJSONReport(result);
  return JSON.stringify(report);
}

/**
 * Create a minimal issues-only JSON report
 */
export function reportIssuesOnly(issues: Issue[]): string {
  return JSON.stringify(
    {
      count: issues.length,
      issues: issues.map(issueToJSON),
    },
    null,
    2
  );
}

/**
 * Parse JSON report from string
 */
export function parseJSONReport(json: string): JSONReport | null {
  try {
    return JSON.parse(json) as JSONReport;
  } catch {
    return null;
  }
}

/**
 * Merge multiple JSON reports
 */
export function mergeJSONReports(reports: JSONReport[]): JSONReport {
  if (reports.length === 0) {
    throw new Error('No reports to merge');
  }

  const merged: JSONReport = {
    version: reports[0].version,
    timestamp: new Date().toISOString(),
    framework: reports[0].framework,
    summary: {
      totalIssues: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      filesScanned: 0,
      envFilesParsed: 0,
      duration: 0,
    },
    issues: [],
    variables: {
      defined: [],
      used: [],
    },
  };

  const seenIssues = new Set<string>();
  const seenDefinedVars = new Set<string>();
  const seenUsedVars = new Set<string>();

  for (const report of reports) {
    // Merge summaries
    merged.summary.totalIssues += report.summary.totalIssues;
    merged.summary.errors += report.summary.errors;
    merged.summary.warnings += report.summary.warnings;
    merged.summary.info += report.summary.info;
    merged.summary.filesScanned += report.summary.filesScanned;
    merged.summary.envFilesParsed += report.summary.envFilesParsed;
    merged.summary.duration = Math.max(merged.summary.duration, report.summary.duration);

    // Merge issues (deduplicate)
    for (const issue of report.issues) {
      const key = `${issue.type}:${issue.variable}:${issue.location?.file}:${issue.location?.line}`;
      if (!seenIssues.has(key)) {
        seenIssues.add(key);
        merged.issues.push(issue);
      }
    }

    // Merge variables (deduplicate)
    for (const v of report.variables.defined) {
      const key = `${v.name}:${v.file}`;
      if (!seenDefinedVars.has(key)) {
        seenDefinedVars.add(key);
        merged.variables.defined.push(v);
      }
    }

    for (const v of report.variables.used) {
      const key = `${v.name}:${v.file}:${v.line}`;
      if (!seenUsedVars.has(key)) {
        seenUsedVars.add(key);
        merged.variables.used.push(v);
      }
    }
  }

  return merged;
}

