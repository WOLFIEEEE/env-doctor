# env-doctor 🩺

A powerful CLI tool to analyze and validate environment variables in your codebase. Detect missing, unused, and misconfigured env vars before they cause runtime errors.

[![npm version](https://img.shields.io/npm/v/env-doctor)](https://www.npmjs.com/package/env-doctor)
[![license](https://img.shields.io/npm/l/env-doctor)](./LICENSE)
[![Documentation](https://img.shields.io/badge/docs-online-blue)](https://WOLFIEEEE.github.io/env-doctor)

## Features

- **Missing Variable Detection** - Find env vars used in code but not defined in `.env`
- **Unused Variable Detection** - Find env vars defined but never used
- **Type Validation** - Detect type mismatches (e.g., using `parseInt()` on non-numeric values)
- **Sync Check** - Keep `.env` and `.env.example` in sync
- **Secret Detection** - Find exposed secrets and credentials
- **Framework Support** - Auto-detect Next.js, Vite, Create React App patterns
- **Git History Scanning** - Find leaked secrets in commit history
- **Multiple Output Formats** - Console, JSON, SARIF (GitHub code scanning)

## Quick Start

```bash
# Run without installing
npx env-doctor

# Or install globally
npm install -g env-doctor
```

## Example Output

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

Summary: 2 errors, 1 warning
Completed in 156ms
```

## Installation

```bash
# Using npm
npm install -g env-doctor

# Using pnpm
pnpm add -g env-doctor

# Using npx (no installation)
npx env-doctor
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `env-doctor` | Scan for environment issues |
| `env-doctor init` | Initialize config and .env.example |
| `env-doctor fix` | Interactively fix issues |
| `env-doctor scan-history` | Scan git history for secrets |
| `env-doctor watch` | Watch mode for development |

### Common Options

```bash
env-doctor [directory] [options]

  -c, --config <path>      Path to config file
  -e, --env <environment>  Target environment (development, production, test)
  -f, --format <format>    Output format (console, json, sarif)
  --ci                     CI mode - exit with code 1 on errors
  -v, --verbose            Verbose output
  --strict                 Treat warnings as errors
```

## Configuration

Create `env-doctor.config.js` in your project root:

```javascript
module.exports = {
  envFiles: ['.env', '.env.local'],
  templateFile: '.env.example',
  include: ['src/**/*.{ts,js,tsx,jsx}'],
  exclude: ['node_modules', 'dist'],
  framework: 'auto',
  
  variables: {
    DATABASE_URL: {
      required: true,
      secret: true,
      pattern: /^postgres:\/\//
    },
    PORT: {
      type: 'number',
      default: 3000
    }
  }
};
```

## Framework Support

env-doctor auto-detects your framework and applies appropriate rules:

| Framework | Client Prefix | Detection |
|-----------|---------------|-----------|
| Next.js | `NEXT_PUBLIC_*` | `next.config.js`, `next` in package.json |
| Vite | `VITE_*` | `vite.config.ts`, `vite` in package.json |
| CRA | `REACT_APP_*` | `react-scripts` in package.json |

## CI/CD Integration

### GitHub Actions

```yaml
- name: Check environment variables
  run: npx env-doctor --ci --format sarif > results.sarif

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

## Programmatic API

```typescript
import { analyze, loadConfig } from 'env-doctor';

const { config } = await loadConfig();
const result = await analyze({ config });

console.log(`Found ${result.issues.length} issues`);
```

## Documentation

📚 **Full documentation**: [https://WOLFIEEEE.github.io/env-doctor](https://WOLFIEEEE.github.io/env-doctor)

- [Getting Started](https://WOLFIEEEE.github.io/env-doctor/docs/getting-started/installation)
- [Configuration](https://WOLFIEEEE.github.io/env-doctor/docs/getting-started/configuration)
- [CLI Reference](https://WOLFIEEEE.github.io/env-doctor/docs/cli-reference)
- [API Reference](https://WOLFIEEEE.github.io/env-doctor/docs/api-reference)
- [CI Integration](https://WOLFIEEEE.github.io/env-doctor/docs/ci-integration)

## Contributing

Contributions are welcome! Please read our [contributing guidelines](./CONTRIBUTING.md).

```bash
# Clone the repo
git clone https://github.com/WOLFIEEEE/env-doctor.git
cd env-doctor

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build
```

## License

[MIT](./LICENSE)
