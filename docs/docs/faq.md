---
sidebar_position: 8
title: FAQ
description: Frequently asked questions about env-doctor
---

# Frequently Asked Questions

## General

### What is env-doctor?

env-doctor is a static analysis tool that scans your codebase to find issues with environment variables. It detects missing variables, unused definitions, exposed secrets, type mismatches, and sync issues between `.env` files.

### Is env-doctor free to use?

Yes! env-doctor is completely free and open source under the MIT license. You can use it in personal and commercial projects without any restrictions.

### Which languages and file types does env-doctor support?

env-doctor supports:
- **JavaScript** (.js, .mjs, .cjs)
- **TypeScript** (.ts, .tsx)
- **JSX/React** (.jsx, .tsx)
- **Environment files** (.env, .env.local, .env.development, etc.)

---

## Setup & Configuration

### Does env-doctor work with monorepos?

Yes! You can configure env-doctor to scan specific directories within a monorepo:

```js
// env-doctor.config.js
module.exports = {
  srcDir: './packages/web/src',
  envFiles: [
    './packages/web/.env',
    './packages/web/.env.local',
  ],
};
```

For multiple packages, you can run env-doctor separately in each package directory or create package-specific configurations.

### Can I use custom .env file names?

Absolutely. Configure the `envFiles` array with your custom file names:

```js
module.exports = {
  envFiles: [
    '.env',
    '.env.secrets',
    'config/.env.production',
    'environments/staging.env',
  ],
};
```

### How do I ignore specific variables?

Use the `ignore.variables` configuration option:

```js
module.exports = {
  ignore: {
    variables: [
      'NODE_ENV',           // Exact match
      'REACT_APP_*',        // Wildcard pattern
      /^INTERNAL_.*/,       // Regex pattern
    ],
  },
};
```

### How do I exclude certain files or directories from scanning?

Use the `ignore.files` configuration:

```js
module.exports = {
  ignore: {
    files: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '**/*.test.ts',
      '**/*.spec.ts',
    ],
  },
};
```

---

## Frameworks

### Which frameworks are supported?

env-doctor auto-detects and provides special support for:

| Framework | Prefix Pattern | Auto-Detection |
|-----------|---------------|----------------|
| Next.js | `NEXT_PUBLIC_*` | `next.config.js` or `next` in dependencies |
| Vite | `VITE_*` | `vite.config.*` or `vite` in dependencies |
| Create React App | `REACT_APP_*` | `react-scripts` in dependencies |
| Node.js | No prefix | Default fallback |

### Can I define custom prefix patterns?

Yes, override the framework detection or add custom patterns:

```js
module.exports = {
  framework: 'custom',
  customPrefixes: ['MY_APP_', 'PUBLIC_'],
};
```

### Does env-doctor understand server vs client variables?

For frameworks like Next.js, env-doctor understands that:
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Other variables are server-only

It will warn if you accidentally use a non-public variable in client-side code.

---

## CI/CD Integration

### How do I use env-doctor in GitHub Actions?

Add a step to your workflow:

```yaml
- name: Check Environment Variables
  run: npx @theaccessibleteam/env-doctor --ci
```

For SARIF output (integrates with GitHub Code Scanning):

```yaml
- name: Run env-doctor
  run: npx @theaccessibleteam/env-doctor --ci --format sarif > results.sarif
  
- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

### What exit codes does env-doctor use?

| Exit Code | Meaning |
|-----------|---------|
| 0 | All checks passed |
| 1 | Errors found (missing variables, exposed secrets) |
| 2 | Configuration error |

In CI mode (`--ci`), warnings alone don't cause a non-zero exit.

### Can I run env-doctor as a pre-commit hook?

Yes! With husky:

```bash
npx husky add .husky/pre-commit "npx env-doctor --ci"
```

Or with lint-staged for checking only staged `.env` files:

```json
{
  "lint-staged": {
    ".env*": ["env-doctor --ci"]
  }
}
```

---

## Comparison with Other Tools

### How does env-doctor compare to dotenv-linter?

| Feature | env-doctor | dotenv-linter |
|---------|-----------|---------------|
| Missing variable detection | Yes (AST-based) | No |
| Unused variable detection | Yes | No |
| Secret detection | Yes (20+ patterns) | Limited |
| Framework awareness | Yes | No |
| Type validation | Yes | No |
| SARIF output | Yes | No |
| Language | JavaScript/TypeScript | Rust |

env-doctor focuses on **analyzing your codebase** to find env var issues, while dotenv-linter focuses on **linting .env file syntax**.

### How does env-doctor compare to eslint-plugin-no-secrets?

| Feature | env-doctor | eslint-plugin-no-secrets |
|---------|-----------|--------------------------|
| Scans .env files | Yes | No |
| Code scanning | Yes | Yes |
| Secret patterns | 20+ services | Generic patterns |
| Missing/unused detection | Yes | No |
| Standalone tool | Yes | ESLint plugin |

env-doctor is a standalone tool specifically designed for environment variables, while eslint-plugin-no-secrets is an ESLint rule for detecting hardcoded secrets in code.

---

## Troubleshooting

### Why isn't my variable being detected?

See our [Troubleshooting Guide](/docs/troubleshooting) for common causes and solutions.

### I'm getting false positives. How do I fix this?

You can ignore specific variables or files in your configuration. See the [Configuration Guide](/docs/getting-started/configuration) for details.

---

## Still have questions?

- Check the [Troubleshooting Guide](/docs/troubleshooting)
- Open an issue on [GitHub](https://github.com/WOLFIEEEE/env-doctor/issues)
- Read the [API Reference](/docs/api-reference)

