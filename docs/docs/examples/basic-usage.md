---
sidebar_position: 1
---

# Basic Usage

A step-by-step guide to using env-doctor in a typical project.

## Scenario

You have a Node.js/TypeScript project with:
- A `.env` file with configuration
- Source code that uses `process.env`
- No documentation of required variables

## Step 1: Initial Scan

Run env-doctor to see current issues:

```bash
npx env-doctor
```

Example output:

```bash
env-doctor v1.0.0

Framework: node
Scanned 24 files, 8 env variables

✗ Missing Variables (3 issues)

  DATABASE_URL
    Variable "DATABASE_URL" is used in code but not defined
    at src/db.ts:5

  REDIS_URL
    Variable "REDIS_URL" is used in code but not defined
    at src/cache.ts:12

  JWT_SECRET
    Variable "JWT_SECRET" is used in code but not defined
    at src/auth.ts:8

⚠ Unused Variables (2 issues)

  OLD_API_KEY
    Defined in .env but never used
    at .env:15

  LEGACY_URL
    Defined in .env but never used
    at .env:18

Summary: 3 errors, 2 warnings
Completed in 89ms
```

## Step 2: Fix Missing Variables

Add the missing variables to your `.env`:

```bash
# .env
PORT=3000
NODE_ENV=development

# Add these
DATABASE_URL=postgres://localhost:5432/mydb
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
```

## Step 3: Clean Up Unused Variables

Remove or comment out unused variables:

```bash
# .env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://localhost:5432/mydb
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here

# Removed: OLD_API_KEY, LEGACY_URL
```

## Step 4: Create Configuration

Initialize env-doctor config:

```bash
npx env-doctor init
```

This creates `env-doctor.config.js`:

```javascript
module.exports = {
  envFiles: ['.env', '.env.local'],
  templateFile: '.env.example',
  include: ['src/**/*.{ts,js}'],
  exclude: ['node_modules', 'dist'],
  framework: 'auto',
  variables: {
    DATABASE_URL: {
      required: true,
      secret: true,
      pattern: /^postgres:\/\//
    },
    JWT_SECRET: {
      required: true,
      secret: true
    }
  }
};
```

## Step 5: Create .env.example

The `init` command also creates `.env.example`:

```bash
# Environment Variables Template
# Copy this file to .env and fill in the values

# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/db

# Cache
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=
```

## Step 6: Verify

Run env-doctor again:

```bash
npx env-doctor
```

```bash
env-doctor v1.0.0

Framework: node
Scanned 24 files, 5 env variables

✓ Sync Check
  .env and .env.example are in sync

Summary: All checks passed!
Completed in 45ms
```

## Step 7: Add to CI

Add to your GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
- name: Check environment
  run: npx env-doctor --ci
```

## Step 8: Add to Git Hooks

Prevent bad commits with Husky:

```bash
npm install -D husky
npx husky init
echo "npx env-doctor --ci" > .husky/pre-commit
```

## Project Structure

Your project now has:

```
my-project/
├── .env                    # Local config (gitignored)
├── .env.example            # Template (committed)
├── env-doctor.config.js    # Config (committed)
├── .gitignore              # Includes .env
└── src/
    └── ...
```

## Git Ignore

Make sure `.env` is gitignored:

```bash
# .gitignore
.env
.env.local
.env.*.local
```

But commit the template and config:

```bash
git add .env.example env-doctor.config.js
git commit -m "Add env-doctor configuration"
```

