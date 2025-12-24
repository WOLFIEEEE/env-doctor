/**
 * @fileoverview Types for runtime validation
 */

/**
 * Base variable schema
 */
export interface BaseVariableSchema {
  /** Whether this variable is required */
  required?: boolean;
  /** Default value if not provided */
  default?: unknown;
  /** Description for documentation and error messages */
  description?: string;
}

/**
 * String variable schema
 */
export interface StringSchema extends BaseVariableSchema {
  type: 'string';
  /** Allowed values */
  enum?: readonly string[];
  /** Pattern to match */
  pattern?: RegExp;
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** Transform function */
  transform?: (value: string) => string;
}

/**
 * Number variable schema
 */
export interface NumberSchema extends BaseVariableSchema {
  type: 'number';
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Must be an integer */
  integer?: boolean;
}

/**
 * Boolean variable schema
 */
export interface BooleanSchema extends BaseVariableSchema {
  type: 'boolean';
}

/**
 * URL variable schema
 */
export interface UrlSchema extends BaseVariableSchema {
  type: 'url';
  /** Allowed protocols */
  protocols?: string[];
}

/**
 * Email variable schema
 */
export interface EmailSchema extends BaseVariableSchema {
  type: 'email';
}

/**
 * JSON variable schema
 */
export interface JsonSchema extends BaseVariableSchema {
  type: 'json';
}

/**
 * Array variable schema
 */
export interface ArraySchema extends BaseVariableSchema {
  type: 'array';
  /** Separator character */
  separator?: string;
  /** Type of items */
  itemType?: 'string' | 'number';
  /** Minimum number of items */
  minItems?: number;
  /** Maximum number of items */
  maxItems?: number;
}

/**
 * Union of all variable schemas
 */
export type VariableSchema =
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | UrlSchema
  | EmailSchema
  | JsonSchema
  | ArraySchema;

/**
 * Configuration for createEnv
 */
export interface EnvConfig<
  TServer extends Record<string, VariableSchema> = Record<string, VariableSchema>,
  TClient extends Record<string, VariableSchema> = Record<string, VariableSchema>
> {
  /** Server-side variables */
  server?: TServer;
  /** Client-side variables */
  client?: TClient;
  /** Framework for client/server separation */
  framework?: 'nextjs' | 'vite' | 'cra' | 'node' | 'auto';
  /** Runtime accessor (e.g., import.meta.env for Vite) */
  runtimeAccessor?: 'process.env' | 'import.meta.env';
  /** Custom error handler */
  onValidationError?: (errors: ValidationError[]) => void;
  /** Skip validation (for testing) */
  skipValidation?: boolean;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Variable name */
  variable: string;
  /** Error message */
  message: string;
  /** Expected type/format */
  expected?: string;
  /** Received value (redacted for secrets) */
  received?: string;
}

/**
 * Type inference helpers
 */
export type InferSchemaType<T extends VariableSchema> = 
  T extends StringSchema ? (T['enum'] extends readonly string[] ? T['enum'][number] : string) :
  T extends NumberSchema ? number :
  T extends BooleanSchema ? boolean :
  T extends UrlSchema ? string :
  T extends EmailSchema ? string :
  T extends JsonSchema ? unknown :
  T extends ArraySchema ? (T['itemType'] extends 'number' ? number[] : string[]) :
  never;

/**
 * Infer the full env type from config
 */
export type InferEnv<T extends EnvConfig> = 
  (T['server'] extends Record<string, VariableSchema> 
    ? { [K in keyof T['server']]: InferSchemaType<T['server'][K]> }
    : Record<string, never>) &
  (T['client'] extends Record<string, VariableSchema>
    ? { [K in keyof T['client']]: InferSchemaType<T['client'][K]> }
    : Record<string, never>);

/**
 * Client prefix patterns for frameworks
 */
export const CLIENT_PREFIXES: Record<string, string> = {
  nextjs: 'NEXT_PUBLIC_',
  vite: 'VITE_',
  cra: 'REACT_APP_',
  node: '',
};

