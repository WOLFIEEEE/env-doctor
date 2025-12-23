---
sidebar_position: 2
---

# Vite

env-doctor supports Vite projects with `import.meta.env` detection.

## Auto-Detection

env-doctor detects Vite projects by:
- `vite.config.js`, `vite.config.ts`, or `vite.config.mjs`
- `vite` in `package.json` dependencies

## Client-Side Variables

Vite uses the `VITE_` prefix for client-accessible variables:

```bash
# Server-only (not exposed)
DATABASE_URL=postgres://...
API_SECRET=secret123

# Client-accessible (bundled into JavaScript)
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App
```

## Access Patterns

Vite uses `import.meta.env` instead of `process.env`:

```typescript
// ✅ Vite pattern
const apiUrl = import.meta.env.VITE_API_URL;

// Built-in variables
const mode = import.meta.env.MODE;        // 'development' | 'production'
const dev = import.meta.env.DEV;          // true in dev
const prod = import.meta.env.PROD;        // true in prod
const ssr = import.meta.env.SSR;          // true during SSR
const baseUrl = import.meta.env.BASE_URL; // base URL
```

env-doctor detects both patterns:
- `import.meta.env.VITE_*`
- `process.env.VITE_*` (for SSR/Node contexts)

## Environment Files

Vite loads env files in this order:

| File | Loaded When | Commit? |
|------|-------------|---------|
| `.env` | Always | Yes |
| `.env.local` | Always (gitignored) | No |
| `.env.[mode]` | Specific mode | Yes |
| `.env.[mode].local` | Specific mode | No |

Mode defaults to `development` for `vite dev` and `production` for `vite build`.

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
  include: ['src/**/*.{ts,tsx,js,jsx,vue,svelte}'],
  framework: 'vite'
};
```

## TypeScript Support

Vite provides type definitions for `import.meta.env`:

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

env-doctor doesn't validate against these types yet, but you can use config:

```javascript
variables: {
  VITE_API_URL: {
    required: true,
    type: 'url'
  }
}
```

## Common Issues

### Missing VITE_ Prefix

**Problem:** Variable not available in browser.

```typescript
// ❌ Won't work - not exposed
const secret = import.meta.env.API_SECRET;
```

**Fix:** Add the prefix (if safe to expose).

```bash
VITE_API_KEY=abc123
```

### Exposing Secrets

**Problem:** Secret bundled into client.

```bash
# ❌ Security risk
VITE_DATABASE_URL=postgres://user:pass@host/db
```

**Fix:** Don't use VITE_ prefix for secrets.

```bash
# ✅ Safe - not exposed
DATABASE_URL=postgres://user:pass@host/db
```

### SSR Considerations

In SSR mode, you can access non-`VITE_` variables server-side:

```typescript
// Server-side only (SSR)
if (import.meta.env.SSR) {
  const dbUrl = process.env.DATABASE_URL;
}
```

## Example Configuration

```javascript
// env-doctor.config.js
module.exports = {
  envFiles: ['.env', '.env.local'],
  templateFile: '.env.example',
  include: [
    'src/**/*.{ts,tsx,js,jsx}',
    'src/**/*.vue',
    'src/**/*.svelte'
  ],
  exclude: ['node_modules', 'dist'],
  framework: 'vite',
  variables: {
    VITE_API_URL: {
      required: true,
      type: 'url'
    },
    VITE_APP_TITLE: {
      required: true
    },
    DATABASE_URL: {
      required: true,
      secret: true
    }
  }
};
```

