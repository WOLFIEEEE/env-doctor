<div align="center">
  <img src="docs/static/img/logo.svg" alt="env-doctor logo" width="120" height="120">
  
  # env-doctor 🩺

  **Analyze and validate environment variables in your codebase**

  [![npm version](https://img.shields.io/npm/v/@theaccessibleteam/env-doctor?color=brightgreen)](https://www.npmjs.com/package/@theaccessibleteam/env-doctor)
  [![npm downloads](https://img.shields.io/npm/dm/@theaccessibleteam/env-doctor)](https://www.npmjs.com/package/@theaccessibleteam/env-doctor)
  [![license](https://img.shields.io/npm/l/@theaccessibleteam/env-doctor)](./LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

  [![CI](https://github.com/WOLFIEEEE/env-doctor/actions/workflows/ci.yml/badge.svg)](https://github.com/WOLFIEEEE/env-doctor/actions/workflows/ci.yml)
  [![CodeQL](https://github.com/WOLFIEEEE/env-doctor/actions/workflows/codeql.yml/badge.svg)](https://github.com/WOLFIEEEE/env-doctor/actions/workflows/codeql.yml)
  [![Documentation](https://img.shields.io/badge/docs-online-blue)](https://WOLFIEEEE.github.io/env-doctor)

  [Documentation](https://WOLFIEEEE.github.io/env-doctor) •
  [Getting Started](#quick-start) •
  [Features](#features) •
  [Contributing](./CONTRIBUTING.md)

</div>

---

## Why env-doctor?

Environment variables are the #1 cause of "works on my machine" bugs. A missing `DATABASE_URL` or typo in `API_KEY` can take hours to debug. env-doctor catches these issues **before** they cause runtime errors.

```bash
$ npx @theaccessibleteam/env-doctor

env-doctor v1.0.0 🩺

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

| Feature | Description |
|---------|-------------|
| 🔍 **Missing Detection** | Find env vars used in code but not defined |
| 🗑️ **Unused Detection** | Find env vars defined but never used |
| 🔢 **Type Validation** | Detect type mismatches (string vs number) |
| 🔄 **Sync Check** | Keep `.env` and `.env.example` in sync |
| 🔐 **Secret Detection** | Find exposed API keys, tokens, passwords |
| 📜 **Git History Scan** | Find leaked secrets in commit history |
| ⚡ **Framework Support** | Auto-detect Next.js, Vite, CRA patterns |
| 📊 **Multiple Formats** | Console, JSON, SARIF output |

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

## CLI Commands

```bash
# Scan current directory
env-doctor

# Scan specific directory
env-doctor ./packages/api

# Initialize config file
env-doctor init

# Auto-fix issues interactively
env-doctor fix

# Watch mode for development
env-doctor watch

# Scan git history for leaked secrets
env-doctor scan-history

# CI mode (exit code 1 on errors)
env-doctor --ci

# Output as JSON
env-doctor --format json

# Output as SARIF (for GitHub Code Scanning)
env-doctor --format sarif > results.sarif
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
      pattern: /^postgres(ql)?:\/\//
    },
    PORT: {
      type: 'number',
      default: 3000
    },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test']
    }
  },
  
  // Ignore specific variables
  ignore: ['INTERNAL_*', 'DEBUG_*']
};
```

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

## Documentation

📚 **Full documentation**: [https://WOLFIEEEE.github.io/env-doctor](https://WOLFIEEEE.github.io/env-doctor)

- [Installation Guide](https://WOLFIEEEE.github.io/env-doctor/docs/getting-started/installation)
- [Configuration Reference](https://WOLFIEEEE.github.io/env-doctor/docs/getting-started/configuration)
- [CLI Reference](https://WOLFIEEEE.github.io/env-doctor/docs/cli-reference)
- [API Reference](https://WOLFIEEEE.github.io/env-doctor/docs/api-reference)
- [CI/CD Integration](https://WOLFIEEEE.github.io/env-doctor/docs/ci-integration)
- [Framework Guides](https://WOLFIEEEE.github.io/env-doctor/docs/frameworks/nextjs)

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
