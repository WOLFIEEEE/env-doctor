# Node.js API Example

This example demonstrates env-doctor usage in a plain Node.js API.

## Features Demonstrated

- ✅ Required vs optional variables
- ✅ Default values
- ✅ Type validation (number, enum)
- ✅ Pattern validation (regex)
- ✅ Secret detection
- ✅ Centralized config pattern

## Setup

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Fill in required values:
   ```bash
   DATABASE_URL=postgres://user:pass@localhost:5432/mydb
   JWT_SECRET=your-secret-key-here
   ```

3. Run env-doctor:
   ```bash
   npx env-doctor
   ```

## Configuration Pattern

This example uses a centralized config pattern:

```typescript
// src/config.ts
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
};
```

Benefits:
- Validates all env vars at startup
- Type-safe configuration object
- Single source of truth
- Fails fast if missing required vars

## Variable Types

| Variable | Type | Required | Default |
|----------|------|----------|---------|
| `PORT` | number | No | 3000 |
| `DATABASE_URL` | string | Yes | - |
| `REDIS_URL` | string | No | - |
| `JWT_SECRET` | string | Yes | - |
| `JWT_EXPIRES_IN` | string | No | 7d |
| `NODE_ENV` | enum | No | development |
| `LOG_LEVEL` | enum | No | info |

## Strict Mode

For production deployments, set `strict: true` in config:

```javascript
// env-doctor.config.js
module.exports = {
  strict: process.env.NODE_ENV === 'production'
};
```

This treats all warnings as errors.

