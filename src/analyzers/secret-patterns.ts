import type { EnvVariable, Issue } from '../types/index.js';
import { shouldIgnoreVariable } from '../utils/glob.js';

/**
 * Built-in patterns for detecting secrets
 */
export const SECRET_NAME_PATTERNS: Array<{ pattern: RegExp; provider?: string }> = [
  // Generic patterns
  { pattern: /password/i },
  { pattern: /secret/i },
  { pattern: /private[_-]?key/i },
  { pattern: /api[_-]?key/i },
  { pattern: /auth[_-]?token/i },
  { pattern: /access[_-]?token/i },
  { pattern: /refresh[_-]?token/i },
  { pattern: /bearer/i },
  { pattern: /credential/i },
  { pattern: /connection[_-]?string/i },

  // Provider-specific
  { pattern: /^AWS_SECRET/i, provider: 'AWS' },
  { pattern: /^AWS_ACCESS_KEY/i, provider: 'AWS' },
  { pattern: /^STRIPE_SECRET/i, provider: 'Stripe' },
  { pattern: /^STRIPE_WEBHOOK_SECRET/i, provider: 'Stripe' },
  { pattern: /^GITHUB_TOKEN/i, provider: 'GitHub' },
  { pattern: /^GH_TOKEN/i, provider: 'GitHub' },
  { pattern: /^GOOGLE_APPLICATION_CREDENTIALS/i, provider: 'Google' },
  { pattern: /^FIREBASE_/i, provider: 'Firebase' },
  { pattern: /^TWILIO_AUTH_TOKEN/i, provider: 'Twilio' },
  { pattern: /^SENDGRID_API_KEY/i, provider: 'SendGrid' },
  { pattern: /^MAILGUN_API_KEY/i, provider: 'Mailgun' },
  { pattern: /^SLACK_TOKEN/i, provider: 'Slack' },
  { pattern: /^DISCORD_TOKEN/i, provider: 'Discord' },
  { pattern: /^OPENAI_API_KEY/i, provider: 'OpenAI' },
  { pattern: /^ANTHROPIC_API_KEY/i, provider: 'Anthropic' },
  { pattern: /^SENTRY_DSN/i, provider: 'Sentry' },
  { pattern: /^DATADOG_API_KEY/i, provider: 'Datadog' },
];

/**
 * Patterns for detecting secrets in values
 */
export const SECRET_VALUE_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  // Stripe
  { pattern: /^sk_live_[a-zA-Z0-9]{24,}/, type: 'Stripe live secret key' },
  { pattern: /^sk_test_[a-zA-Z0-9]{24,}/, type: 'Stripe test secret key' },
  { pattern: /^rk_live_[a-zA-Z0-9]{24,}/, type: 'Stripe restricted key' },

  // AWS
  { pattern: /^AKIA[A-Z0-9]{16}/, type: 'AWS access key' },
  { pattern: /^[a-zA-Z0-9/+=]{40}$/, type: 'Possible AWS secret key' },

  // GitHub
  { pattern: /^ghp_[a-zA-Z0-9]{36}/, type: 'GitHub personal access token' },
  { pattern: /^gho_[a-zA-Z0-9]{36}/, type: 'GitHub OAuth token' },
  { pattern: /^ghu_[a-zA-Z0-9]{36}/, type: 'GitHub user-to-server token' },
  { pattern: /^ghs_[a-zA-Z0-9]{36}/, type: 'GitHub server-to-server token' },
  { pattern: /^github_pat_[a-zA-Z0-9_]{22,}/, type: 'GitHub PAT' },

  // JWT
  { pattern: /^eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/, type: 'JWT token' },

  // Private keys
  { pattern: /-----BEGIN RSA PRIVATE KEY-----/, type: 'RSA private key' },
  { pattern: /-----BEGIN EC PRIVATE KEY-----/, type: 'EC private key' },
  { pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/, type: 'OpenSSH private key' },
  { pattern: /-----BEGIN PRIVATE KEY-----/, type: 'Private key' },

  // Generic API keys (high entropy strings)
  { pattern: /^[a-zA-Z0-9]{32,64}$/, type: 'Possible API key' },

  // Database URLs with credentials
  {
    pattern: /^(postgres|postgresql|mysql|mongodb|redis):\/\/[^:]+:[^@]+@/,
    type: 'Database URL with credentials',
  },

  // Google
  { pattern: /^AIza[a-zA-Z0-9_-]{35}/, type: 'Google API key' },

  // Slack
  { pattern: /^xox[baprs]-[a-zA-Z0-9-]+/, type: 'Slack token' },

  // Twilio
  { pattern: /^AC[a-zA-Z0-9]{32}/, type: 'Twilio Account SID' },
  { pattern: /^SK[a-zA-Z0-9]{32}/, type: 'Twilio API Key' },
];

export interface SecretAnalyzerOptions {
  /** Variables to analyze */
  variables: EnvVariable[];
  /** Additional patterns to check */
  customPatterns?: RegExp[];
  /** Patterns to ignore */
  ignorePatterns?: string[];
}

/**
 * Analyze variables for potential secrets
 */
