---
sidebar_position: 6
---

# Runtime Validation

The runtime validation library provides type-safe, validated environment variables at application startup. It catches configuration errors before they cause runtime crashes.

## Installation

The runtime library is included in the main package:

```bash
npm install @theaccessibleteam/env-doctor
```

## Basic Usage

Create an `env.ts` file in your project:

```typescript
// src/env.ts
import { createEnv } from '@theaccessibleteam/env-doctor/runtime';

export const env = createEnv({
  server: {
    DATABASE_URL: {
      type: 'url',
      required: true,
      description: 'PostgreSQL connection string',
    },
    PORT: {
      type: 'number',
      default: 3000,
    },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'staging', 'production', 'test'],
      default: 'development',
    },
  },
  client: {
    NEXT_PUBLIC_API_URL: {
      type: 'url',
      required: true,
    },
  },
  framework: 'nextjs',
});
```

Then use it anywhere in your application:

```typescript
import { env } from './env';

// Fully typed!
const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

// TypeScript error: Property 'UNDEFINED_VAR' does not exist
console.log(env.UNDEFINED_VAR);
```

## Supported Types

### String

```typescript
{
  API_KEY: {
    type: 'string',
    required: true,
    enum: ['key1', 'key2'],    // Optional: allowed values
    pattern: /^sk_/,           // Optional: regex pattern
    minLength: 10,             // Optional: minimum length
    maxLength: 100,            // Optional: maximum length
    transform: (v) => v.trim() // Optional: transform function
  }
}
```

### Number

```typescript
{
  PORT: {
    type: 'number',
    default: 3000,
    min: 1,        // Optional: minimum value
    max: 65535,    // Optional: maximum value
    integer: true  // Optional: must be integer
  }
}
```

### Boolean

Accepts: `true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off` (case-insensitive)

```typescript
{
  DEBUG_MODE: {
    type: 'boolean',
    default: false
  }
}
```

### URL

```typescript
{
  DATABASE_URL: {
    type: 'url',
    required: true,
    protocols: ['postgres', 'postgresql'] // Optional: allowed protocols
  }
}
```

### Email

```typescript
{
  ADMIN_EMAIL: {
    type: 'email',
    required: true
  }
}
```

### JSON

```typescript
{
  FEATURE_FLAGS: {
    type: 'json',
    default: {}
  }
}
```

### Array

```typescript
{
  ALLOWED_ORIGINS: {
    type: 'array',
    separator: ',',      // Default: ','
    itemType: 'string',  // 'string' | 'number'
    minItems: 1,
    maxItems: 10,
    default: ['http://localhost:3000']
  }
}
```

## Framework Integration

### Next.js

```typescript
// src/env.ts
export const env = createEnv({
  server: {
    DATABASE_URL: { type: 'url', required: true },
  },
  client: {
    NEXT_PUBLIC_API_URL: { type: 'url', required: true },
  },
  framework: 'nextjs',
});

// next.config.js - validate at build time
import './src/env';

export default {
  // ... config
};
```

In server components:
```typescript
import { env } from '@/env';
const db = connectToDatabase(env.DATABASE_URL);
```

In client components:
```typescript
import { env } from '@/env';
// Only NEXT_PUBLIC_* variables are accessible
fetch(env.NEXT_PUBLIC_API_URL);
```

### Vite

```typescript
export const env = createEnv({
  server: {
    API_SECRET: { type: 'string', required: true },
  },
  client: {
    VITE_API_URL: { type: 'url', required: true },
  },
  framework: 'vite',
});
```

## Error Handling

When validation fails, env-doctor shows clear error messages:

```
🔴 env-doctor: Environment validation failed!

Missing required variables:
  ✗ DATABASE_URL
    PostgreSQL connection string
    Expected: valid URL starting with postgres://

Invalid variables:
  ✗ PORT = "not-a-number"
    Expected: number between 1 and 65535

Hint: Create a .env file with the required variables.
Run `npx env-doctor init` to generate a template.
```

### Custom Error Handling

```typescript
export const env = createEnv({
  // ... schema ...
  
  onValidationError: (errors) => {
    // Custom error handling
    errors.forEach(error => {
      Sentry.captureException(new Error(`Env: ${error.message}`));
    });
    
    // Default behavior: exit
    process.exit(1);
  },
});
```

## Testing Support

```typescript
import { mockEnv } from '@theaccessibleteam/env-doctor/runtime';

describe('MyService', () => {
  beforeEach(() => {
    mockEnv({
      DATABASE_URL: 'postgres://localhost/test',
      PORT: 3001,
    });
  });

  afterEach(() => {
    mockEnv.restore();
  });

  it('should connect to database', () => {
    // env.DATABASE_URL returns mocked value
  });
});
```

## Schema Generation

Generate the runtime schema from your config:

```bash
npx env-doctor generate:schema --output src/env.ts
```

This creates a fully typed schema based on your `env-doctor.config.js`.

## Type Inference

The `createEnv` function provides full TypeScript type inference:

```typescript
const env = createEnv({
  server: {
    PORT: { type: 'number', default: 3000 },
    DEBUG: { type: 'boolean', default: false },
    TAGS: { type: 'array', itemType: 'string' },
  },
});

// Types are inferred:
// env.PORT: number
// env.DEBUG: boolean
// env.TAGS: string[]
```

## Best Practices

1. **Create a single `env.ts` file** - Centralize all env var definitions
2. **Validate at startup** - Import in your entry point
3. **Use descriptive error messages** - Add `description` to required vars
4. **Set sensible defaults** - For optional variables
5. **Separate client/server** - Prevent accidental secret exposure

