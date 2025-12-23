import type { AnalysisResult, Issue, IssueType, SARIFOutput, SARIFResult, SARIFRule, SARIFRun } from '../types/index.js';

const TOOL_NAME = 'env-doctor';
const TOOL_VERSION = '1.0.0';
const TOOL_INFO_URI = 'https://github.com/yourusername/env-doctor';

/**
 * SARIF rule definitions for each issue type
 */
const RULE_DEFINITIONS: Record<IssueType, { name: string; shortDescription: string; fullDescription: string }> = {
  missing: {
    name: 'MissingEnvVariable',
    shortDescription: 'Environment variable is used but not defined',
    fullDescription:
      'A environment variable is referenced in the code but not defined in any .env file. This could cause runtime errors or unexpected behavior.',
  },
  unused: {
    name: 'UnusedEnvVariable',
    shortDescription: 'Environment variable is defined but never used',
    fullDescription:
      'An environment variable is defined in a .env file but never referenced in the codebase. This could indicate dead configuration or a typo.',
  },
  'type-mismatch': {
    name: 'TypeMismatch',
    shortDescription: 'Environment variable value type does not match usage',
    fullDescription:
      'The value of an environment variable does not match how it is used in the code. For example, using parseInt() on a non-numeric value.',
  },
  'sync-drift': {
    name: 'SyncDrift',
    shortDescription: 'Environment files are out of sync',
    fullDescription:
      'The .env file and .env.example (or other template) have different variables defined. This can cause issues when setting up new environments.',
  },
  'secret-exposed': {
    name: 'SecretExposed',
    shortDescription: 'Potential secret value detected',
    fullDescription:
      'A variable that appears to contain a secret (API key, password, token) has a value that looks like a real credential. Secrets should not be committed to version control.',
  },
  'invalid-value': {
    name: 'InvalidValue',
    shortDescription: 'Environment variable has an invalid value',
    fullDescription:
      'The value of an environment variable does not match the expected format or constraints defined in the configuration.',
  },
  'dynamic-access': {
    name: 'DynamicAccess',
    shortDescription: 'Dynamic environment variable access detected',
    fullDescription:
      'Environment variables are being accessed dynamically, which makes it difficult to statically analyze which variables are used.',
  },
};

/**
 * Convert severity to SARIF level
 */
function severityToLevel(severity: string): 'error' | 'warning' | 'note' {
  switch (severity) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    default:
      return 'note';
  }
}

/**
 * Get the default level for a rule
 */
function getDefaultLevel(type: IssueType): 'error' | 'warning' | 'note' {
  switch (type) {
    case 'missing':
    case 'secret-exposed':
    case 'invalid-value':
      return 'error';
    case 'unused':
    case 'type-mismatch':
    case 'sync-drift':
      return 'warning';
    case 'dynamic-access':
      return 'note';
    default:
      return 'warning';
  }
}

/**
 * Create SARIF rules from issue types
 */
function createRules(issues: Issue[]): SARIFRule[] {
  const usedTypes = new Set(issues.map((i) => i.type));
  const rules: SARIFRule[] = [];

  for (const type of usedTypes) {
    const def = RULE_DEFINITIONS[type];
    if (def) {
      rules.push({
        id: `env-doctor/${type}`,
        name: def.name,
        shortDescription: { text: def.shortDescription },
        fullDescription: { text: def.fullDescription },
        defaultConfiguration: { level: getDefaultLevel(type) },
        helpUri: `${TOOL_INFO_URI}#${type}`,
      });
    }
  }

  return rules;
}

/**
 * Convert an issue to a SARIF result
 */
function issueToResult(issue: Issue): SARIFResult {
  const location = issue.location || { file: '.env', line: 1 };

  return {
    ruleId: `env-doctor/${issue.type}`,
    level: severityToLevel(issue.severity),
    message: { text: issue.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: location.file },
          region: {
            startLine: location.line,
            startColumn: location.column,
          },
        },
      },
    ],
  };
}

/**
 * Convert analysis results to SARIF format
 */
export function toSARIF(result: AnalysisResult): SARIFOutput {
  const run: SARIFRun = {
    tool: {
      driver: {
        name: TOOL_NAME,
        version: TOOL_VERSION,
        informationUri: TOOL_INFO_URI,
        rules: createRules(result.issues),
      },
    },
    results: result.issues.map(issueToResult),
  };

  return {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [run],
  };
}

/**
 * Report analysis results as SARIF JSON string
 */
export function reportToSARIF(result: AnalysisResult): string {
  const sarif = toSARIF(result);
  return JSON.stringify(sarif, null, 2);
}

/**
 * Create a minimal SARIF report for specific issues
 */
export function createMinimalSARIF(issues: Issue[]): SARIFOutput {
  const run: SARIFRun = {
    tool: {
      driver: {
        name: TOOL_NAME,
        version: TOOL_VERSION,
        informationUri: TOOL_INFO_URI,
        rules: createRules(issues),
      },
    },
    results: issues.map(issueToResult),
  };

  return {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [run],
  };
}

/**
 * Merge multiple SARIF reports
 */
export function mergeSARIF(reports: SARIFOutput[]): SARIFOutput {
  if (reports.length === 0) {
    throw new Error('No reports to merge');
  }

  // Combine all runs
  const allRuns: SARIFRun[] = [];

  for (const report of reports) {
    allRuns.push(...report.runs);
  }

  return {
    $schema: reports[0].$schema,
    version: reports[0].version,
    runs: allRuns,
  };
}

/**
 * Validate SARIF structure (basic validation)
 */
export function validateSARIF(sarif: unknown): sarif is SARIFOutput {
  if (!sarif || typeof sarif !== 'object') return false;

  const s = sarif as Record<string, unknown>;

  if (typeof s.$schema !== 'string') return false;
  if (typeof s.version !== 'string') return false;
  if (!Array.isArray(s.runs)) return false;

  return true;
}

