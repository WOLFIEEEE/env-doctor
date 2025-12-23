---
sidebar_position: 4
---

# Secret Detection

Detect exposed secrets, API keys, and credentials in your `.env` files.

## How It Works

env-doctor uses pattern matching to detect:
1. **Variable names** that suggest secrets
2. **Value patterns** that match known credentials

## Built-in Patterns

### Variable Name Patterns

| Pattern | Examples |
|---------|----------|
| `*password*` | `DB_PASSWORD`, `ADMIN_PASSWORD` |
| `*secret*` | `JWT_SECRET`, `API_SECRET` |
| `*api_key*` | `STRIPE_API_KEY`, `AWS_API_KEY` |
| `*token*` | `AUTH_TOKEN`, `ACCESS_TOKEN` |
| `*private_key*` | `SSH_PRIVATE_KEY` |

### Provider-Specific Patterns

| Provider | Pattern |
|----------|---------|
| Stripe | `sk_live_*`, `sk_test_*`, `rk_live_*` |
| AWS | `AKIA*` (access key) |
| GitHub | `ghp_*`, `gho_*`, `github_pat_*` |
| Google | `AIza*` |
| Slack | `xox*-*` |
| Twilio | `AC*`, `SK*` |

### Value Patterns

- JWT tokens (`eyJ*.*.*`)
- Private keys (`-----BEGIN * PRIVATE KEY-----`)
- Database URLs with credentials
- High-entropy strings (likely random)

## Example Output

```bash
✗ Exposed Secrets (2 issues)

  STRIPE_SECRET_KEY (Stripe)
    Variable appears to be a secret - detected as Stripe live secret key
    Consider using a secure vault or removing from version control.
    at .env:12
    Value: sk_li...5678

  DATABASE_URL
    Variable appears to be a secret - detected as Database URL with credentials
    at .env:3
    Value: post...@loc
```

## Configuration

### Custom Secret Patterns

Add additional patterns:

```javascript
// env-doctor.config.js
module.exports = {
  secretPatterns: [
    /^MY_COMPANY_SECRET/,
    /^INTERNAL_TOKEN/
  ]
};
```

### Marking Variables as Secrets

```javascript
variables: {
  MY_API_KEY: {
    secret: true  // Always treat as secret
  }
}
```

### Ignoring False Positives

```javascript
ignore: [
  'secret:TEST_TOKEN',  // Ignore for TEST_TOKEN
]
```

## Placeholder Values

Secrets with placeholder values are not reported:

```bash
# These are safe
API_KEY=your_api_key_here
SECRET=changeme
TOKEN=placeholder
```

## Git History Scanning

Check for secrets in commit history:

```bash
npx env-doctor scan-history
```

Output:

```bash
⚠ Found 2 potential secret(s) in git history:

  STRIPE_SECRET_KEY
    Commit: a1b2c3d4
    File: .env:12
    Author: developer@example.com
    Date: 2024-01-15
    Value: sk_li...5678
```

### Fixing Leaked Secrets

1. **Rotate the credential immediately**
2. **Remove from git history** using `git filter-branch` or BFG
3. **Add `.env` to `.gitignore`**

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

## Security Recommendations

When secrets are detected, env-doctor suggests:

1. **Use a secrets manager**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Doppler
   - 1Password CLI

2. **Use `.env.example` for documentation**
   ```bash
   # .env.example (safe to commit)
   STRIPE_SECRET_KEY=
   DATABASE_URL=postgres://user:pass@localhost:5432/db
   ```

3. **Add pre-commit hooks**
   ```bash
   npx env-doctor --ci
   ```

4. **Use environment-specific files**
   ```
   .env                 # Defaults (committed)
   .env.local           # Local overrides (gitignored)
   .env.production      # Production (gitignored)
   ```

## Best Practices

1. **Never commit real secrets** - Use `.env.example` with placeholders
2. **Rotate exposed secrets immediately** - Treat leaks as critical
3. **Use short-lived credentials** - Prefer temporary tokens
4. **Limit secret scope** - Use restricted API keys where possible
5. **Audit regularly** - Run `env-doctor scan-history` periodically

