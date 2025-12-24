---
sidebar_position: 1
---

# Introduction

**env-doctor** is a comprehensive environment variable management platform for JavaScript and TypeScript projects. It provides static analysis, runtime validation, IDE integration, and multi-environment support to eliminate env var-related bugs.

## Why env-doctor?

Environment variables are critical to modern applications, but managing them is error-prone:

- **Missing variables** cause crashes in production
- **Unused variables** clutter your configuration  
- **Exposed secrets** create security vulnerabilities
- **Type mismatches** lead to subtle bugs (e.g., `"3000"` instead of `3000`)
- **Outdated `.env.example`** confuses new developers
- **Multi-environment drift** causes deployment failures
- **Monorepo complexity** makes tracking variables difficult

env-doctor solves all of these problems with a comprehensive toolkit.

## Key Features

### 🔍 Static Analysis
- **Missing Variable Detection** - Find env vars used in code but not defined
- **Unused Variable Detection** - Identify vars defined but never used
- **Secret Detection** - Catch exposed API keys and credentials
- **Type Validation** - Detect type mismatches and invalid values

### ⚡ Runtime Validation
- **Startup Validation** - Fail fast with clear error messages
- **Type Coercion** - Automatic string → number/boolean conversion
- **TypeScript Types** - Full type inference for your env vars
- **Framework Support** - Next.js, Vite, CRA client/server separation

### 🌍 Multi-Environment Support
- **Environment Matrix** - Compare dev/staging/prod side-by-side
- **Consistency Checks** - Ensure all environments have required vars
- **Value Validation** - Enforce rules per environment (e.g., live keys in prod)

### 📦 Monorepo Support
- **Workspace Detection** - npm, yarn, pnpm, Turborepo, Nx
- **Cross-Package Analysis** - Track shared variables
- **Conflict Detection** - Find conflicting definitions
- **Dependency Graph** - Visualize variable flow

### 🛠️ Developer Experience
- **VS Code Extension** - Real-time diagnostics and autocomplete
- **Smart Sync** - Keep `.env.example` up-to-date automatically
- **Interactive Fixes** - Guided resolution of issues
- **CI Integration** - SARIF output for GitHub code scanning

## Quick Example

```bash
$ npx env-doctor

env-doctor v1.1.0

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

## Runtime Validation Example

```typescript
// src/env.ts
import { createEnv } from '@theaccessibleteam/env-doctor/runtime';

export const env = createEnv({
  server: {
    DATABASE_URL: { type: 'url', required: true },
    PORT: { type: 'number', default: 3000 },
  },
  client: {
    NEXT_PUBLIC_API_URL: { type: 'url', required: true },
  },
  framework: 'nextjs',
});

// Fully typed!
console.log(env.PORT); // number
console.log(env.DATABASE_URL); // string
```

## Multi-Environment Matrix

```bash
$ npx env-doctor matrix

Environment Variable Matrix
═══════════════════════════════════════════════════════════

Variable          │ development  │ staging      │ production   │ Status
──────────────────┼──────────────┼──────────────┼──────────────┼────────
DATABASE_URL      │ ✓ localhost  │ ✓ staging-db │ ✓ prod-db    │ OK
STRIPE_KEY        │ ✓ sk_test_   │ ✓ sk_test_   │ ✗ MISSING    │ ERROR
DEBUG_MODE        │ ✓ true       │ ✓ true       │ ✓ true       │ WARN

Summary: 1 error, 1 warning
```

## Next Steps

- [Installation Guide](/docs/getting-started/installation) - Install env-doctor
- [Quick Start](/docs/getting-started/quick-start) - Run your first scan
- [Runtime Validation](/docs/features/runtime-validation) - Type-safe env vars
- [Multi-Environment](/docs/features/multi-environment) - Matrix validation
- [Monorepo Guide](/docs/examples/monorepo) - Workspace support
