---
sidebar_position: 11
---

# API Reference

Use env-doctor programmatically in your Node.js applications.

## Installation

```bash
npm install env-doctor
```

## Quick Start

```typescript
import { analyze, loadConfig } from 'env-doctor';

const { config } = await loadConfig();
const result = await analyze({ config });

console.log(`Found ${result.issues.length} issues`);
```

---

## Core Functions

### `analyze(options)`

Main analysis function that orchestrates all scanners and analyzers.

```typescript
import { analyze } from 'env-doctor';

const result = await analyze({
  config: {
    envFiles: ['.env'],
    include: ['src/**/*.ts'],
    framework: 'nextjs'
  },
  verbose: true
});
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.config` | `EnvDoctorConfig` | Configuration object |
| `options.verbose` | `boolean` | Enable debug logging |

#### Returns

`Promise<AnalysisResult>`

```typescript
interface AnalysisResult {
  issues: Issue[];
  definedVariables: EnvVariable[];
  usedVariables: EnvUsage[];
  templateVariables?: EnvVariable[];
  framework: string;
  stats: ScanStats;
}
```

---

### `loadConfig(configPath?, rootDir?)`

Load configuration from file or use defaults.

```typescript
import { loadConfig } from 'env-doctor';

// Load from default locations
const { config, configPath } = await loadConfig();

// Load from specific file
const { config } = await loadConfig('./custom-config.js');

// Load with custom root directory
const { config } = await loadConfig(undefined, '/path/to/project');
```

#### Returns

```typescript
{
  config: EnvDoctorConfig;
  configPath?: string;  // Path if config was found
}
```

---

## Scanners

### `parseEnvFile(filePath, rootDir?)`

Parse a single `.env` file.

```typescript
import { parseEnvFile } from 'env-doctor';

const result = await parseEnvFile('.env', process.cwd());

for (const variable of result.variables) {
  console.log(`${variable.name}=${variable.isSecret ? '[REDACTED]' : variable.value}`);
}
```

#### Returns

```typescript
interface ParseResult {
  variables: EnvVariable[];
  errors: Array<{ line: number; message: string }>;
}

interface EnvVariable {
  name: string;
  value: string;
  line: number;
  file: string;
  isSecret?: boolean;
}
```

---

### `scanCode(options)`

Scan source files for `process.env` usage.

```typescript
import { scanCode } from 'env-doctor';

const result = await scanCode({
  rootDir: process.cwd(),
  include: ['src/**/*.ts'],
  exclude: ['node_modules'],
  framework: 'nextjs'
});

console.log(`Found ${result.usages.length} env usages`);
```

#### Returns

```typescript
interface CodeScanResult {
  usages: EnvUsage[];
  errors: Array<{ file: string; message: string }>;
  filesScanned: number;
}

interface EnvUsage {
  name: string;
  file: string;
  line: number;
  column: number;
  accessPattern: 'direct' | 'bracket' | 'destructure' | 'dynamic';
  inferredType?: 'string' | 'number' | 'boolean' | 'json' | 'array';
  isClientSide?: boolean;
}
```

---

### `scanGitHistory(options)`

Scan git history for leaked secrets.

```typescript
import { scanGitHistory } from 'env-doctor';

const { results, error } = await scanGitHistory({
  rootDir: process.cwd(),
  depth: 100
});

if (results.length > 0) {
  console.warn('Found secrets in git history!');
}
```

---

## Analyzers

### `analyzeMissing(options)`

Find variables used but not defined.

```typescript
import { analyzeMissing } from 'env-doctor';

const issues = analyzeMissing({
  definedVariables: envVars,
  usedVariables: codeUsages,
  config
});
```

### `analyzeUnused(options)`

Find variables defined but not used.

```typescript
import { analyzeUnused } from 'env-doctor';

const issues = analyzeUnused({
  definedVariables: envVars,
  usedVariables: codeUsages,
  config,
  framework: 'nextjs'
});
```

### `analyzeTypeMismatch(options)`

Find type mismatches between usage and values.

```typescript
import { analyzeTypeMismatch } from 'env-doctor';

const issues = analyzeTypeMismatch({
  definedVariables: envVars,
  usedVariables: codeUsages,
  config
});
```

### `analyzeSecrets(options)`

Detect exposed secrets.

```typescript
import { analyzeSecrets } from 'env-doctor';

const issues = analyzeSecrets({
  variables: envVars,
  customPatterns: [/^MY_SECRET/],
  ignorePatterns: ['TEST_*']
});
```

### `analyzeSyncDrift(options)`

Check sync between env and template files.

```typescript
import { analyzeSyncDrift } from 'env-doctor';

const result = analyzeSyncDrift({
  envVariables: envVars,
  templateVariables: templateVars,
  templateFile: '.env.example'
});

console.log(`In sync: ${result.inSync}`);
```

---

## Reporters

### `reportToConsole(result, options?)`

Output results to console with formatting.

```typescript
import { analyze, reportToConsole } from 'env-doctor';

const result = await analyze({ config });
reportToConsole(result, { verbose: true });
```

### `reportToJSON(result)`

Get results as formatted JSON string.

```typescript
import { analyze, reportToJSON } from 'env-doctor';

const result = await analyze({ config });
const json = reportToJSON(result);
fs.writeFileSync('report.json', json);
```

### `reportToSARIF(result)`

Get results in SARIF format for GitHub.

```typescript
import { analyze, reportToSARIF } from 'env-doctor';

const result = await analyze({ config });
const sarif = reportToSARIF(result);
fs.writeFileSync('results.sarif', sarif);
```

---

## Framework Detection

### `detectFramework(rootDir)`

Auto-detect the framework used.

```typescript
import { detectFramework } from 'env-doctor';

const framework = await detectFramework(process.cwd());
// Returns: 'nextjs' | 'vite' | 'cra' | 'node'
```

### `getFrameworkInfo(framework)`

Get detailed framework information.

```typescript
import { getFrameworkInfo } from 'env-doctor';

const info = getFrameworkInfo('nextjs');
// {
//   name: 'nextjs',
//   displayName: 'Next.js',
//   clientPrefix: ['NEXT_PUBLIC_'],
//   ...
// }
```

---

## Types

### `EnvDoctorConfig`

```typescript
interface EnvDoctorConfig {
  envFiles: string[];
  templateFile?: string;
  include: string[];
  exclude: string[];
  framework: 'auto' | 'nextjs' | 'vite' | 'cra' | 'node';
  variables: Record<string, VariableRule>;
  ignore: string[];
  strict?: boolean;
  secretPatterns?: RegExp[];
  root?: string;
}
```

### `VariableRule`

```typescript
interface VariableRule {
  required?: boolean;
  secret?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'json' | 'url' | 'email';
  pattern?: RegExp;
  default?: string | number | boolean;
  enum?: string[];
  description?: string;
}
```

### `Issue`

```typescript
interface Issue {
  type: IssueType;
  severity: 'error' | 'warning' | 'info';
  variable: string;
  message: string;
  location?: SourceLocation;
  fix?: string;
  context?: Record<string, unknown>;
}

type IssueType = 
  | 'missing'
  | 'unused'
  | 'type-mismatch'
  | 'sync-drift'
  | 'secret-exposed'
  | 'invalid-value'
  | 'dynamic-access';
```

