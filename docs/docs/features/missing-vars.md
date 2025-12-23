---
sidebar_position: 1
---

# Missing Variable Detection

Detect environment variables that are used in your code but not defined in your `.env` files.

## How It Works

env-doctor scans your source code for `process.env` access patterns:

```typescript
// Direct access
const apiKey = process.env.API_KEY;

// Bracket notation
const url = process.env['DATABASE_URL'];

// Destructuring
const { SECRET_KEY } = process.env;

// With fallback
const port = process.env.PORT || 3000;
```

It then compares these with your `.env` files to find missing variables.

## Example Output

```bash
✗ Missing Variables (2 issues)

  DATABASE_URL
    Variable "DATABASE_URL" is used in code but not defined in any .env file
    at src/lib/db.ts:5

  API_SECRET
    Required variable "API_SECRET" is not defined in any .env file
```

## Severity Levels

| Severity | Condition |
|----------|-----------|
| **Error** | Variable is marked as `required` in config |
| **Warning** | Variable is used but not defined |

## Configuration

### Marking Variables as Required

```javascript
// env-doctor.config.js
module.exports = {
  variables: {
    DATABASE_URL: {
      required: true  // Will be an error if missing
    },
    OPTIONAL_VAR: {
      required: false  // Will be a warning if missing
    }
  }
};
```

### Providing Defaults

Variables with defaults won't be reported as missing:

```javascript
variables: {
  PORT: {
    default: 3000  // Won't report as missing
  }
}
```

### Ignoring Variables

Ignore specific variables or patterns:

```javascript
ignore: [
  'LEGACY_*',           // Ignore all LEGACY_ variables
  'missing:OPTIONAL_*', // Ignore missing for OPTIONAL_ variables
]
```

## Framework Considerations

### Next.js

Client-side variables must use `NEXT_PUBLIC_` prefix:

```typescript
// Server-side only
const secret = process.env.DATABASE_URL;

// Client-side accessible
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### Vite

Client-side variables use `VITE_` prefix:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Fixing Missing Variables

### Interactive Fix

```bash
npx env-doctor fix
```

This prompts you to:
1. Add the variable to `.env`
2. Add to ignore list
3. Skip

### Manual Fix

Add the missing variable to your `.env` file:

```bash
# .env
DATABASE_URL=postgres://localhost:5432/mydb
```

### Update .env.example

Keep your template in sync:

```bash
npx env-doctor init --example-only
```

## Dynamic Access Patterns

env-doctor detects dynamic access but can't determine the variable name:

```typescript
// This triggers a warning
const key = getConfigKey();
const value = process.env[key];  // Dynamic access
```

Output:

```bash
⚠ Dynamic Access (1 issue)

  <dynamic>
    Dynamic environment variable access detected
    at src/config.ts:15
```

## Best Practices

1. **Define all variables in `.env.example`** - Document what's needed
2. **Mark critical variables as required** - Catch missing early
3. **Use defaults where appropriate** - Reduce configuration burden
4. **Review dynamic access warnings** - Consider if they can be made static

