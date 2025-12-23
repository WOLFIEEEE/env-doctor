# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of env-doctor seriously. If you believe you have found a
security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

1. **Email**: Send an email describing the vulnerability
2. **GitHub Security Advisories**: Use [GitHub's security advisory feature](https://github.com/WOLFIEEEE/env-doctor/security/advisories/new)

### What to Include

Please include the following information:

- Type of issue (e.g., secret exposure, command injection, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Resolution**: Depends on complexity, typically within 30 days

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations and disruption
- Only interact with accounts you own or with explicit permission
- Do not exploit a vulnerability beyond what is necessary to demonstrate it
- Report vulnerabilities promptly

## Security Best Practices

When using env-doctor:

1. **Never commit real secrets** - Use `.env.example` with placeholder values
2. **Add `.env` to `.gitignore`** - Prevent accidental commits
3. **Use env-doctor's secret detection** - Run `env-doctor scan-history` regularly
4. **Rotate exposed secrets immediately** - If a secret is found in git history
