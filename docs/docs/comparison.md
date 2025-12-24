---
sidebar_position: 15
---

# Comparison with Alternatives

env-doctor combines static analysis, runtime validation, and IDE integration into a single tool. Here's how it compares to other popular options.

## Feature Comparison Matrix

| Feature | env-doctor | dotenv-linter | envalid | t3-env | dotenv-vault |
|---------|------------|---------------|---------|--------|--------------|
| **Static Analysis** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Runtime Validation** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **TypeScript Types** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **VS Code Extension** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Multi-Environment** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Monorepo Support** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Auto-fix** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Git History Scan** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Sync .env.example** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **CI/CD Integration** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **SARIF Output** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Framework Detection** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Secret Detection** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **License** | MIT | MIT | MIT | MIT | Proprietary |

## When to Use Each Tool

### env-doctor

**Best for:**
- Teams who want both static analysis AND runtime validation
- Monorepo projects with shared environment variables
- Projects requiring multi-environment management
- Developers who want IDE integration
- CI/CD pipelines with SARIF reporting

```bash
# One tool for everything
npx @theaccessibleteam/env-doctor
npx @theaccessibleteam/env-doctor matrix
npx @theaccessibleteam/env-doctor sync
```

### dotenv-linter

**Best for:**
- Simple linting of `.env` file syntax
- Rust-based projects (it's written in Rust)
- Quick syntax validation

```bash
dotenv-linter .env
```

**Limitations:**
- No code analysis (doesn't scan your codebase)
- No TypeScript integration
- No IDE support

### envalid

**Best for:**
- Runtime-only validation
- Existing projects that need quick type safety
- Simple validation without build-time checks

```typescript
import { cleanEnv, str, num } from 'envalid';

const env = cleanEnv(process.env, {
  DATABASE_URL: str(),
  PORT: num({ default: 3000 }),
});
```

**Limitations:**
- No static analysis (issues found at runtime only)
- No IDE integration
- No multi-environment support

### t3-env

**Best for:**
- Next.js projects using the T3 stack
- Zod-based validation
- Server/client separation

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
});
```

**Limitations:**
- Next.js focused (less suitable for other frameworks)
- No static analysis
- No IDE integration
- No multi-environment support

### dotenv-vault

**Best for:**
- Centralized secret management
- Team secret sharing
- Encrypted `.env` files

**Limitations:**
- Proprietary (paid service)
- No code analysis
- No TypeScript types

## Migration Guides

### From envalid to env-doctor

**Before (envalid):**

```typescript
import { cleanEnv, str, num, bool, url } from 'envalid';

const env = cleanEnv(process.env, {
  DATABASE_URL: url(),
  PORT: num({ default: 3000 }),
  DEBUG: bool({ default: false }),
  API_KEY: str(),
});
```

**After (env-doctor):**

```typescript
import { createEnv } from '@theaccessibleteam/env-doctor/runtime';

export const env = createEnv({
  server: {
    DATABASE_URL: { type: 'url', required: true },
    PORT: { type: 'number', default: 3000 },
    DEBUG: { type: 'boolean', default: false },
    API_KEY: { type: 'string', required: true },
  },
});
```

**Benefits gained:**
- Static analysis to catch issues before runtime
- VS Code integration
- Multi-environment support
- `.env.example` sync

### From t3-env to env-doctor

**Before (t3-env):**

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
});
```

**After (env-doctor):**

```typescript
import { createEnv } from '@theaccessibleteam/env-doctor/runtime';

export const env = createEnv({
  server: {
    DATABASE_URL: { type: 'url', required: true },
  },
  client: {
    NEXT_PUBLIC_API_URL: { type: 'url', required: true },
  },
  framework: 'nextjs',
});
```

**Benefits gained:**
- No need to specify `runtimeEnv` manually
- Static analysis to find unused/missing variables
- Monorepo support
- Multi-environment matrix

## Using env-doctor with Other Tools

env-doctor works alongside other tools:

### With dotenv

```typescript
// dotenv loads the variables
import 'dotenv/config';

// env-doctor validates and types them
import { createEnv } from '@theaccessibleteam/env-doctor/runtime';

export const env = createEnv({
  server: {
    DATABASE_URL: { type: 'url', required: true },
  },
});
```

### With Zod (Custom Validation)

```typescript
import { z } from 'zod';
import { createEnv } from '@theaccessibleteam/env-doctor/runtime';

// Use env-doctor for basic validation + static analysis
export const env = createEnv({
  server: {
    COMPLEX_CONFIG: { type: 'json', required: true },
  },
});

// Add custom Zod validation for complex types
const configSchema = z.object({
  maxRetries: z.number(),
  timeout: z.number(),
});

export const config = configSchema.parse(JSON.parse(env.COMPLEX_CONFIG));
```

## Summary

| If you need... | Use |
|----------------|-----|
| Static + Runtime + IDE | **env-doctor** |
| Just runtime validation | envalid or t3-env |
| Just .env linting | dotenv-linter |
| Managed secrets | dotenv-vault |
| Next.js + Zod | t3-env (or env-doctor) |
| Monorepos | **env-doctor** |
| Multi-environment | **env-doctor** |

---

**Ready to get started?**

```bash
npx @theaccessibleteam/env-doctor init
```

[View Installation Guide →](/docs/getting-started/installation)