export function analyzeSecrets(options: SecretAnalyzerOptions): Issue[] {
  const { variables, customPatterns = [], ignorePatterns = [] } = options;
  const issues: Issue[] = [];

  for (const variable of variables) {
    const { name, value, file, line, isSecret } = variable;

    // Skip if ignored
    if (shouldIgnoreVariable(name, ignorePatterns, 'secret')) {
      continue;
    }

    // Skip if already marked as secret with no value (safe)
    if (isSecret && !value) {
      continue;
    }

    // Check if the variable name suggests it's a secret
    const nameMatch = findSecretNamePattern(name);
    const valueMatch = value ? findSecretValuePattern(value) : null;

    // Also check custom patterns
    const customMatch = customPatterns.find((p) => p.test(name) || (value && p.test(value)));

    if ((nameMatch || valueMatch || customMatch) && value) {
      // This looks like a secret and has a value - potential issue
      const provider = nameMatch?.provider;
      const secretType = valueMatch?.type;

      let message = `Variable "${name}" appears to be a secret`;
      if (provider) {
        message += ` (${provider})`;
      }
      if (secretType) {
        message += ` - detected as ${secretType}`;
      }

      // Check if the value looks like a real secret (not a placeholder)
      if (!isPlaceholderValue(value)) {
        issues.push({
          type: 'secret-exposed',
          severity: 'error',
          variable: name,
          message: message + '. Consider using a secure vault or removing from version control.',
          location: { file, line },
          context: {
            provider,
            secretType,
            valuePreview: redactValue(value),
          },
          fix: 'Use environment-specific configuration or a secrets manager',
        });
      }
    }
  }

  return issues;
}

/**
 * Find matching secret name pattern
 */
function findSecretNamePattern(name: string): { pattern: RegExp; provider?: string } | null {
  for (const { pattern, provider } of SECRET_NAME_PATTERNS) {
    if (pattern.test(name)) {
      return { pattern, provider };
    }
  }
  return null;
}

/**
 * Find matching secret value pattern
 */
function findSecretValuePattern(value: string): { pattern: RegExp; type: string } | null {
  for (const { pattern, type } of SECRET_VALUE_PATTERNS) {
    if (pattern.test(value)) {
      return { pattern, type };
    }
  }
  return null;
}

/**
 * Check if a value looks like a placeholder
 */
function isPlaceholderValue(value: string): boolean {
  const placeholderPatterns = [
    /^your[-_]?/i,
    /^xxx+$/i,
    /^placeholder$/i,
    /^changeme$/i,
    /^todo$/i,
    /^<.*>$/,
    /^\[.*\]$/,
    /^example[-_]?/i,
    /^test[-_]?/i,
    /^dummy[-_]?/i,
    /^fake[-_]?/i,
    /^sample[-_]?/i,
  ];

  return placeholderPatterns.some((pattern) => pattern.test(value));
}

/**
 * Redact a secret value for display
 */
function redactValue(value: string): string {
  if (value.length <= 8) {
    return '****';
  }
  return value.slice(0, 4) + '...' + value.slice(-4);
}

/**
 * Get a list of common secret variable names
 */
export function getCommonSecretNames(): string[] {
  return [
    'API_KEY',
    'API_SECRET',
    'SECRET_KEY',
    'PRIVATE_KEY',
    'DATABASE_PASSWORD',
    'DB_PASSWORD',
    'JWT_SECRET',
    'SESSION_SECRET',
    'AUTH_SECRET',
    'ENCRYPTION_KEY',
    'AWS_SECRET_ACCESS_KEY',
    'STRIPE_SECRET_KEY',
    'GITHUB_TOKEN',
  ];
}

/**
 * Check if a variable should be treated as a secret
 */
export function isSecretVariable(name: string, value?: string): boolean {
  // Check name patterns
  const nameMatch = findSecretNamePattern(name);
  if (nameMatch) return true;

  // Check value patterns if provided
  if (value) {
    const valueMatch = findSecretValuePattern(value);
    if (valueMatch) return true;
  }

  return false;
}

/**
 * Get security recommendations for a project
 */
export function getSecurityRecommendations(issues: Issue[]): string[] {
  const recommendations: string[] = [];

  const secretIssues = issues.filter((i) => i.type === 'secret-exposed');

  if (secretIssues.length > 0) {
    recommendations.push('Add .env files to .gitignore to prevent committing secrets');
    recommendations.push('Consider using a secrets manager like AWS Secrets Manager, HashiCorp Vault, or Doppler');
    recommendations.push('Use .env.example with placeholder values for documentation');
    recommendations.push('Enable git pre-commit hooks to scan for secrets before committing');
  }

  // Check for specific providers
  const providers = new Set(
    secretIssues.map((i) => (i.context as { provider?: string })?.provider).filter(Boolean)
  );

  if (providers.has('AWS')) {
    recommendations.push('Consider using AWS IAM roles instead of access keys where possible');
  }

  if (providers.has('Stripe')) {
    recommendations.push('Use Stripe restricted API keys with minimal permissions in production');
  }

  return recommendations;
}

