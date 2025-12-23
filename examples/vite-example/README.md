# Vite Example

This example demonstrates env-doctor usage in a Vite application.

## Features Demonstrated

- ✅ Client-accessible variables (`VITE_*`)
- ✅ `import.meta.env` pattern detection
- ✅ Type validation
- ✅ URL format validation

## Setup

1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values

3. Run env-doctor:
   ```bash
   npx env-doctor
   ```

## Vite Environment Variables

Vite uses `import.meta.env` instead of `process.env`:

```typescript
// ✅ Correct
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ Won't work (server-only)
const secret = import.meta.env.SECRET;
```

### Built-in Variables

Vite provides these automatically:
- `import.meta.env.MODE` - 'development' | 'production'
- `import.meta.env.DEV` - true in dev mode
- `import.meta.env.PROD` - true in prod mode
- `import.meta.env.SSR` - true during SSR

## Configuration

```javascript
// env-doctor.config.js
module.exports = {
  framework: 'vite',
  variables: {
    VITE_API_URL: {
      required: true,
      type: 'url'
    }
  }
};
```

