/**
 * @fileoverview Types for the sync module
 */

import type { EnvVariable } from '../types/index.js';

/**
 * Categories for grouping environment variables
 */
export interface CategoryDefinition {
  /** Category name */
  name: string;
  /** Patterns to match variable names (glob-like) */
  patterns: string[];
  /** Description for the category */
  description?: string;
  /** Order priority (lower = first) */
  priority?: number;
}

/**
 * Default categories for common environment variables
 */
export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    name: 'Database',
    patterns: ['DATABASE_*', 'DB_*', 'POSTGRES_*', 'MYSQL_*', 'MONGO_*', 'REDIS_*'],
    description: 'Database connection settings',
    priority: 1,
  },
  {
    name: 'Authentication',
    patterns: ['JWT_*', 'AUTH_*', 'OAUTH_*', '*_CLIENT_ID', '*_CLIENT_SECRET', 'SESSION_*'],
    description: 'Authentication and authorization',
    priority: 2,
  },
  {
    name: 'Payment Processing',
    patterns: ['STRIPE_*', 'PAYPAL_*', 'PAYMENT_*'],
    description: 'Payment gateway configuration',
    priority: 3,
  },
  {
    name: 'External Services',
    patterns: ['SENTRY_*', 'SENDGRID_*', 'TWILIO_*', 'AWS_*', 'S3_*', 'CLOUDINARY_*', 'SMTP_*', 'MAIL_*'],
    description: 'Third-party service integrations',
    priority: 4,
  },
  {
    name: 'Application Settings',
    patterns: ['PORT', 'HOST', 'NODE_ENV', 'LOG_*', 'DEBUG_*', 'APP_*', 'API_*'],
    description: 'Core application configuration',
    priority: 5,
  },
  {
    name: 'Feature Flags',
    patterns: ['FEATURE_*', 'FF_*', 'ENABLE_*', 'DISABLE_*'],
    description: 'Feature toggles',
    priority: 6,
  },
  {
    name: 'Client-Side (Next.js)',
    patterns: ['NEXT_PUBLIC_*'],
    description: 'Variables exposed to the browser (Next.js)',
    priority: 7,
  },
  {
    name: 'Client-Side (Vite)',
    patterns: ['VITE_*'],
    description: 'Variables exposed to the browser (Vite)',
    priority: 8,
  },
  {
    name: 'Client-Side (CRA)',
    patterns: ['REACT_APP_*'],
    description: 'Variables exposed to the browser (Create React App)',
    priority: 9,
  },
];

/**
 * Configuration for sync operations
 */
export interface SyncConfig {
  /** Sources to include in template generation */
  sources?: {
    /** Include variables found in code */
    fromCode?: boolean;
    /** Include variables from .env files */
    fromEnv?: boolean;
    /** Include variables from config */
    fromConfig?: boolean;
  };
  /** How to group variables */
  groupBy?: 'category' | 'prefix' | 'file' | 'none';
  /** Custom category definitions */
  categories?: Record<string, string[]>;
  /** What metadata to include */
  include?: {
    /** Include type hints */
    types?: boolean;
    /** Include default values */
    defaults?: boolean;
    /** Include example values */
    examples?: boolean;
    /** Include descriptions */
    descriptions?: boolean;
    /** Include secret warnings */
    secretWarnings?: boolean;
    /** Include documentation links */
    docsLinks?: boolean;
    /** Mark required variables */
    required?: boolean;
  };
  /** How to handle values */
  values?: {
    /** How to handle secret values */
    secrets?: 'empty' | 'placeholder' | 'redacted';
    /** How to handle non-secret values */
    nonSecrets?: 'empty' | 'default' | 'example';
  };
  /** Formatting options */
  format?: {
    /** Include header comment */
    headerComment?: boolean;
    /** Include section dividers */
    sectionDividers?: boolean;
    /** Blank lines between groups */
    blankLinesBetweenGroups?: boolean;
    /** Align equals signs */
    alignEquals?: boolean;
    /** Maximum line length for comments */
    maxLineLength?: number;
  };
  /** What to preserve from existing template */
  preserve?: {
    /** Preserve custom comments */
    customComments?: boolean;
    /** Preserve custom variables not in code */
    customVariables?: boolean;
    /** How to handle ordering */
    ordering?: 'smart' | 'strict' | 'none';
  };
}

/**
 * Default sync configuration
 */
export const DEFAULT_SYNC_CONFIG: Required<SyncConfig> = {
  sources: {
    fromCode: true,
    fromEnv: true,
    fromConfig: true,
  },
  groupBy: 'category',
  categories: {},
  include: {
    types: true,
    defaults: true,
    examples: true,
    descriptions: true,
    secretWarnings: true,
    docsLinks: false,
    required: true,
  },
  values: {
    secrets: 'empty',
    nonSecrets: 'default',
  },
  format: {
    headerComment: true,
    sectionDividers: true,
    blankLinesBetweenGroups: true,
    alignEquals: false,
    maxLineLength: 80,
  },
  preserve: {
    customComments: true,
    customVariables: true,
    ordering: 'smart',
  },
};

/**
 * Enriched variable with metadata for template generation
 */
export interface EnrichedVariable extends EnvVariable {
  /** Category this variable belongs to */
  category?: string;
  /** Type of the variable */
  type?: 'string' | 'number' | 'boolean' | 'url' | 'email' | 'json' | 'array';
  /** Description from config or inferred */
  description?: string;
  /** Example value */
  example?: string;
  /** Whether this is required */
  required?: boolean;
  /** Documentation URL */
  docsUrl?: string;
  /** Additional hints */
  hints?: string[];
  /** Source of this variable */
  source?: 'code' | 'env' | 'config' | 'template';
}

/**
 * Parsed template section
 */
export interface TemplateSection {
  /** Section name/category */
  name: string;
  /** Comments before the section */
  headerComments: string[];
  /** Variables in this section */
  variables: ParsedTemplateVariable[];
}

/**
 * Parsed variable from template
 */
export interface ParsedTemplateVariable {
  /** Variable name */
  name: string;
  /** Variable value */
  value: string;
  /** Comments before this variable */
  comments: string[];
  /** Line number in original file */
  line: number;
  /** Whether this was a custom addition */
  isCustom?: boolean;
}

/**
 * Result of template merge operation
 */
export interface MergeResult {
  /** The merged template content */
  content: string;
  /** Variables that were added */
  added: string[];
  /** Variables that were removed */
  removed: string[];
  /** Variables that were updated */
  updated: string[];
  /** Preserved custom variables */
  preserved: string[];
  /** Any warnings during merge */
  warnings: string[];
}

/**
 * Diff between two templates
 */
export interface TemplateDiff {
  /** New variables to add */
  additions: EnrichedVariable[];
  /** Variables to remove */
  removals: string[];
  /** Variables with changed metadata */
  updates: Array<{
    name: string;
    changes: string[];
  }>;
}

