---
sidebar_position: 1
---

# Introduction

**env-doctor** is a powerful CLI tool that analyzes and validates environment variables in your codebase. It helps you detect missing, unused, and misconfigured env vars before they cause runtime errors.

## Why env-doctor?

Environment variables are critical to modern applications, but managing them is error-prone:

- **Missing variables** cause crashes in production
- **Unused variables** clutter your configuration
- **Exposed secrets** create security vulnerabilities
- **Type mismatches** lead to subtle bugs
- **Outdated `.env.example`** confuses new developers

env-doctor solves all of these problems with a single command.

## Features

### 🔍 Missing Variable Detection
Find environment variables used in your code but not defined in your `.env` files.

### 🧹 Unused Variable Detection
Identify variables defined in `.env` but never referenced in your codebase.

### 🔐 Secret Detection
Detect exposed API keys, tokens, and credentials with built-in patterns for 20+ services including:
- AWS, Stripe, GitHub, OpenAI
- Database URLs with credentials
- JWT tokens and private keys

### 📊 Type Validation
Catch type mismatches like:
- Using `parseInt()` on non-numeric values
- Boolean comparisons on invalid strings
- JSON parsing of malformed data

### 🔄 Sync Check
Keep `.env` and `.env.example` in sync. Never miss a variable when onboarding new developers.

### ⚡ Framework Support
Auto-detect and apply framework-specific rules for:
- **Next.js** - `NEXT_PUBLIC_*` prefixes
- **Vite** - `VITE_*` prefixes and `import.meta.env`
- **Create React App** - `REACT_APP_*` prefixes

## Quick Example

```bash
$ npx env-doctor

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

Summary: 2 errors, 1 warning
```

## Next Steps

- [Installation Guide](/docs/getting-started/installation) - Install env-doctor
- [Quick Start](/docs/getting-started/quick-start) - Run your first scan
- [Configuration](/docs/getting-started/configuration) - Customize behavior
