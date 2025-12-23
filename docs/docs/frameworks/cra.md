---
sidebar_position: 3
---

# Create React App

env-doctor supports Create React App (CRA) projects.

## Auto-Detection

env-doctor detects CRA projects by:
- `react-scripts` in `package.json` dependencies

## Client-Side Variables

CRA uses the `REACT_APP_` prefix for client-accessible variables:

```bash
# Not exposed (CRA ignores these)
DATABASE_URL=postgres://...
API_SECRET=secret123

# Client-accessible (bundled into JavaScript)
REACT_APP_API_URL=https://api.example.com
REACT_APP_TITLE=My App
```

## Access Pattern

CRA uses `process.env` with the `REACT_APP_` prefix:

```typescript
// ✅ CRA pattern
const apiUrl = process.env.REACT_APP_API_URL;

// Built-in variables
const nodeEnv = process.env.NODE_ENV;  // 'development' | 'production' | 'test'
const publicUrl = process.env.PUBLIC_URL;  // Public URL for assets
```

## Environment Files

CRA loads env files in this order (later files override):

| File | Loaded When | Commit? |
|------|-------------|---------|
| `.env` | Always | Yes |
| `.env.local` | Always (except test) | No |
| `.env.development` | `npm start` | Yes |
| `.env.development.local` | `npm start` | No |
| `.env.production` | `npm run build` | Yes |
| `.env.production.local` | `npm run build` | No |
| `.env.test` | `npm test` | Yes |
| `.env.test.local` | `npm test` | No |

## Configuration

```javascript
// env-doctor.config.js
module.exports = {
  envFiles: [
    '.env',
    '.env.local',
    '.env.development',
    '.env.development.local'
  ],
  templateFile: '.env.example',
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  framework: 'cra'
};
```

## Auto-Ignored Variables

These CRA variables are automatically ignored as unused:

- `BROWSER` - Which browser to open
- `GENERATE_SOURCEMAP` - Source map generation
- `CI` - CI environment flag

## TypeScript Support

For TypeScript projects, define your env types:

```typescript
// src/react-app-env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_API_URL: string;
    REACT_APP_TITLE: string;
  }
}
```

## Common Issues

### Missing REACT_APP_ Prefix

**Problem:** Variable not available in browser.

```typescript
// ❌ Won't work - not exposed
const secret = process.env.API_SECRET;  // undefined
```

**Fix:** Add the prefix.

```bash
REACT_APP_API_KEY=abc123
```

### Exposing Secrets

**Problem:** Secret bundled into client.

```bash
# ❌ Security risk - visible in browser
REACT_APP_DATABASE_URL=postgres://user:pass@host/db
```

**Fix:** Don't expose secrets. Use a backend API instead.

### Build-Time Inlining

CRA inlines env variables at build time. They're not read at runtime:

```bash
# Value at BUILD time is used, not runtime
REACT_APP_API_URL=https://api.example.com
```

For runtime configuration, use a different approach:

```typescript
// public/config.js (loaded at runtime)
window.ENV = {
  API_URL: 'https://api.example.com'
};

// Usage
const apiUrl = window.ENV.API_URL;
```

### Testing

In tests, CRA uses `.env.test`:

```bash
# .env.test
REACT_APP_API_URL=http://localhost:3001
```

## Example Configuration

```javascript
// env-doctor.config.js
module.exports = {
  envFiles: ['.env', '.env.local'],
  templateFile: '.env.example',
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['node_modules', 'build'],
  framework: 'cra',
  variables: {
    REACT_APP_API_URL: {
      required: true,
      type: 'url'
    },
    REACT_APP_TITLE: {
      required: true
    }
  },
  ignore: [
    'BROWSER',
    'GENERATE_SOURCEMAP'
  ]
};
```

## Migrating from CRA

If you're migrating to Vite or Next.js:

| CRA | Vite | Next.js |
|-----|------|---------|
| `REACT_APP_*` | `VITE_*` | `NEXT_PUBLIC_*` |
| `process.env.REACT_APP_*` | `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |

env-doctor can help identify which variables need prefix changes during migration.

