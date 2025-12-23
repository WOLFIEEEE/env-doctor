# Contributing to env-doctor

Thank you for your interest in contributing to env-doctor! This document provides guidelines and information for contributors.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all experience levels.

## Getting Started

### Prerequisites

- Node.js 20 or later
- pnpm 9 or later

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/env-doctor.git
   cd env-doctor
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Run tests to verify setup:
   ```bash
   pnpm test
   ```

## Development Workflow

### Building

```bash
pnpm build
```

### Testing

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run with coverage
pnpm test:coverage
```

### Linting

```bash
pnpm lint
```

## Project Structure

```
env-doctor/
├── src/
│   ├── cli.ts           # CLI entry point
│   ├── core.ts          # Main analysis orchestrator
│   ├── config.ts        # Configuration loading
│   ├── types/           # TypeScript types
│   ├── scanner/         # Code and env file scanners
│   ├── analyzers/       # Issue detection modules
│   ├── reporters/       # Output formatters
│   ├── frameworks/      # Framework detection
│   └── utils/           # Utility functions
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── fixtures/        # Test fixtures
├── docs/                # Documentation site
└── examples/            # Example projects
```

## Making Changes

### Branching

- Create a feature branch from `main`:
  ```bash
  git checkout -b feature/your-feature-name
  ```
- Use descriptive branch names: `feature/`, `fix/`, `docs/`, `refactor/`

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Examples:
```
feat: add support for Remix framework detection
fix: handle empty .env files gracefully
docs: add configuration examples for monorepos
```

### Pull Requests

1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new features
4. Create a changeset for user-facing changes:
   ```bash
   pnpm changeset
   ```
5. Open a PR with a clear description

## Adding New Features

### New Analyzer

1. Create a new file in `src/analyzers/`
2. Export the analyzer function
3. Add to `src/analyzers/index.ts`
4. Integrate in `src/core.ts`
5. Add tests in `tests/unit/`

### New Framework Support

1. Add framework info in `src/frameworks/index.ts`
2. Update `FRAMEWORKS` object with prefixes and patterns
3. Add tests for detection
4. Document in `docs/docs/frameworks/`

### New Reporter

1. Create a new file in `src/reporters/`
2. Export the reporter function
3. Add format option in `src/cli.ts`
4. Add tests

## Testing Guidelines

- Write tests for all new functionality
- Aim for descriptive test names
- Use fixtures for file-based tests
- Mock external dependencies (git, file system) when appropriate

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments to public APIs
- Update docs site for new features
- Include examples where helpful

## Release Process

Releases are automated via GitHub Actions:

1. Create a changeset: `pnpm changeset`
2. Merge to main
3. CI creates a release PR
4. Merge the release PR to publish

## Getting Help

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

