---
sidebar_position: 2
---

# Quick Start

Get up and running with env-doctor in under a minute.

## 1. Run Your First Scan

Navigate to your project directory and run:

```bash
npx env-doctor
```

env-doctor will automatically:
- Detect your framework (Next.js, Vite, etc.)
- Parse your `.env` files
- Scan your source code for `process.env` usage
- Report any issues found

## 2. Understanding the Output

```bash
env-doctor v1.0.0

Framework: nextjs
Scanned 42 files, 12 env variables

✗ Missing Variables (2 issues)

  DATABASE_URL
    Variable "DATABASE_URL" is used in code but not defined
    at src/lib/db.ts:5

  API_SECRET
    Required variable is not defined

⚠ Unused Variables (1 issue)

  OLD_API_KEY
    Defined in .env but never used

✓ Sync Check
  .env and .env.example are in sync

Summary: 2 errors, 1 warning
Completed in 156ms
```

### Issue Types

| Icon | Severity | Meaning |
|------|----------|---------|
| ✗ | Error | Must be fixed - will cause runtime issues |
| ⚠ | Warning | Should be reviewed - potential issues |
| ℹ | Info | Informational - good to know |
| ✓ | Success | Check passed |

## 3. Initialize Configuration

Generate a config file and `.env.example`:

```bash
npx env-doctor init
```

This creates:
- `env-doctor.config.js` - Configuration file
- `.env.example` - Template with all used variables

## 4. Fix Issues Interactively

Use the interactive fix mode to resolve issues:

```bash
npx env-doctor fix
```

This guides you through:
- Adding missing variables to `.env`
- Updating `.env.example`
- Ignoring false positives

## 5. Add to CI/CD

Add env-doctor to your CI pipeline:

```bash
npx env-doctor --ci
```

The `--ci` flag:
- Exits with code 1 if errors are found
- Outputs GitHub Actions annotations
- Perfect for PR checks

## Common Workflows

### Daily Development

```bash
# Check for issues
npx env-doctor

# Watch mode - re-scan on changes
npx env-doctor watch
```

### Before Committing

```bash
# Full scan with strict mode
npx env-doctor --strict
```

### Pull Request Checks

```yaml
# In your CI workflow
- run: npx env-doctor --ci --format sarif > results.sarif
```

## Next Steps

- [Configuration](/docs/getting-started/configuration) - Customize behavior
- [CLI Reference](/docs/cli-reference) - All commands and options
- [CI Integration](/docs/ci-integration) - Set up automated checks

