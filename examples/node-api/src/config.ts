// Example: Centralized configuration
// This pattern validates env vars at startup

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config = {
  // Server
  port: parseInt(optional('PORT', '3000'), 10),
  nodeEnv: optional('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  
  // Database
  databaseUrl: required('DATABASE_URL'),
  redisUrl: process.env.REDIS_URL,
  
  // Auth
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),
  
  // Logging
  logLevel: optional('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
  
  // Derived
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

// Type for consumers
export type Config = typeof config;

