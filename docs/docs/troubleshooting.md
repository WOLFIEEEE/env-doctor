---
sidebar_position: 9
title: Troubleshooting
description: Common issues and solutions for env-doctor
---

# Troubleshooting Guide

This guide covers common issues you might encounter when using env-doctor and how to resolve them.

## Variable Not Being Detected

### Problem: A variable I use in code isn't being detected

**Possible causes:**

1. **File not being scanned**
   
   Check that your source directory is correctly configured:
   ```js
   module.exports = {
     srcDir: './src', // Make sure this points to your source code
   };
   ```

2. **File pattern not matched**
   
   By default, env-doctor scans `.js`, `.ts`, `.jsx`, `.tsx` files. If you have custom extensions, add them:
   ```js
   module.exports = {
     include: ['**/*.js', '**/*.ts', '**/*.mjs'],
   };
   ```

3. **Dynamic variable access**
   
   env-doctor uses static analysis. Dynamic access patterns aren't detected:
   ```js
   // ❌ Not detected
   const key = 'DATABASE_URL';
   process.env[key];
   
   // ✅ Detected
   process.env.DATABASE_URL;
   ```

4. **Non-standard access patterns**
   
   env-doctor detects these patterns:
   ```js
   // ✅ Detected
   process.env.VAR_NAME
   process.env['VAR_NAME']
   import.meta.env.VITE_VAR
   
   // ❌ Not detected
   const { VAR_NAME } = process.env; // Destructuring
   ```

### Problem: Variables in a specific file aren't being found

**Solution:** Check if the file is being excluded:

```js
module.exports = {
  ignore: {
    files: [
      // Remove or adjust patterns that might exclude your file
      '**/*.config.js',
    ],
  },
};
```

Run with verbose output to see which files are scanned:
```bash
npx env-doctor --verbose
```

---

## False Positives

### Problem: env-doctor reports a variable as missing, but it exists

**Possible causes:**

1. **Wrong .env file configured**
   
   Ensure all your .env files are listed:
   ```js
   module.exports = {
     envFiles: [
       '.env',
       '.env.local',
       '.env.development',
       '.env.production',
     ],
   };
   ```

2. **Variable defined in a different environment file**
   
   If a variable is only in `.env.production`, it will show as missing when scanning `.env.local`. This is expected behavior - consider adding it to `.env.example`.

### Problem: A variable is reported as unused but I do use it

**Possible causes:**

1. **Used in non-scanned files**
   
   The variable might be used in files outside `srcDir` or in excluded files.

2. **Used dynamically**
   
   Dynamic access isn't detected (see above).

**Solution:** Ignore the variable:
```js
module.exports = {
  ignore: {
    variables: ['MY_UNUSED_VAR'],
  },
};
```

### Problem: Secret detection has false positives

**Solution:** If a variable is incorrectly flagged as a secret:

```js
module.exports = {
  ignore: {
    variables: ['NOT_A_SECRET_VAR'],
  },
  analyzers: {
    secrets: {
      // Or disable specific patterns
      patterns: {
        'aws-access-key': false,
      },
    },
  },
};
```

---

## CI/CD Issues

### Problem: CI fails but works locally

**Common causes:**

1. **Different .env files**
   
   CI environments often don't have `.env.local` files. Ensure your CI has the necessary environment variables set, or use `.env.example` for validation:
   ```bash
   npx env-doctor --env-file .env.example
   ```

2. **Missing dependencies**
   
   Ensure env-doctor is installed:
   ```yaml
   - run: npm ci  # Install dependencies first
   - run: npx env-doctor --ci
   ```

3. **Exit code handling**
   
   In CI mode, env-doctor exits with code 1 for errors. Add `|| true` to continue on warnings:
   ```yaml
   - run: npx env-doctor --ci || true
   ```

### Problem: SARIF upload fails

**Solution:** Ensure the SARIF file is generated before upload:

```yaml
- name: Run env-doctor
  run: npx env-doctor --ci --format sarif > results.sarif
  continue-on-error: true  # Don't fail if issues found

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  if: always()  # Upload even if previous step failed
  with:
    sarif_file: results.sarif
```

---

## Performance Issues

### Problem: env-doctor is slow on large codebases

**Solutions:**

1. **Narrow the scan scope**
   ```js
   module.exports = {
     srcDir: './src',  // Don't scan the entire repo
     ignore: {
       files: [
         'node_modules/**',
         'dist/**',
         'build/**',
         '**/*.test.ts',
         '**/*.spec.ts',
         '**/__tests__/**',
       ],
     },
   };
   ```

2. **Disable unused analyzers**
   ```js
   module.exports = {
     analyzers: {
       missing: true,
       unused: false,     // Disable if not needed
       secrets: true,
       typeMismatch: false,
       syncCheck: false,
     },
   };
   ```

3. **Use caching in CI**
   ```yaml
   - uses: actions/cache@v4
     with:
       path: node_modules
       key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
   ```

---

## Common Error Messages

### `Error: No .env files found`

**Cause:** env-doctor couldn't find any environment files.

**Solution:** 
- Create a `.env` or `.env.example` file
- Or specify the path explicitly:
  ```js
  module.exports = {
    envFiles: ['./config/.env'],
  };
  ```

### `Error: Could not parse configuration file`

**Cause:** Syntax error in `env-doctor.config.js`.

**Solution:** Check your config file for JavaScript errors:
```bash
node -c env-doctor.config.js
```

### `Error: srcDir does not exist`

**Cause:** The configured source directory doesn't exist.

**Solution:** Update your config to point to an existing directory:
```js
module.exports = {
  srcDir: './src',  // Make sure this directory exists
};
```

### `Warning: Framework could not be auto-detected`

**Cause:** env-doctor couldn't identify your framework.

**Solution:** Specify the framework manually:
```js
module.exports = {
  framework: 'nextjs', // or 'vite', 'cra', 'node'
};
```

---

## Getting More Help

If you're still having issues:

1. **Run with verbose output:**
   ```bash
   npx env-doctor --verbose
   ```

2. **Check the version:**
   ```bash
   npx env-doctor --version
   ```

3. **Open an issue on GitHub** with:
   - env-doctor version
   - Node.js version
   - Your configuration file
   - The error message or unexpected behavior
   - Steps to reproduce

[Open an Issue](https://github.com/WOLFIEEEE/env-doctor/issues/new)

