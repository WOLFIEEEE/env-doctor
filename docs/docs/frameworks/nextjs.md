---
sidebar_position: 1
---

# Next.js

env-doctor has first-class support for Next.js applications.

## Auto-Detection

env-doctor automatically detects Next.js projects by:
- `next.config.js`, `next.config.mjs`, or `next.config.ts`
- `next` in `package.json` dependencies

## Client vs Server Variables

Next.js uses the `NEXT_PUBLIC_` prefix to expose variables to the browser:

```bash
# Server-only (never sent to browser)
DATABASE_URL=postgres://...
API_SECRET=secret123

# Client-accessible (bundled into JavaScript)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GA_ID=UA-12345678
```

### Validation Rules

env-doctor warns when:
- Client-side code accesses non-`NEXT_PUBLIC_` variables
- Server-side secrets use `NEXT_PUBLIC_` prefix (security risk)

```bash
⚠ Framework Convention Warning

  DATABASE_URL
    Variable is used in client component but doesn't have NEXT_PUBLIC_ prefix
    at app/components/DataView.tsx:5
```

## Environment Files

Next.js loads env files in this order:

| File | Loaded When | Commit? |
|------|-------------|---------|
| `.env` | Always | Yes |
| `.env.local` | Always (except test) | No |
| `.env.development` | `next dev` | Yes |
| `.env.development.local` | `next dev` | No |
| `.env.production` | `next build` | Yes |
| `.env.production.local` | `next build` | No |
| `.env.test` | `NODE_ENV=test` | Yes |
| `.env.test.local` | `NODE_ENV=test` | No |

### Configuration

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
  framework: 'nextjs'
};
```

Or target specific environment:

```bash
npx env-doctor --env production
```

## Auto-Ignored Variables

These Next.js/Vercel variables are automatically ignored:

- `NEXT_TELEMETRY_DISABLED`
- `NEXT_RUNTIME`
- `VERCEL`
- `VERCEL_ENV`
- `VERCEL_URL`
- `VERCEL_REGION`

## App Router vs Pages Router

### App Router

```tsx
// app/page.tsx (Server Component)
export default function Page() {
  // ✅ Server-only - works fine
  const dbUrl = process.env.DATABASE_URL;
  
  return <div>...</div>;
}

// app/components/ClientComponent.tsx
'use client';

export default function ClientComponent() {
  // ✅ Correct - uses NEXT_PUBLIC_
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // ❌ Warning - won't work in browser
  const secret = process.env.API_SECRET;
  
  return <div>...</div>;
}
```

### Pages Router

```tsx
// pages/index.tsx
export default function Page({ data }) {
  // ✅ Correct - client-side access
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  return <div>...</div>;
}

export async function getServerSideProps() {
  // ✅ Server-only - works fine
  const dbUrl = process.env.DATABASE_URL;
  
  return { props: { data: await fetchData(dbUrl) } };
}
```

## Common Issues

### Missing NEXT_PUBLIC_ Prefix

**Problem:** Variable not available in browser.

```tsx
// ❌ Won't work
const apiUrl = process.env.API_URL;
```

**Fix:** Add the prefix.

```bash
# .env
NEXT_PUBLIC_API_URL=https://api.example.com
```

```tsx
// ✅ Works
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### Exposing Secrets

**Problem:** Secret accessible in browser.

```bash
# ❌ Security risk
NEXT_PUBLIC_DATABASE_URL=postgres://user:pass@host/db
```

**Fix:** Remove prefix, access server-side only.

```bash
# ✅ Safe
DATABASE_URL=postgres://user:pass@host/db
```

### Runtime vs Build-time

Next.js inlines `NEXT_PUBLIC_` values at build time. For runtime configuration:

```typescript
// next.config.js
module.exports = {
  publicRuntimeConfig: {
    apiUrl: process.env.API_URL
  }
};

// Usage
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const apiUrl = publicRuntimeConfig.apiUrl;
```

## Example Configuration

```javascript
// env-doctor.config.js
module.exports = {
  envFiles: ['.env', '.env.local'],
  templateFile: '.env.example',
  include: [
    'app/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}'
  ],
  exclude: [
    'node_modules',
    '.next',
    '**/*.test.*'
  ],
  framework: 'nextjs',
  variables: {
    DATABASE_URL: {
      required: true,
      secret: true,
      pattern: /^postgres:\/\//
    },
    NEXT_PUBLIC_API_URL: {
      required: true,
      type: 'url'
    }
  }
};
```

