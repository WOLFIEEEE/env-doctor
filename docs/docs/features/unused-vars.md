---
sidebar_position: 2
---

# Unused Variable Detection

Find environment variables defined in `.env` files but never used in your codebase.

## How It Works

env-doctor compares variables defined in your `.env` files against actual usage in your source code.

## Example Output

```bash
⚠ Unused Variables (2 issues)

  OLD_API_KEY
    Variable "OLD_API_KEY" is defined in .env but never used in code
    at .env:15

  DEPRECATED_URL
    Variable "DEPRECATED_URL" is defined in .env but never used in code
    at .env:23
```

## Common Causes

1. **Deprecated variables** - Old config that's no longer needed
2. **Typos** - Variable name doesn't match usage
3. **Framework variables** - Used by the runtime, not your code
4. **Build-time variables** - Used by build tools, not source code

## Auto-Ignored Variables

env-doctor automatically ignores common runtime variables:

- `NODE_ENV`
- `PORT`
- `HOST`
- `DEBUG`
- `LOG_LEVEL`
- `TZ`
- `CI`

And framework-specific variables:

| Framework | Auto-Ignored |
|-----------|--------------|
| Next.js | `NEXT_TELEMETRY_DISABLED`, `VERCEL_*` |
| Vite | `VITE_CJS_*` |
| CRA | `BROWSER`, `GENERATE_SOURCEMAP` |

## Configuration

### Ignoring Variables

```javascript
// env-doctor.config.js
module.exports = {
  ignore: [
    'LEGACY_*',        // Ignore all LEGACY_ variables
    'unused:DEBUG',    // Ignore unused DEBUG specifically
  ]
};
```

### Custom Include Patterns

Make sure build scripts are scanned:

```javascript
include: [
  'src/**/*.{ts,js,tsx,jsx}',
  'scripts/**/*.js',
  'webpack.config.js'
]
```

## Placeholder Values

Variables with placeholder values are not reported:

```bash
# These are ignored
API_KEY=your_api_key_here
SECRET=changeme
TOKEN=placeholder
```

Recognized placeholders:
- `your_*`, `changeme`, `placeholder`
- `todo`, `xxx`, `example_*`
- `<placeholder>`, `[placeholder]`

## Fixing Unused Variables

### Option 1: Remove

If the variable is truly unused, remove it:

```bash
# Before
DATABASE_URL=postgres://...
OLD_API_KEY=abc123  # Remove this

# After
DATABASE_URL=postgres://...
```

### Option 2: Ignore

If it's used by the runtime or build tools:

```javascript
// env-doctor.config.js
ignore: ['OLD_API_KEY']
```

### Option 3: Add Usage

If it should be used, add the reference:

```typescript
// Now it's used
const apiKey = process.env.OLD_API_KEY;
```

## Best Practices

1. **Regular cleanup** - Remove unused variables periodically
2. **Document runtime variables** - Add comments or ignore rules
3. **Use descriptive names** - Makes it clear what's needed
4. **Keep `.env.example` updated** - Remove unused from template too

