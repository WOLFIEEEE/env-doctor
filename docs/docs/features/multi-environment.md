---
sidebar_position: 7
---

# Multi-Environment Validation

The matrix command validates environment variables across multiple environments (development, staging, production) to catch inconsistencies before deployment.

## Quick Start

```bash
# Auto-detect environments from .env.* files
npx env-doctor matrix

# Specify environments explicitly
npx env-doctor matrix --envs development,staging,production
```

## Matrix Output

```
Environment Variable Matrix
═══════════════════════════════════════════════════════════════════════

Variable              │ development    │ staging        │ production     │ Status
──────────────────────┼────────────────┼────────────────┼────────────────┼────────
DATABASE_URL          │ ✓ localhost    │ ✓ staging-db   │ ✓ prod-db      │ OK
REDIS_URL             │ ✓ localhost    │ ✓ staging      │ ✓ prod         │ OK
PORT                  │ ✓ 3000         │ ✓ 3000         │ ✓ 8080         │ OK
──────────────────────┼────────────────┼────────────────┼────────────────┼────────
STRIPE_SECRET_KEY     │ ✓ sk_test_...  │ ✓ sk_test_...  │ ✗ MISSING      │ ERROR
──────────────────────┼────────────────┼────────────────┼────────────────┼────────
DEBUG_MODE            │ ✓ true         │ ✓ true         │ ✓ true         │ WARN

Summary:
  Total variables: 5
  ✓ Consistent: 3
  ✗ Errors: 1
  ⚠ Warnings: 1
```

## Configuration

Define environments in your config file:

```javascript
// env-doctor.config.js
export default {
  environments: {
    development: {
      envFiles: ['.env', '.env.local', '.env.development'],
      description: 'Local development',
    },
    staging: {
      envFiles: ['.env', '.env.staging'],
      description: 'Staging environment',
    },
    production: {
      envFiles: ['.env', '.env.production'],
      description: 'Production environment',
      strict: true, // All required vars must be present
    },
  },

  variables: {
    STRIPE_SECRET_KEY: {
      required: true,
      secret: true,
      environments: {
        development: {
          pattern: /^sk_test_/,
          message: 'Must use test keys in development',
        },
        production: {
          pattern: /^sk_live_/,
          message: 'Must use live keys in production',
        },
      },
    },

    DEBUG_MODE: {
      type: 'boolean',
      environments: {
        production: {
          mustBe: false,
          message: 'Debug must be disabled in production',
        },
      },
    },
  },

  matrix: {
    requireConsistency: 'warn', // 'error' | 'warn' | 'off'
    excludeFromMatrix: ['LOCAL_*', 'DEV_ONLY_*'],
  },
};
```

## Environment-Specific Rules

### Pattern Matching

Enforce different patterns per environment:

```javascript
STRIPE_PUBLISHABLE_KEY: {
  environments: {
    development: { pattern: /^pk_test_/ },
    staging: { pattern: /^pk_test_/ },
    production: { pattern: /^pk_live_/ },
  },
}
```

### Enforced Values

Require specific values in certain environments:

```javascript
DEBUG_MODE: {
  environments: {
    production: { mustBe: false },
  },
}
```

### Required Per Environment

Make variables required only in certain environments:

```javascript
SENTRY_DSN: {
  required: {
    development: false,
    staging: true,
    production: true,
  },
}
```

## Interactive Fix Mode

Resolve issues interactively:

```bash
npx env-doctor matrix --fix
```

```
Matrix Fix Mode
═══════════════════════════════════════════════════════════

Issue 1/2: STRIPE_SECRET_KEY missing in production

  development: sk_test_abc123...
  staging:     sk_test_def456...
  production:  ✗ MISSING

  What would you like to do?
  
  ❯ Enter production value manually
    Copy from staging
    Skip for now
    
  > Enter value: sk_live_xyz789...
  
  ✓ Added STRIPE_SECRET_KEY to .env.production
```

## Output Formats

### Table (Default)

```bash
npx env-doctor matrix --format table
```

### JSON

```bash
npx env-doctor matrix --format json
```

```json
{
  "environments": ["development", "staging", "production"],
  "matrix": {
    "DATABASE_URL": {
      "development": { "status": "set", "valid": true },
      "staging": { "status": "set", "valid": true },
      "production": { "status": "set", "valid": true }
    }
  },
  "summary": {
    "totalVariables": 5,
    "errorCount": 1,
    "warningCount": 1
  }
}
```

### CSV

```bash
npx env-doctor matrix --format csv
```

### HTML

```bash
npx env-doctor matrix --format html > report.html
```

Generates an interactive HTML report.

## CI Integration

```yaml
# .github/workflows/env-check.yml
name: Environment Validation

on:
  push:
    paths:
      - '.env*'
      - 'env-doctor.config.js'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate environment matrix
        run: npx env-doctor matrix --ci
        
      - name: Upload report
        if: always()
        run: npx env-doctor matrix --format html > report.html
        
      - uses: actions/upload-artifact@v4
        with:
          name: env-matrix-report
          path: report.html
```

## Best Practices

1. **Use environment-specific files** - `.env.development`, `.env.staging`, `.env.production`
2. **Define all environments in config** - Explicit is better than implicit
3. **Set strict mode for production** - Catch missing vars before deploy
4. **Run in CI** - Validate on every push to env files
5. **Use patterns for secrets** - Ensure test keys aren't in production

