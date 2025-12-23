---
sidebar_position: 3
---

# Type Checking

Detect type mismatches between how variables are used and their actual values.

## How It Works

env-doctor infers expected types from how variables are used in code:

```typescript
// Inferred as number
const port = parseInt(process.env.PORT, 10);

// Inferred as boolean
const debug = process.env.DEBUG === 'true';

// Inferred as JSON
const config = JSON.parse(process.env.CONFIG);

// Inferred as array
const hosts = process.env.HOSTS.split(',');
```

Then it validates the actual values match.

## Example Output

```bash
⚠ Type Mismatches (2 issues)

  PORT
    Variable "PORT" is used as a number at src/server.ts:5
    but value "three thousand" is not numeric
    at .env:3

  CONFIG
    Variable "CONFIG" is parsed as JSON at src/config.ts:12
    but value is not valid JSON
    at .env:8
```

## Explicit Type Rules

Define expected types in your config:

```javascript
// env-doctor.config.js
module.exports = {
  variables: {
    PORT: {
      type: 'number'
    },
    DEBUG: {
      type: 'boolean'
    },
    API_URL: {
      type: 'url'
    },
    ADMIN_EMAIL: {
      type: 'email'
    },
    CONFIG: {
      type: 'json'
    }
  }
};
```

## Supported Types

| Type | Valid Values | Example |
|------|--------------|---------|
| `string` | Any string | `hello world` |
| `number` | Numeric strings | `3000`, `3.14`, `-42` |
| `boolean` | `true`, `false`, `1`, `0`, `yes`, `no` | `true` |
| `json` | Valid JSON | `{"key": "value"}` |
| `url` | Valid URL | `https://example.com` |
| `email` | Valid email | `user@example.com` |

## Pattern Validation

Use regex patterns for custom validation:

```javascript
variables: {
  DATABASE_URL: {
    pattern: /^postgres:\/\//
  },
  AWS_REGION: {
    pattern: /^[a-z]{2}-[a-z]+-\d$/
  }
}
```

## Enum Validation

Restrict to specific values:

```javascript
variables: {
  NODE_ENV: {
    enum: ['development', 'production', 'test']
  },
  LOG_LEVEL: {
    enum: ['debug', 'info', 'warn', 'error']
  }
}
```

## Auto-Inference

env-doctor infers types from common patterns:

| Code Pattern | Inferred Type |
|--------------|---------------|
| `parseInt(process.env.X)` | number |
| `parseFloat(process.env.X)` | number |
| `Number(process.env.X)` | number |
| `process.env.X === 'true'` | boolean |
| `JSON.parse(process.env.X)` | json |
| `process.env.X.split(',')` | array |

## Fixing Type Issues

### Wrong Value

Update the `.env` value:

```bash
# Before
PORT=three thousand

# After
PORT=3000
```

### Missing Validation

Add validation in your code:

```typescript
const port = parseInt(process.env.PORT || '3000', 10);
if (isNaN(port)) {
  throw new Error('PORT must be a number');
}
```

### False Positive

If the type inference is wrong, ignore it:

```javascript
ignore: ['type-mismatch:MY_VAR']
```

## Best Practices

1. **Define types explicitly** - Don't rely on inference alone
2. **Add runtime validation** - env-doctor catches issues early, but validate at runtime too
3. **Use enums for limited values** - Prevents typos
4. **Document expected formats** - Add descriptions to your config

