---
sidebar_position: 12
---

# CI/CD Integration

Add env-doctor to your CI pipeline to catch environment issues before they reach production.

## GitHub Actions

### Basic Check

```yaml
# .github/workflows/env-check.yml
name: Environment Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  env-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Check environment variables
        run: npx @theaccessibleteam/env-doctor --ci
```

### With SARIF Upload

Upload results to GitHub Code Scanning for inline annotations:

```yaml
name: Environment Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  env-doctor:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Run env-doctor
        run: npx @theaccessibleteam/env-doctor --ci --format sarif > results.sarif
        continue-on-error: true
        
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

### JSON Report Artifact

Save reports as build artifacts:

```yaml
- name: Run env-doctor
  run: npx @theaccessibleteam/env-doctor --format json > env-report.json
  
- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: env-doctor-report
    path: env-report.json
```

---

## GitLab CI

```yaml
# .gitlab-ci.yml
env-check:
  image: node:20
  stage: test
  script:
    - npm ci
    - npx @theaccessibleteam/env-doctor --ci
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

### With Artifacts

```yaml
env-check:
  image: node:20
  stage: test
  script:
    - npm ci
    - npx @theaccessibleteam/env-doctor --format json > env-report.json
  artifacts:
    reports:
      dotenv: env-report.json
    paths:
      - env-report.json
```

---

## CircleCI

```yaml
# .circleci/config.yml
version: 2.1

jobs:
  env-check:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: npm ci
      - run:
          name: Check environment variables
          command: npx @theaccessibleteam/env-doctor --ci

workflows:
  main:
    jobs:
      - env-check
```

---

## Azure DevOps

```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
      
  - script: npm ci
    displayName: 'Install dependencies'
    
  - script: npx @theaccessibleteam/env-doctor --ci
    displayName: 'Check environment variables'
```

---

## Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Environment Check') {
            steps {
                sh 'npx @theaccessibleteam/env-doctor --ci'
            }
        }
    }
}
```

---

## Pre-commit Hook

Run env-doctor before each commit:

### Using Husky

```bash
npm install -D husky
npx husky init
echo "npx @theaccessibleteam/env-doctor --ci" > .husky/pre-commit
```

### Using lint-staged

```json
{
  "lint-staged": {
    "*.{ts,js,tsx,jsx}": [
      "npx @theaccessibleteam/env-doctor --ci"
    ]
  }
}
```

---

## Handling Secrets in CI

### Don't Check Production Secrets

env-doctor scans `.env` files, which should NOT contain real secrets in version control.

**Recommended approach:**

1. Commit `.env.example` with placeholders
2. Create `.env` in CI from environment variables
3. Run env-doctor to validate configuration

```yaml
steps:
  - name: Create .env from secrets
    run: |
      echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" >> .env
      echo "API_KEY=${{ secrets.API_KEY }}" >> .env
      
  - name: Validate environment
    run: npx @theaccessibleteam/env-doctor --ci
```

### Git History Scanning in CI

Check for leaked secrets in git history:

```yaml
- name: Scan git history
  run: npx @theaccessibleteam/env-doctor scan-history --depth 50
```

---

## Exit Codes

| Code | Meaning | CI Behavior |
|------|---------|-------------|
| `0` | No errors | Build passes |
| `1` | Errors found | Build fails |

Use `--strict` to treat warnings as errors:

```yaml
- run: npx @theaccessibleteam/env-doctor --ci --strict
```

---

## Best Practices

1. **Run on every PR** - Catch issues before merge
2. **Use SARIF for GitHub** - Get inline annotations
3. **Store reports as artifacts** - Track trends over time
4. **Use strict mode** - Enforce clean configuration
5. **Scan git history** - Detect historical leaks
6. **Don't commit real secrets** - Use CI environment variables

