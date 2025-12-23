// Basic usage patterns for testing

// Direct access
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;

// Number parsing
const port = parseInt(process.env.PORT || '3000', 10);

// Boolean check
const isDebug = process.env.DEBUG === 'true';

// Missing variable (not in .env)
const missingVar = process.env.MISSING_VAR;

// Bracket notation
const nodeEnv = process.env['NODE_ENV'];

// Destructuring
const { SECRET_KEY } = process.env;

export function getConfig() {
  return {
    dbUrl,
    apiKey,
    port,
    isDebug,
    missingVar,
    nodeEnv,
  };
}

