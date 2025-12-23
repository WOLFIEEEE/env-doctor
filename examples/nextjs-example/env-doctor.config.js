/**
 * env-doctor configuration for Next.js project
 * @type {import('env-doctor').EnvDoctorConfig}
 */
module.exports = {
  // Env files to check (in order of priority)
  envFiles: ['.env', '.env.local'],
  
  // Template file for sync checking
  templateFile: '.env.example',
  
  // Files to scan for process.env usage
  include: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}'
  ],
  
  // Files to exclude from scanning
  exclude: [
    'node_modules',
    '.next',
    '**/*.test.*'
  ],
  
  // Framework (auto-detected, but can be explicit)
  framework: 'nextjs',
  
  // Variable-specific rules
  variables: {
    // Server-only database connection
    DATABASE_URL: {
      required: true,
      secret: true,
      pattern: /^postgres:\/\//,
      description: 'PostgreSQL database connection string'
    },
    
    // Authentication secret
    JWT_SECRET: {
      required: true,
      secret: true,
      description: 'Secret key for JWT signing'
    },
    
    // Public API URL (client-accessible)
    NEXT_PUBLIC_API_URL: {
      required: true,
      type: 'url',
      description: 'Public API endpoint URL'
    },
    
    // Optional analytics
    NEXT_PUBLIC_GA_ID: {
      pattern: /^(UA-|G-)/,
      description: 'Google Analytics ID'
    }
  },
  
  // Ignore patterns
  ignore: [
    'TEST_*',  // Ignore test-only variables
  ]
};

