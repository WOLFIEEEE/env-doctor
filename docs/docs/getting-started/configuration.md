---
sidebar_position: 3
---

# Configuration

Customize env-doctor behavior with a configuration file.

## Config File

Create `env-doctor.config.js` in your project root:

```javascript
// env-doctor.config.js
module.exports = {
  // Which env files to check
  envFiles: ['.env', '.env.local'],

  // Compare against this template
  templateFile: '.env.example',

  // Where to scan for usage
  include: ['src/**/*.{ts,js,tsx,jsx}', 'app/**/*.{ts,js,tsx,jsx}'],
  exclude: ['node_modules', 'dist', '**/*.test.*'],

  // Framework (auto-detected by default)
  framework: 'auto',

  // Variable-specific rules
  variables: {
    DATABASE_URL: {
      required: true,
      secret: true,
      pattern: /^postgres:\/\//
    },
    PORT: {
      type: 'number',
      default: 3000
    },
    NODE_ENV: {
      enum: ['development', 'production', 'test']
    }
  },

  // Ignore specific issues
  ignore: [
    'LEGACY_*',        // Ignore by pattern
    'unused:DEBUG',    // Ignore specific rule
  ],

  // Treat warnings as errors
  strict: false,
};
```

## Config File Locations

env-doctor searches for config in this order:

1. `env-doctor.config.js`
2. `env-doctor.config.mjs`
3. `env-doctor.config.cjs`
4. `.env-doctor.config.js`
5. `env-doctor.config.json`
6. `.env-doctorrc`
7. `package.json` `"env-doctor"` key

## Configuration Options

### `envFiles`

Array of `.env` files to parse. Later files override earlier ones.

```javascript
envFiles: ['.env', '.env.local', '.env.development.local']
```

### `templateFile`

Template file to compare against for sync checking.

```javascript
templateFile: '.env.example'
```

### `include`

Glob patterns for files to scan for `process.env` usage.

```javascript
include: [
  'src/**/*.{ts,js,tsx,jsx}',
  'app/**/*.{ts,js,tsx,jsx}',
  'pages/**/*.{ts,js,tsx,jsx}'
]
```

### `exclude`

Glob patterns to exclude from scanning.

```javascript
exclude: [
  'node_modules',
  'dist',
  'build',
  '.next',
  '**/*.test.*',
  '**/*.spec.*'
]
```

### `framework`

Framework for applying specific rules. Options:
- `'auto'` - Auto-detect (default)
- `'nextjs'` - Next.js
- `'vite'` - Vite
- `'cra'` - Create React App
- `'node'` - Plain Node.js

```javascript
framework: 'nextjs'
```

### `variables`

Per-variable rules for validation.

```javascript
variables: {
  DATABASE_URL: {
    required: true,      // Must be defined
    secret: true,        // Redact in output
    pattern: /^postgres/ // Must match pattern
  },
  PORT: {
    type: 'number',      // Validate type
    default: 3000        // Default if missing
  },
  LOG_LEVEL: {
    enum: ['debug', 'info', 'warn', 'error']
  },
  API_URL: {
    type: 'url',         // Validate URL format
    description: 'Backend API endpoint'
  }
}
```

#### Variable Rule Properties

| Property | Type | Description |
|----------|------|-------------|
| `required` | `boolean` | Variable must be defined |
| `secret` | `boolean` | Mark as sensitive |
| `type` | `string` | Expected type: `'string'`, `'number'`, `'boolean'`, `'json'`, `'url'`, `'email'` |
| `pattern` | `RegExp` | Regex pattern to match |
| `default` | `any` | Default value if not defined |
| `enum` | `string[]` | Allowed values |
| `description` | `string` | Documentation |

### `ignore`

Patterns for issues to ignore.

```javascript
ignore: [
  'LEGACY_*',           // Ignore all LEGACY_ variables
  'unused:DEBUG',       // Ignore unused DEBUG variable
  'missing:OPTIONAL_*', // Ignore missing OPTIONAL_ variables
]
```

Ignore patterns can be:
- `PATTERN` - Ignore variable matching pattern for all rules
- `rule:PATTERN` - Ignore specific rule for matching variables

### `strict`

Treat warnings as errors (useful for CI).

```javascript
strict: true
```

### `secretPatterns`

Additional regex patterns for secret detection.

```javascript
secretPatterns: [
  /^MY_COMPANY_SECRET/,
  /^INTERNAL_TOKEN/
]
```

## Environment-Specific Config

Target specific environments with `--env`:

```bash
env-doctor --env production
```

This changes which `.env` files are checked:

| Environment | Files Checked |
|-------------|---------------|
| `development` | `.env`, `.env.local`, `.env.development`, `.env.development.local` |
| `production` | `.env`, `.env.production`, `.env.production.local` |
| `test` | `.env`, `.env.test`, `.env.test.local` |

## Config in package.json

You can also configure env-doctor in `package.json`:

```json
{
  "env-doctor": {
    "envFiles": [".env", ".env.local"],
    "templateFile": ".env.example",
    "framework": "nextjs",
    "strict": true
  }
}
```

## TypeScript Support

For TypeScript config files, use `.mjs` extension:

```javascript
// env-doctor.config.mjs
/** @type {import('env-doctor').EnvDoctorConfig} */
export default {
  envFiles: ['.env'],
  framework: 'nextjs',
};
```

## Next Steps

- [CLI Reference](/docs/cli-reference) - All commands and options
- [Framework Support](/docs/frameworks/nextjs) - Framework-specific configuration

