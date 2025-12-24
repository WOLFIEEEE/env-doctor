/**
 * @fileoverview Runtime validation for environment variables
 * 
 * @example
 * ```typescript
 * import { createEnv } from '@theaccessibleteam/env-doctor/runtime';
 * 
 * export const env = createEnv({
 *   server: {
 *     DATABASE_URL: { type: 'url', required: true },
 *     PORT: { type: 'number', default: 3000 },
 *   },
 *   client: {
 *     NEXT_PUBLIC_API_URL: { type: 'url', required: true },
 *   },
 *   framework: 'nextjs',
 * });
 * 
 * // Fully typed!
 * console.log(env.PORT); // number
 * console.log(env.DATABASE_URL); // string
 * ```
 */

import type {
  EnvConfig,
  VariableSchema,
  ValidationError,
  InferEnv,
} from './types.js';
import { validateVariable, formatValidationErrors } from './validators.js';

export * from './types.js';
export { validateVariable, formatValidationErrors } from './validators.js';

// Store for mocked env values (testing)
let mockedEnv: Record<string, string> | null = null;

/**
 * Create a typed, validated environment object
 */
export function createEnv<
  TServer extends Record<string, VariableSchema>,
  TClient extends Record<string, VariableSchema>
>(
  config: EnvConfig<TServer, TClient>
): InferEnv<EnvConfig<TServer, TClient>> {
  const {
    server = {} as TServer,
    client = {} as TClient,
    framework = 'auto',
    skipValidation = false,
    onValidationError,
  } = config;

  // Skip validation if requested
  if (skipValidation) {
    return createProxyEnv(server, client);
  }

  // Detect framework if auto
  const detectedFramework = framework === 'auto' ? detectFramework() : framework;

  // Get runtime env accessor
  const runtimeEnv = getRuntimeEnv();

  // Validate all variables
  const errors: ValidationError[] = [];
  const values: Record<string, unknown> = {};

  // Validate server variables
  for (const [name, schema] of Object.entries(server)) {
    const rawValue = mockedEnv?.[name] ?? runtimeEnv[name];
    const { value, error } = validateVariable(name, rawValue, schema);
    
    if (error) {
      errors.push(error);
    }
    values[name] = value;
  }

  // Validate client variables
  for (const [name, schema] of Object.entries(client)) {
    // Verify client variable has correct prefix
    const prefix = getClientPrefix(detectedFramework);
    if (prefix && !name.startsWith(prefix)) {
      errors.push({
        variable: name,
        message: `Client variable must start with "${prefix}"`,
        expected: `${prefix}*`,
        received: name,
      });
    }

    const rawValue = mockedEnv?.[name] ?? runtimeEnv[name];
    const { value, error } = validateVariable(name, rawValue, schema);
    
    if (error) {
      errors.push(error);
    }
    values[name] = value;
  }

  // Handle errors
  if (errors.length > 0) {
    if (onValidationError) {
      onValidationError(errors);
    } else {
      // Default behavior: log and exit
      console.error(formatValidationErrors(errors));
      
      // Only exit in Node.js environment
      if (typeof process !== 'undefined' && process.exit) {
        process.exit(1);
      } else {
        throw new Error('Environment validation failed');
      }
    }
  }

  return values as InferEnv<EnvConfig<TServer, TClient>>;
}

/**
 * Create a proxy that reads from process.env (for skip mode)
 */
function createProxyEnv<
  TServer extends Record<string, VariableSchema>,
  TClient extends Record<string, VariableSchema>
>(
  server: TServer,
  client: TClient
): InferEnv<EnvConfig<TServer, TClient>> {
  const runtimeEnv = getRuntimeEnv();

  return new Proxy({} as InferEnv<EnvConfig<TServer, TClient>>, {
    get(_target, prop: string) {
      const schema = server[prop] || client[prop];
      if (!schema) {
        return undefined;
      }

      const rawValue = mockedEnv?.[prop] ?? runtimeEnv[prop];
      const { value } = validateVariable(prop, rawValue, schema);
      return value;
    },
  });
}

/**
 * Get the runtime environment object
 */
function getRuntimeEnv(): Record<string, string | undefined> {
  // Node.js
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }

  // Vite (import.meta.env)
  // @ts-expect-error - import.meta.env may not exist
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-expect-error - import.meta.env may not exist
    return import.meta.env;
  }

  // Fallback
  return {};
}

/**
 * Detect the framework from the environment
 */
function detectFramework(): 'nextjs' | 'vite' | 'cra' | 'node' {
  const env = getRuntimeEnv();

  // Check for Next.js
  if (env.NEXT_RUNTIME || env.__NEXT_PROCESSED_ENV) {
    return 'nextjs';
  }

  // Check for Vite
  if (env.VITE_USER_NODE_ENV !== undefined || env.MODE !== undefined) {
    return 'vite';
  }

  // Check for CRA
  if (env.REACT_APP_ENV !== undefined) {
    return 'cra';
  }

  return 'node';
}

/**
 * Get client prefix for framework
 */
function getClientPrefix(framework: string): string {
  const prefixes: Record<string, string> = {
    nextjs: 'NEXT_PUBLIC_',
    vite: 'VITE_',
    cra: 'REACT_APP_',
    node: '',
  };
  return prefixes[framework] || '';
}

/**
 * Mock environment variables for testing
 */
export function mockEnv(values: Record<string, string | number | boolean>): void {
  mockedEnv = {};
  for (const [key, value] of Object.entries(values)) {
    mockedEnv[key] = String(value);
  }
}

/**
 * Restore original environment (clear mocks)
 */
mockEnv.restore = function restore(): void {
  mockedEnv = null;
};

/**
 * Check if environment is mocked
 */
mockEnv.isMocked = function isMocked(): boolean {
  return mockedEnv !== null;
};

/**
 * Create a schema helper for better type inference
 */
export function defineSchema<T extends VariableSchema>(schema: T): T {
  return schema;
}

/**
 * Create server schema helper
 */
export function serverSchema<T extends Record<string, VariableSchema>>(schema: T): T {
  return schema;
}

/**
 * Create client schema helper
 */
export function clientSchema<T extends Record<string, VariableSchema>>(schema: T): T {
  return schema;
}

