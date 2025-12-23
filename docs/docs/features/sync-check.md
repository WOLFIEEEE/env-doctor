---
sidebar_position: 5
---

# Sync Check

Keep your `.env` and `.env.example` files in sync.

## Why Sync Matters

`.env.example` serves as documentation for your project:
- Shows what variables are needed
- Provides example values
- Helps onboard new developers

When it's out of sync, developers miss required variables.

## How It Works

env-doctor compares your `.env` files against `.env.example`:

```bash
# .env
DATABASE_URL=postgres://localhost/mydb
API_KEY=abc123
NEW_FEATURE_FLAG=true  # Missing from example

# .env.example
DATABASE_URL=postgres://user:pass@localhost/db
API_KEY=
OLD_VARIABLE=          # Missing from .env
```

## Example Output

```bash
⚠ Sync Drift (2 issues)

  NEW_FEATURE_FLAG
    Variable is defined in .env but not in .env.example
    at .env:3
    fix: Add NEW_FEATURE_FLAG= to .env.example

ℹ Sync Drift (1 issue)

  OLD_VARIABLE
    Variable is in .env.example but not defined in .env
    at .env.example:4
    fix: Add OLD_VARIABLE= to your .env file
```

## Configuration

### Specify Template File

```javascript
// env-doctor.config.js
module.exports = {
  envFiles: ['.env', '.env.local'],
  templateFile: '.env.example'  // Compare against this
};
```

### Multiple Environments

For environment-specific templates:

```javascript
templateFile: '.env.example'  // Base template

// Or target specific environment
// npx env-doctor --env production
```

## Auto-Generate Template

Generate `.env.example` from your code:

```bash
npx env-doctor init --example-only
```

This creates a template with:
- All variables used in code
- Grouped by prefix
- Comments for each section
- Secrets left empty

Example output:

```bash
# Environment Variables Template
# Copy this file to .env and fill in the values

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/db

# API
API_KEY=
API_SECRET=

# Next Public
NEXT_PUBLIC_API_URL=https://api.example.com

# App
NODE_ENV=development
PORT=3000
```

## Interactive Sync

Use fix mode to sync interactively:

```bash
npx env-doctor fix
```

Options:
1. Add missing variables to `.env.example`
2. Add missing variables to `.env`
3. Skip

## CI Integration

Fail CI if files are out of sync:

```yaml
- name: Check env sync
  run: npx env-doctor --ci
```

## Template Best Practices

### Include Examples

```bash
# Good - shows format
DATABASE_URL=postgres://user:pass@localhost:5432/db
API_URL=https://api.example.com

# Avoid - no guidance
DATABASE_URL=
API_URL=
```

### Group Related Variables

```bash
# Database
DATABASE_URL=postgres://localhost/db
DATABASE_POOL_SIZE=10

# External APIs
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=

# Feature Flags
ENABLE_NEW_FEATURE=false
```

### Document Required vs Optional

```bash
# Required
DATABASE_URL=postgres://localhost/db
API_KEY=

# Optional (has defaults)
# PORT=3000
# DEBUG=false
```

### Mask Sensitive Examples

```bash
# Don't expose real formats
API_KEY=                          # Good
API_KEY=sk_test_...               # Okay for test keys
API_KEY=sk_live_abc123            # Bad - real key format
```

## Handling Drift

### New Variable Added

When you add a new env variable:

1. Add to `.env` with your value
2. Add to `.env.example` with placeholder
3. Commit both files

### Variable Removed

When removing a variable:

1. Remove from code
2. Remove from `.env`
3. Remove from `.env.example`
4. Commit changes

### Variable Renamed

When renaming:

1. Update code references
2. Update `.env` key
3. Update `.env.example` key
4. Commit all together

