---
sidebar_position: 3
---

# Custom Rules

Create custom validation rules for your environment variables.

## Variable Rules

Define rules for specific variables:

```javascript
// env-doctor.config.js
module.exports = {
  variables: {
    // Required with pattern
    DATABASE_URL: {
      required: true,
      secret: true,
      pattern: /^postgres:\/\//,
      description: 'PostgreSQL connection string'
    },
    
    // Numeric with default
    PORT: {
      type: 'number',
      default: 3000
    },
    
    // Enum validation
    NODE_ENV: {
      required: true,
      enum: ['development', 'production', 'test', 'staging']
    },
    
    // URL validation
    API_URL: {
      required: true,
      type: 'url',
      pattern: /^https:\/\//  // Must be HTTPS
    },
    
    // Email validation
    ADMIN_EMAIL: {
      required: true,
      type: 'email'
    },
    
    // JSON validation
    FEATURE_FLAGS: {
      type: 'json'
    },
    
    // Boolean
    DEBUG: {
      type: 'boolean',
      default: false
    }
  }
};
```

## Ignore Patterns

Ignore specific issues:

```javascript
module.exports = {
  ignore: [
    // Ignore all LEGACY_ variables
    'LEGACY_*',
    
    // Ignore TEST_ variables
    'TEST_*',
    
    // Ignore unused DEBUG
    'unused:DEBUG',
    
    // Ignore missing for optional vars
    'missing:OPTIONAL_*',
    
    // Ignore type mismatch for flexible var
    'type-mismatch:FLEXIBLE_VAR',
    
    // Ignore secret detection for test tokens
    'secret:TEST_TOKEN'
  ]
};
```

## Custom Secret Patterns

Add patterns for internal secrets:

```javascript
module.exports = {
  secretPatterns: [
    // Company-specific patterns
    /^ACME_SECRET_/,
    /^INTERNAL_TOKEN_/,
    
    // Custom API key formats
    /^myservice_[a-z0-9]{32}$/i
  ]
};
```

## Framework-Specific Rules

### Next.js Public Variables

```javascript
module.exports = {
  framework: 'nextjs',
  variables: {
    // Client-side analytics
    NEXT_PUBLIC_GA_ID: {
      required: true,
      pattern: /^(UA-|G-)/
    },
    
    // API endpoints
    NEXT_PUBLIC_API_URL: {
      required: true,
      type: 'url'
    }
  }
};
```

### Vite Configuration

```javascript
module.exports = {
  framework: 'vite',
  variables: {
    VITE_APP_TITLE: {
      required: true
    },
    VITE_API_BASE: {
      required: true,
      type: 'url'
    }
  }
};
```

## Conditional Validation

Use pattern matching for conditional rules:

```javascript
module.exports = {
  variables: {
    // Production requires specific format
    DATABASE_URL: {
      required: true,
      pattern: process.env.NODE_ENV === 'production'
        ? /^postgres:\/\/.*@.*\.amazonaws\.com/  // AWS RDS
        : /^postgres:\/\//  // Any postgres URL
    }
  }
};
```

## Dynamic Configuration

Export a function for dynamic config:

```javascript
// env-doctor.config.js
module.exports = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    envFiles: isProduction
      ? ['.env', '.env.production']
      : ['.env', '.env.local'],
    
    strict: isProduction,
    
    variables: {
      DATABASE_URL: {
        required: true,
        pattern: isProduction
          ? /^postgres:\/\/.*:.*@.*\.amazonaws\.com/
          : undefined
      }
    }
  };
};
```

## Extending Configurations

Share base config across projects:

```javascript
// base.config.js
module.exports = {
  exclude: ['node_modules', 'dist', '**/*.test.*'],
  variables: {
    NODE_ENV: {
      enum: ['development', 'production', 'test']
    },
    LOG_LEVEL: {
      enum: ['debug', 'info', 'warn', 'error']
    }
  }
};

// env-doctor.config.js
const baseConfig = require('./base.config');

module.exports = {
  ...baseConfig,
  envFiles: ['.env', '.env.local'],
  framework: 'nextjs',
  variables: {
    ...baseConfig.variables,
    DATABASE_URL: {
      required: true,
      secret: true
    }
  }
};
```

## Validation Examples

### AWS Region Format

```javascript
AWS_REGION: {
  required: true,
  pattern: /^[a-z]{2}-[a-z]+-\d$/  // e.g., us-east-1
}
```

### Semantic Version

```javascript
APP_VERSION: {
  pattern: /^\d+\.\d+\.\d+$/  // e.g., 1.2.3
}
```

### Base64 Encoded

```javascript
ENCODED_KEY: {
  pattern: /^[A-Za-z0-9+/]+=*$/
}
```

### UUID Format

```javascript
INSTANCE_ID: {
  pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
}
```

### IP Address

```javascript
SERVER_IP: {
  pattern: /^(\d{1,3}\.){3}\d{1,3}$/
}
```

