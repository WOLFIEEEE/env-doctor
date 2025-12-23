---
sidebar_position: 10
title: Cursor AI Prompt
description: Copy this prompt to quickly set up env-doctor in your project using Cursor AI
---

# Cursor AI Prompt Guide

Use this prompt with Cursor AI to automatically set up env-doctor in your project.

## Quick Setup Prompt

Copy the prompt below and paste it into Cursor AI chat:

```text
Add env-doctor to this project to analyze and validate environment variables.

Please do the following:

1. Install the package:
   npm install -D @theaccessibleteam/env-doctor

2. Create a configuration file `env-doctor.config.js` in the project root with these settings:
   - Detect the framework being used (Next.js, Vite, CRA, or Node.js)
   - Set appropriate file patterns to scan
   - Configure .env file paths
   - Enable all analyzers: missing, unused, secrets, type-mismatch, sync-check

3. Add npm scripts to package.json:
   - "env:check": "env-doctor"
   - "env:check:ci": "env-doctor --ci"
   - "env:fix": "env-doctor --fix"

4. If there's a CI/CD pipeline (GitHub Actions), add an env-doctor check step

5. Create or update .env.example with placeholder values for all environment variables found in the codebase

6. Run env-doctor and fix any issues found

The package documentation is at: https://wolfieeee.github.io/env-doctor/
```

## Detailed Setup Prompt

For a more comprehensive setup with custom configuration:

```text
Set up env-doctor in this project with the following requirements:

1. Install @theaccessibleteam/env-doctor as a dev dependency

2. Analyze the project structure and create an appropriate env-doctor.config.js:
   - Detect the framework (Next.js uses NEXT_PUBLIC_*, Vite uses VITE_*, CRA uses REACT_APP_*)
   - Set srcDir to the main source directory
   - Configure envFiles array with all .env* files in the project
   - Set up custom rules if needed for project-specific patterns

3. Configuration should include:
   ```js
   module.exports = {
     srcDir: './src',
     envFiles: ['.env', '.env.local', '.env.development', '.env.production'],
     framework: 'auto', // auto-detect
     analyzers: {
       missing: true,
       unused: true,
       secrets: true,
       typeMismatch: true,
       syncCheck: true,
     },
     ignore: {
       variables: [], // Add any variables to ignore
       files: ['node_modules/**', 'dist/**', 'build/**'],
     },
   };
   ```

4. Add these npm scripts:
   - "env:check" - Run env-doctor
   - "env:check:ci" - Run in CI mode with SARIF output
   - "env:fix" - Run with auto-fix enabled

5. If GitHub Actions exists, add this workflow step:
   ```yaml
   - name: Check Environment Variables
     run: npx @theaccessibleteam/env-doctor --ci
   ```

6. Create .env.example from detected variables

7. Run the check and report findings
```

## CI/CD Integration Prompt

To add env-doctor to your CI pipeline:

```text
Add env-doctor environment variable checking to the CI/CD pipeline.

1. Create or update GitHub Actions workflow to include:
   - Run env-doctor with --ci flag
   - Output results in SARIF format
   - Upload SARIF to GitHub Code Scanning (if available)
   - Fail the build if critical issues are found

2. Add this job to the workflow:
   ```yaml
   env-check:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with:
           node-version: '20'
       - run: npm ci
       - run: npx @theaccessibleteam/env-doctor --ci --format sarif > env-doctor.sarif
       - uses: github/codeql-action/upload-sarif@v3
         if: always()
         with:
           sarif_file: env-doctor.sarif
   ```

3. Ensure the workflow runs on pull requests and pushes to main
```

## Pre-commit Hook Prompt

To add env-doctor as a pre-commit check:

```text
Set up env-doctor to run as a pre-commit hook.

1. If not already installed, add husky and lint-staged:
   npm install -D husky lint-staged

2. Initialize husky:
   npx husky install

3. Add pre-commit hook:
   npx husky add .husky/pre-commit "npx env-doctor --ci"

4. Alternatively, add to lint-staged in package.json:
   ```json
   "lint-staged": {
     "*.{js,ts,jsx,tsx}": ["eslint --fix"],
     ".env*": ["env-doctor --ci"]
   }
   ```

5. Add prepare script to package.json:
   "prepare": "husky install"
```

---

## Tips for Best Results

- **Be specific**: Mention your framework (Next.js, Vite, etc.) for better configuration
- **Include context**: If you have specific .env files or patterns, mention them
- **Review changes**: Always review the generated configuration before committing

## Need Help?

- [Full Documentation](/docs/getting-started/installation)
- [Configuration Guide](/docs/getting-started/configuration)
- [GitHub Repository](https://github.com/WOLFIEEEE/env-doctor)

