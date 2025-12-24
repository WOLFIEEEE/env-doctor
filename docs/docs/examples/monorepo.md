---
sidebar_position: 3
---

# Monorepo Support

env-doctor provides first-class support for monorepos and workspaces, including npm, yarn, pnpm, Turborepo, and Nx.

## Quick Start

```bash
# Scan all workspace packages
npx env-doctor --workspaces

# Scan specific packages
npx env-doctor --workspaces "apps/*,packages/*"

# Show dependency graph
npx env-doctor graph
```

## Workspace Detection

env-doctor automatically detects your workspace configuration:

| Tool | Config File | Detection |
|------|-------------|-----------|
| npm | `package.json` workspaces | ✓ |
| yarn | `package.json` workspaces | ✓ |
| pnpm | `pnpm-workspace.yaml` | ✓ |
| Turborepo | `turbo.json` | ✓ |
| Nx | `nx.json` | ✓ |
| Lerna | `lerna.json` | ✓ |

## Console Output

```
Monorepo Environment Analysis
══════════════════════════════════════════════════════════════════════════════

Detected: pnpm workspace (pnpm-workspace.yaml)
Root: /home/user/my-monorepo
Packages: 5 packages found

──────────────────────────────────────────────────────────────────────────────

📦 apps/web (Next.js)
   .env: 8 variables
   .env.local: 2 variables
   
   ✓ 9 variables in use
   ⚠ 1 unused: LEGACY_API_URL
   ✗ 1 missing: NEXT_PUBLIC_STRIPE_KEY
   
──────────────────────────────────────────────────────────────────────────────

📦 apps/api (Node.js)
   .env: 12 variables
   
   ✓ 12 variables in use
   ✓ No issues
   
──────────────────────────────────────────────────────────────────────────────

📦 packages/database (Library)
   .env: 3 variables
   Inherits from root: DATABASE_URL, REDIS_URL
   
   ✓ 5 variables in use
   ✓ No issues

══════════════════════════════════════════════════════════════════════════════

Shared Variables (from root .env)
─────────────────────────────────────────────────────────────────
Variable          │ Used by                              
─────────────────────────────────────────────────────────────────
DATABASE_URL      │ apps/api, packages/database, packages/worker
REDIS_URL         │ apps/api, packages/database
LOG_LEVEL         │ apps/api, apps/web, packages/worker

══════════════════════════════════════════════════════════════════════════════

⚠ Conflicts Detected
─────────────────────────────────────────────────────────────────

  PORT
    apps/web/.env:      PORT=3000
    apps/api/.env:      PORT=4000
    packages/worker/.env: PORT=5000
    
    ℹ This may be intentional for local development.

══════════════════════════════════════════════════════════════════════════════

Summary
─────────────────────────────────────────────────────────────────
  Packages scanned:    5
  Total variables:     31 (15 unique)
  
  ✓ Passing:           3 packages
  ⚠ With issues:       2 packages
  ! Conflicts:         1
```

## Configuration

### Root Configuration

```javascript
// env-doctor.config.js (at monorepo root)
export default {
  workspaces: {
    // Patterns for finding packages
    patterns: ['apps/*', 'packages/*'],
    
    // Root .env files inherited by all packages
    rootEnvFiles: ['.env', '.env.local'],
    
    // Inheritance strategy
    inheritance: 'cascade', // 'cascade' | 'explicit' | 'none'
    
    // Package-specific overrides
    packages: {
      'apps/web': {
        framework: 'nextjs',
        envFiles: ['.env', '.env.local'],
      },
      'apps/api': {
        framework: 'node',
        inheritFromRoot: false,
      },
      'packages/database': {
        mode: 'library',
        expectedVariables: ['DATABASE_URL', 'REDIS_URL'],
      },
    },
  },

  conflicts: {
    mode: 'warn', // 'error' | 'warn' | 'allow'
    allowDifferent: ['PORT', 'HOST', 'NODE_ENV'],
  },
};
```

### Package-Level Config

Individual packages can have their own config:

```javascript
// apps/web/env-doctor.config.js
export default {
  extends: '../../env-doctor.config.js',
  framework: 'nextjs',
  
  variables: {
    NEXT_PUBLIC_API_URL: { required: true },
  },
};
```

## Inheritance Modes

### Cascade (Default)

Root `.env` variables are automatically available in all packages:

```
Root .env
├── apps/web (inherits + local .env)
├── apps/api (inherits + local .env)
└── packages/database (inherits + local .env)
```

### Explicit

Packages must explicitly declare which root variables they need:

```javascript
packages: {
  'packages/database': {
    expectedVariables: ['DATABASE_URL'],
  },
}
```

### None

No inheritance - each package is completely isolated.

## Conflict Detection

env-doctor detects when the same variable is defined with different values:

```
⚠ Conflicts Detected

  PORT
    Root .env:          PORT=3000
    apps/api/.env:      PORT=4000  ← Overrides root
    
    ℹ This may be intentional.
```

Configure conflict handling:

```javascript
conflicts: {
  mode: 'error',  // Fail on conflicts
  allowDifferent: ['PORT', 'HOST'],  // Exceptions
}
```

## Dependency Graph

Visualize variable flow across packages:

```bash
# ASCII diagram
npx env-doctor graph

# Mermaid diagram
npx env-doctor graph --format mermaid

# DOT format (for Graphviz)
npx env-doctor graph --format dot

# JSON data
npx env-doctor graph --format json
```

Example output:

```
Environment Variable Dependency Graph
═════════════════════════════════════════════════════════════

                    ┌─────────────┐
                    │  Root .env  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │  apps/web   │  │  apps/api   │  │   worker    │
   └─────────────┘  └─────────────┘  └─────────────┘

Variables Flow:
  DATABASE_URL: Root → api, database, worker
  REDIS_URL: Root → api, database
```

## Turborepo Integration

env-doctor understands Turborepo pipelines:

```bash
# Validate env vars for a specific pipeline
npx env-doctor --pipeline build
```

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "env": ["NODE_ENV", "NEXT_PUBLIC_*"],
      "dotEnv": [".env.production"]
    },
    "dev": {
      "env": ["NODE_ENV"],
      "dotEnv": [".env.local", ".env.development"]
    }
  }
}
```

## Nx Integration

Works with Nx project configuration:

```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "inputs": ["{env.NODE_ENV}", "{env.DATABASE_URL}"]
    }
  }
}
```

## CI Integration

```yaml
# .github/workflows/validate.yml
name: Validate Monorepo

on: push

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate all packages
        run: npx env-doctor --workspaces --ci
        
      - name: Validate specific pipeline
        run: npx env-doctor --pipeline build --ci
```

## Best Practices

1. **Define shared variables at root** - Use root `.env` for common vars
2. **Use explicit inheritance for libraries** - Libraries should declare dependencies
3. **Allow PORT conflicts** - Different apps need different ports
4. **Run validation in CI** - Catch issues before merge
5. **Use the graph command** - Visualize complex dependencies
6. **Configure per-package frameworks** - Ensure correct prefix detection
