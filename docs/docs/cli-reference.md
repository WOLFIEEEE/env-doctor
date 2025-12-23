---
sidebar_position: 10
---

# CLI Reference

Complete reference for all env-doctor commands and options.

## Default Command

Scan the current directory for environment variable issues.

```bash
env-doctor [directory] [options]
```

### Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `directory` | Directory to scan | Current directory |

### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--config <path>` | `-c` | Path to config file |
| `--env <environment>` | `-e` | Target environment (development, production, test) |
| `--format <format>` | `-f` | Output format: `console`, `json`, `sarif` |
| `--ci` | | CI mode - exit code 1 on errors |
| `--verbose` | `-v` | Verbose output with debug info |
| `--strict` | | Treat warnings as errors |
| `--version` | `-V` | Output version number |
| `--help` | `-h` | Display help |

### Examples

```bash
# Scan current directory
env-doctor

# Scan specific directory
env-doctor ./packages/api

# Use custom config
env-doctor -c ./custom-config.js

# Target production environment
env-doctor --env production

# Output as JSON
env-doctor --format json > report.json

# CI mode with SARIF output
env-doctor --ci --format sarif > results.sarif

# Verbose mode for debugging
env-doctor --verbose

# Strict mode (warnings = errors)
env-doctor --strict
```

---

## `init`

Initialize env-doctor in your project.

```bash
env-doctor init [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--config-only` | Only create config file |
| `--example-only` | Only create .env.example |
| `--force` | `-f` | Overwrite existing files |

### Examples

```bash
# Initialize both config and .env.example
env-doctor init

# Create only config file
env-doctor init --config-only

# Create only .env.example
env-doctor init --example-only

# Overwrite existing files
env-doctor init --force
```

### Output Files

**env-doctor.config.js**
```javascript
module.exports = {
  envFiles: ['.env', '.env.local'],
  templateFile: '.env.example',
  include: ['src/**/*.{ts,js,tsx,jsx}'],
  exclude: ['node_modules', 'dist'],
  framework: 'auto',
  variables: {},
  ignore: [],
};
```

**.env.example**
```bash
# Environment Variables Template
# Copy this file to .env and fill in the values

DATABASE_URL=postgres://user:pass@localhost:5432/db
API_KEY=
NODE_ENV=development
```

---

## `fix`

Interactively fix environment issues.

```bash
env-doctor fix [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--config <path>` | `-c` | Path to config file |
| `--dry-run` | Show what would be fixed without changes |

### Examples

```bash
# Interactive fix mode
env-doctor fix

# Dry run - preview changes
env-doctor fix --dry-run
```

### Interactive Prompts

For each issue, you can choose:
1. **Add to .env** - Add the variable with a value
2. **Add to ignore list** - Skip this variable in future scans
3. **Skip** - Ignore for now

---

## `scan-history`

Scan git history for leaked secrets.

```bash
env-doctor scan-history [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--depth <number>` | `-d` | Number of commits to scan | 100 |
| `--format <format>` | `-f` | Output format: `console`, `json` | console |

### Examples

```bash
# Scan last 100 commits
env-doctor scan-history

# Scan last 500 commits
env-doctor scan-history --depth 500

# Output as JSON
env-doctor scan-history --format json
```

### Output

```bash
⚠ Found 2 potential secret(s) in git history:

  STRIPE_SECRET_KEY
    Commit: a1b2c3d4
    File: .env:12
    Author: developer@example.com
    Date: 2024-01-15
    Value: sk_li...5678

Recommendation: Consider rotating these credentials
and using git-filter-branch or BFG to remove them.
```

---

## `watch`

Watch for changes and re-analyze automatically.

```bash
env-doctor watch [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--config <path>` | `-c` | Path to config file |

### Examples

```bash
# Start watch mode
env-doctor watch

# With custom config
env-doctor watch --config ./custom-config.js
```

### Behavior

- Watches `.env` files and source directories
- Re-scans on file changes
- Updates terminal output in place
- Press `Ctrl+C` to stop

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | No errors found |
| `1` | Errors found (or warnings in strict mode) |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_ACTIONS` | Enables GitHub Actions annotation format |
| `CI` | Detected CI environment (various CI providers) |
| `NO_COLOR` | Disables colored output |

---

## Output Formats

### Console (default)

Human-readable output with colors and formatting:

```bash
env-doctor v1.0.0

Framework: nextjs
Scanned 42 files, 12 env variables

✗ Missing Variables (2 issues)
  DATABASE_URL
    Variable is used but not defined
    at src/lib/db.ts:5

Summary: 2 errors, 1 warning
```

### JSON

Machine-readable JSON output:

```bash
env-doctor --format json
```

```json
{
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "framework": "nextjs",
  "summary": {
    "totalIssues": 3,
    "errors": 2,
    "warnings": 1
  },
  "issues": [...]
}
```

### SARIF

GitHub Code Scanning format:

```bash
env-doctor --format sarif > results.sarif
```

Upload to GitHub:

```yaml
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

