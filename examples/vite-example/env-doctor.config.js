/**
 * env-doctor configuration for Vite project
 * @type {import('env-doctor').EnvDoctorConfig}
 */
module.exports = {
  envFiles: ['.env', '.env.local'],
  templateFile: '.env.example',
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['node_modules', 'dist'],
  framework: 'vite',
  
  variables: {
    // Public API endpoint (client-accessible via VITE_)
    VITE_API_URL: {
      required: true,
      type: 'url',
      description: 'API base URL'
    },
    
    // App title
    VITE_APP_TITLE: {
      required: true,
      description: 'Application title shown in the UI'
    },
    
    // Server-only database (not exposed to client)
    DATABASE_URL: {
      required: false,
      secret: true,
      description: 'Database connection for SSR'
    }
  }
};

