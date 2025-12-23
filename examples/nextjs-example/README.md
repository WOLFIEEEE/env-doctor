# Next.js Example

This example demonstrates env-doctor usage in a Next.js application.

## Features Demonstrated

- ✅ Server-only variables (`DATABASE_URL`, `JWT_SECRET`)
- ✅ Client-accessible variables (`NEXT_PUBLIC_*`)
- ✅ Required vs optional variables
- ✅ Pattern validation
- ✅ Secret detection

## Setup

1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values in `.env.local`

3. Run env-doctor to validate:
   ```bash
   npx env-doctor
   ```

## Expected Output

### With Missing Variables

```bash
✗ Missing Variables (2 issues)

  DATABASE_URL
    Required variable is not defined
    
  JWT_SECRET  
    Required variable is not defined
```

### With All Variables Set

```bash
✓ All checks passed!
Completed in 45ms
```

## File Structure

```
├── .env.example          # Template (committed)
├── .env.local            # Local values (gitignored)
├── env-doctor.config.js  # Configuration
└── src/
    ├── lib/
    │   ├── db.ts         # Server-only: DATABASE_URL
    │   └── auth.ts       # Server-only: JWT_SECRET
    └── components/
        └── ApiStatus.tsx # Client: NEXT_PUBLIC_API_URL
```

## Configuration Highlights

```javascript
// env-doctor.config.js
module.exports = {
  framework: 'nextjs',
  variables: {
    DATABASE_URL: {
      required: true,
      secret: true,
      pattern: /^postgres:\/\//
    }
  }
};
```

