---
sidebar_position: 2
---

# Monorepo Setup

Configure env-doctor for monorepo projects with multiple packages.

## Project Structure

```
my-monorepo/
├── package.json
├── .env                      # Root env file
├── .env.example
├── env-doctor.config.js      # Root config
├── packages/
│   ├── web/
│   │   ├── package.json
│   │   ├── .env.local        # Package-specific
│   │   └── src/
│   ├── api/
│   │   ├── package.json
│   │   ├── .env.local
│   │   └── src/
│   └── shared/
│       ├── package.json
│       └── src/
└── apps/
    └── admin/
        ├── package.json
        └── src/
```

## Root Configuration

Create a root config that scans all packages:

```javascript
// env-doctor.config.js
module.exports = {
  envFiles: ['.env'],
  templateFile: '.env.example',
  
  include: [
    'packages/*/src/**/*.{ts,tsx,js,jsx}',
    'apps/*/src/**/*.{ts,tsx,js,jsx}'
  ],
  
  exclude: [
    'node_modules',
    '**/node_modules',
    '**/dist',
    '**/build'
  ],
  
  framework: 'auto',
  
  variables: {
    // Shared variables
    NODE_ENV: {
      enum: ['development', 'production', 'test']
    },
    LOG_LEVEL: {
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info'
    }
  }
};
```

## Per-Package Scanning

Scan individual packages:

```bash
# Scan web package
npx env-doctor packages/web

# Scan api package  
npx env-doctor packages/api
```

## Package-Specific Config

Create package-level configs for specific rules:

```javascript
// packages/api/env-doctor.config.js
module.exports = {
  envFiles: ['../../.env', '.env.local'],
  templateFile: '../../.env.example',
  
  include: ['src/**/*.ts'],
  
  framework: 'node',
  
  variables: {
    DATABASE_URL: {
      required: true,
      secret: true
    },
    REDIS_URL: {
      required: true
    }
  }
};
```

```javascript
// packages/web/env-doctor.config.js
module.exports = {
  envFiles: ['../../.env', '.env.local'],
  templateFile: '../../.env.example',
  
  include: ['src/**/*.{ts,tsx}'],
  
  framework: 'nextjs',
  
  variables: {
    NEXT_PUBLIC_API_URL: {
      required: true,
      type: 'url'
    }
  }
};
```

## Shared Environment File

For monorepos, use a root `.env` with package prefixes:

```bash
# .env
NODE_ENV=development

# API Package
API_DATABASE_URL=postgres://localhost:5432/api
API_REDIS_URL=redis://localhost:6379
API_JWT_SECRET=secret

# Web Package
WEB_NEXT_PUBLIC_API_URL=http://localhost:3001

# Admin App
ADMIN_API_URL=http://localhost:3001/admin
```

## Workspace Scripts

Add scripts to your root `package.json`:

```json
{
  "scripts": {
    "env:check": "env-doctor",
    "env:check:all": "pnpm -r exec env-doctor",
    "env:check:web": "env-doctor packages/web",
    "env:check:api": "env-doctor packages/api"
  }
}
```

## CI Integration

Check all packages in CI:

```yaml
# .github/workflows/ci.yml
jobs:
  env-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
      
      - run: pnpm install
      
      # Check root
      - name: Check root environment
        run: npx env-doctor --ci
        
      # Check each package
      - name: Check packages
        run: pnpm -r exec env-doctor --ci
```

## Turborepo Integration

For Turborepo projects, add env-doctor to your pipeline:

```json
// turbo.json
{
  "pipeline": {
    "env:check": {
      "cache": false
    },
    "build": {
      "dependsOn": ["env:check"],
      "outputs": ["dist/**"]
    }
  }
}
```

## Best Practices

1. **Root config for shared rules** - Common patterns, ignored variables
2. **Package configs for specific rules** - Required variables per package
3. **Single .env.example** - Document all variables in one place
4. **Prefix by package** - Avoid conflicts with namespaced variables
5. **CI checks all packages** - Ensure nothing is missed

