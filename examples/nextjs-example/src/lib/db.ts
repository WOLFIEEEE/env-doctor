// Example: Server-side database connection
// This file demonstrates proper server-only env var usage

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export async function query(sql: string, params?: unknown[]) {
  // Simulated database query
  console.log('Executing query:', sql, params);
  return [];
}

export const db = {
  query,
  connectionString: DATABASE_URL,
};

