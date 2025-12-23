# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-23

### 🎉 Initial Release

#### Added

- **Core Analysis Engine**
  - Environment variable parsing from `.env` files
  - AST-based code scanning using `@typescript-eslint/typescript-estree`
  - Framework auto-detection (Next.js, Vite, Create React App, Node.js)

- **Issue Detection**
  - Missing variables (used in code but not defined)
  - Unused variables (defined but never used)
  - Type mismatches (string used as number, etc.)
  - Secret detection with 20+ patterns (API keys, tokens, passwords)
  - Sync drift between `.env` and `.env.example`

- **CLI Commands**
  - `env-doctor` - Run analysis with colorful console output
  - `env-doctor init` - Initialize configuration file
  - `env-doctor fix` - Auto-fix common issues
  - `env-doctor watch` - Watch mode for development
  - `env-doctor scan-history` - Scan git history for leaked secrets

- **Output Formats**
  - Console reporter with colors and icons
  - JSON reporter for programmatic use
  - SARIF reporter for GitHub Code Scanning

- **Framework Support**
  - Next.js (`NEXT_PUBLIC_*` prefix detection)
  - Vite (`VITE_*` prefix and `import.meta.env`)
  - Create React App (`REACT_APP_*` prefix)
  - Node.js (standard `process.env`)

- **Configuration**
  - `env-doctor.config.js` configuration file
  - Zod-based schema validation
  - Custom rules and ignore patterns

- **Documentation**
  - Docusaurus documentation site
  - API reference
  - CI/CD integration guides
  - Example projects

[1.0.0]: https://github.com/WOLFIEEEE/env-doctor/releases/tag/v1.0.0
