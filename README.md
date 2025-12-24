<div align="center">
  <img src="docs/static/img/logo.svg" alt="env-doctor logo" width="120" height="120">
  
  # env-doctor 🩺

  **The complete environment variable management platform**

  [![npm version](https://img.shields.io/npm/v/@theaccessibleteam/env-doctor?color=brightgreen)](https://www.npmjs.com/package/@theaccessibleteam/env-doctor)
  [![npm downloads](https://img.shields.io/npm/dm/@theaccessibleteam/env-doctor)](https://www.npmjs.com/package/@theaccessibleteam/env-doctor)
  [![license](https://img.shields.io/npm/l/@theaccessibleteam/env-doctor)](./LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

  [![CI](https://github.com/WOLFIEEEE/env-doctor/actions/workflows/ci.yml/badge.svg)](https://github.com/WOLFIEEEE/env-doctor/actions/workflows/ci.yml)
  [![CodeQL](https://github.com/WOLFIEEEE/env-doctor/actions/workflows/codeql.yml/badge.svg)](https://github.com/WOLFIEEEE/env-doctor/actions/workflows/codeql.yml)
  [![Documentation](https://img.shields.io/badge/docs-online-blue)](https://WOLFIEEEE.github.io/env-doctor)
  [![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC?logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=theaccessibleteam.env-doctor-vscode)

  [Documentation](https://WOLFIEEEE.github.io/env-doctor) •
  [Getting Started](#quick-start) •
  [Features](#features) •
  [VS Code Extension](#vs-code-extension) •
  [Contributing](./CONTRIBUTING.md)

</div>

---

## What's New in v1.1 🎉

- **Runtime Validation** - Type-safe environment variables with `createEnv()`
- **VS Code Extension** - Real-time diagnostics, autocomplete, and quick fixes
- **Multi-Environment Matrix** - Compare variables across dev/staging/production
- **Monorepo Support** - Analyze all packages in a single run with shared variable tracking
- **Smart Sync** - Auto-generate `.env.example` from code analysis

---

## Why env-doctor?

Environment variables are the #1 cause of "works on my machine" bugs. A missing `DATABASE_URL` or typo in `API_KEY` can take hours to debug. env-doctor catches these issues **before** they cause runtime errors.

```bash
$ npx @theaccessibleteam/env-doctor

env-doctor v1.1.0 🩺

Framework: nextjs (auto-detected)
Scanned 42 files in 156ms

✗ ERROR  Missing Variables

  DATABASE_URL
    Used in code but not defined in .env
    → src/lib/db.ts:5

  STRIPE_SECRET_KEY
    Required variable is missing
    → src/lib/payments.ts:12

⚠ WARNING  Potential Issues

  OLD_API_KEY
    Defined in .env but never used in code

✓ Found 2 errors, 1 warning
```

## Features

### Core Analysis

| Feature | Description |
|---------|-------------|
| 🔍 **Missing Detection** | Find env vars used in code but not defined |
| 🗑️ **Unused Detection** | Find env vars defined but never used |
| 🔢 **Type Validation** | Detect type mismatches (string vs number) |
| 🔄 **Sync Check** | Keep `.env` and `.env.example` in sync |
| 🔐 **Secret Detection** | Find exposed API keys, tokens, passwords |
| 📜 **Git History Scan** | Find leaked secrets in commit history |
| ⚡ **Framework Support** | Auto-detect Next.js, Vite, CRA patterns |
| 📊 **Multiple Formats** | Console, JSON, SARIF, HTML output |

### Advanced Features

| Feature | Description |
|---------|-------------|
| 🚀 **Runtime Validation** | Type-safe env vars with TypeScript inference |
| 🖥️ **VS Code Extension** | Real-time diagnostics and autocomplete |
| 📊 **Environment Matrix** | Compare variables across environments |
| 📦 **Monorepo Support** | Analyze all packages with shared tracking |
| 🔄 **Smart Sync** | Auto-generate `.env.example` templates |
| 📈 **Dependency Graph** | Visualize env var usage across packages |

## Quick Start

```bash
# Run without installing
npx @theaccessibleteam/env-doctor

# Or install globally
npm install -g @theaccessibleteam/env-doctor
env-doctor

# Or add to your project
npm install -D @theaccessibleteam/env-doctor
```

## Runtime Validation

Validate environment variables at startup with full TypeScript support:

```typescript
// src/env.ts
import { createEnv } from '@theaccessibleteam/env-doctor/runtime';

export const env = createEnv({
  server: {
    DATABASE_URL: { type: 'url', required: true },
    API_SECRET: { type: 'string', required: true },
    PORT: { type: 'number', default: 3000 },
  },
  client: {
    NEXT_PUBLIC_API_URL: { type: 'url', required: true },
  },
  framework: 'nextjs',
});

// Full TypeScript inference!
env.DATABASE_URL  // string (validated URL)
env.PORT          // number (coerced from string)
```

**Benefits:**
- ✅ Fail fast on startup with clear error messages
- ✅ Full TypeScript type inference
- ✅ Automatic type coercion (string → number, boolean)
- ✅ Framework-aware client/server separation

## VS Code Extension

Get real-time environment variable support in your editor:

**Features:**
- 🔴 **Live Diagnostics** - See errors as you type
- 💡 **Autocomplete** - Suggestions for `process.env.`
- 📖 **Hover Info** - See variable values, types, and usages
- ⚡ **Quick Fixes** - Add missing variables with one click
- 🔗 **Go to Definition** - Jump to `.env` file definitions

Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=theaccessibleteam.env-doctor-vscode) or search "env-doctor" in VS Code.

## CLI Commands

```bash
# Basic analysis
env-doctor                      # Scan current directory
env-doctor ./packages/api       # Scan specific directory

# Setup & configuration
env-doctor init                 # Initialize config file
env-doctor fix                  # Auto-fix issues interactively
env-doctor watch                # Watch mode for development

# Advanced features
env-doctor sync                 # Sync .env.example with code
env-doctor matrix               # Compare across environments
env-doctor workspaces           # Analyze monorepo packages
env-doctor graph                # Generate dependency graph
env-doctor generate:schema      # Generate TypeScript runtime schema

# CI/CD
env-doctor --ci                 # Exit code 1 on errors
env-doctor --format json        # Output as JSON
env-doctor --format sarif       # Output as SARIF for GitHub
env-doctor --format html        # Generate HTML report
```

## Multi-Environment Matrix

Compare environment variables across development, staging, and production:

```bash
$ env-doctor matrix --envs development,staging,production

Environment Variable Matrix
══════════════════════════════════════════════════════════════════

Variable          │ development     │ staging         │ production      │ Status
──────────────────┼─────────────────┼─────────────────┼─────────────────┼────────
DATABASE_URL      │ ✓ localhost     │ ✓ staging-db    │ ✓ prod-db       │ OK
API_KEY           │ ✓ dev-key       │ ✗ MISSING       │ ✓ ****          │ ERROR
REDIS_URL         │ ✓ localhost     │ ✓ staging       │ ✗ MISSING       │ ERROR
LOG_LEVEL         │ ✓ debug         │ ✓ info          │ ✓ warn          │ OK

══════════════════════════════════════════════════════════════════
Summary: 4 variables, 2 errors, 0 warnings
```

## Monorepo Support

Analyze all packages in your monorepo with shared variable tracking:

```bash
$ env-doctor workspaces

Monorepo Environment Analysis
══════════════════════════════════════════════════════════════════

📦 @myapp/web (nextjs)
   .env files: .env, .env.local
   ✓ No issues

📦 @myapp/api (node)
   .env files: .env
   ✗ 2 errors

📦 @myapp/shared (library)
   ✗ 1 warning

Shared Variables (from root .env)
─────────────────────────────────────────────────────────
DATABASE_URL      │ @myapp/web, @myapp/api
REDIS_URL         │ @myapp/api

Summary: 3 packages, 1 with issues, 2 errors, 1 warning
```

## Configuration

Create `env-doctor.config.js` in your project root:

```javascript
/** @type {import('@theaccessibleteam/env-doctor').EnvDoctorConfig} */
export default {
  // Files to scan for env usage
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['node_modules', 'dist', '**/*.test.ts'],
  
  // Env files to check
  envFiles: ['.env', '.env.local'],
  templateFile: '.env.example',
  
  // Framework (auto-detected by default)
  framework: 'auto', // 'nextjs' | 'vite' | 'cra' | 'node' | 'auto'
  
  // Variable-specific rules
  variables: {
    DATABASE_URL: {
      required: true,
      secret: true,
      pattern: /^postgres(ql)?:\/\//,
      description: 'PostgreSQL connection string',
    },
    PORT: {
      type: 'number',
      default: 3000,
    },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test'],
    },
  },
  
  // Multi-environment configuration
  environments: {
    development: { envFiles: ['.env.development'] },
    staging: { envFiles: ['.env.staging'] },
    production: { envFiles: ['.env.production'], strict: true },
  },
  
  // Monorepo configuration
  workspaces: {
    detectFrom: 'auto', // 'npm' | 'yarn' | 'pnpm' | 'turbo' | 'nx'
    rootEnvFiles: ['.env'],
    inheritance: 'cascade',
  },
  
  // Ignore specific variables
  ignore: ['INTERNAL_*', 'DEBUG_*'],
};
```

## Comparison: env-doctor vs Alternatives

| Feature | env-doctor | dotenv-linter | envalid | t3-env |
|---------|------------|---------------|---------|--------|
| **Static Analysis** | ✅ | ✅ | ❌ | ❌ |
| **Runtime Validation** | ✅ | ❌ | ✅ | ✅ |
| **TypeScript Types** | ✅ | ❌ | ✅ | ✅ |
| **VS Code Extension** | ✅ | ❌ | ❌ | ❌ |
| **Multi-Environment** | ✅ | ❌ | ❌ | ❌ |
| **Monorepo Support** | ✅ | ❌ | ❌ | ❌ |
| **Auto-fix** | ✅ | ✅ | ❌ | ❌ |
| **Git History Scan** | ✅ | ❌ | ❌ | ❌ |
| **Sync .env.example** | ✅ | ❌ | ❌ | ❌ |
| **CI/CD Integration** | ✅ | ✅ | ❌ | ❌ |
| **SARIF Output** | ✅ | ❌ | ❌ | ❌ |
| **Framework Aware** | ✅ | ❌ | ✅ | ✅ |

**When to use env-doctor:**
- You need both static analysis AND runtime validation
- You work with monorepos or multiple environments
- You want IDE support with autocomplete and diagnostics
- You need CI/CD integration with SARIF reports

## Framework Support

env-doctor auto-detects your framework and applies the correct rules:

| Framework | Client Prefix | Server Prefix | Auto-Detection |
|-----------|---------------|---------------|----------------|
| **Next.js** | `NEXT_PUBLIC_*` | All others | `next.config.js` |
| **Vite** | `VITE_*` | N/A | `vite.config.ts` |
| **Create React App** | `REACT_APP_*` | N/A | `react-scripts` |
| **Node.js** | N/A | All | Default |

## CI/CD Integration

### GitHub Actions

```yaml
name: Env Check
on: [push, pull_request]

jobs:
  env-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check environment variables
        run: npx @theaccessibleteam/env-doctor --ci
        
      # Optional: Upload SARIF for GitHub Code Scanning
      - name: Run env-doctor with SARIF
        run: npx @theaccessibleteam/env-doctor --format sarif > results.sarif
        continue-on-error: true
        
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

### Pre-commit Hook

```bash
# .husky/pre-commit
npx @theaccessibleteam/env-doctor --ci
```

## Programmatic API

```typescript
import { analyze, loadConfig, reportToConsole } from '@theaccessibleteam/env-doctor';

// Load config from env-doctor.config.js
const { config } = await loadConfig();

// Run analysis
const result = await analyze({ config });

// Output to console
reportToConsole(result);

// Or handle programmatically
if (result.stats.errorCount > 0) {
  console.error(`Found ${result.stats.errorCount} errors!`);
  process.exit(1);
}
```

### Runtime Validation API

```typescript
import { createEnv, mockEnv } from '@theaccessibleteam/env-doctor/runtime';

// Create validated env object
const env = createEnv({
  server: {
    DATABASE_URL: { type: 'url', required: true },
  },
  client: {
    NEXT_PUBLIC_API_URL: { type: 'url', required: true },
  },
});

// For testing - mock environment variables
mockEnv({
  DATABASE_URL: 'postgres://localhost:5432/test',
  NEXT_PUBLIC_API_URL: 'http://localhost:3000',
});

// Restore original env
mockEnv.restore();
```

## Documentation

📚 **Full documentation**: [https://WOLFIEEEE.github.io/env-doctor](https://WOLFIEEEE.github.io/env-doctor)

- [Installation Guide](https://WOLFIEEEE.github.io/env-doctor/docs/getting-started/installation)
- [Configuration Reference](https://WOLFIEEEE.github.io/env-doctor/docs/getting-started/configuration)
- [CLI Reference](https://WOLFIEEEE.github.io/env-doctor/docs/cli-reference)
- [Runtime Validation](https://WOLFIEEEE.github.io/env-doctor/docs/features/runtime-validation)
- [Multi-Environment](https://WOLFIEEEE.github.io/env-doctor/docs/features/multi-environment)
- [Monorepo Guide](https://WOLFIEEEE.github.io/env-doctor/docs/examples/monorepo)
- [VS Code Extension](https://WOLFIEEEE.github.io/env-doctor/docs/features/ide-extension)
- [API Reference](https://WOLFIEEEE.github.io/env-doctor/docs/api-reference)

## Contributing

We love contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) before submitting a PR.

```bash
# Clone the repo
git clone https://github.com/WOLFIEEEE/env-doctor.git
cd env-doctor

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Security

Found a vulnerability? Please read our [Security Policy](./SECURITY.md) for responsible disclosure.

## License

[MIT](./LICENSE) © 2024 The Accessible Team

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/WOLFIEEEE">@WOLFIEEEE</a></sub>
</div>
