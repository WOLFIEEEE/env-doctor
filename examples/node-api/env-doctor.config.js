/**
 * env-doctor configuration for Node.js API
 * @type {import('env-doctor').EnvDoctorConfig}
 */
module.exports = {
  envFiles: ['.env', '.env.local'],
  templateFile: '.env.example',
  include: ['src/**/*.ts'],
  exclude: ['node_modules', 'dist'],
  framework: 'node',
  
  variables: {
    // Server port
    PORT: {
      type: 'number',
      default: 3000,
      description: 'Port the API server listens on'
    },
    
    // Database connection
    DATABASE_URL: {
      required: true,
      secret: true,
      pattern: /^postgres:\/\//,
      description: 'PostgreSQL connection string'
    },
    
    // Redis for caching
    REDIS_URL: {
      secret: true,
      pattern: /^redis:\/\//,
      description: 'Redis connection string'
    },
    
    // JWT configuration
    JWT_SECRET: {
      required: true,
      secret: true,
      description: 'Secret for JWT signing'
    },
    
    JWT_EXPIRES_IN: {
      default: '7d',
      pattern: /^\d+[smhd]$/,
      description: 'JWT expiration time (e.g., 7d, 24h)'
    },
    
    // Environment
    NODE_ENV: {
      enum: ['development', 'production', 'test'],
      default: 'development'
    },
    
    // Logging
    LOG_LEVEL: {
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info'
    }
  },
  
  // Strict mode for production
  strict: process.env.NODE_ENV === 'production'
};

