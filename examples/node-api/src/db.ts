// Example: Database module using env vars

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

// Simulated database connection
export const db = {
  async query(sql: string): Promise<unknown[]> {
    console.log(`[DB] Executing: ${sql}`);
    // Simulated response
    return [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];
  },
  
  async close(): Promise<void> {
    console.log('[DB] Connection closed');
  },
};

// Connection info (redacted for logs)
console.log(`[DB] Connected to: ${DATABASE_URL.replace(/:\/\/.*@/, '://***@')}`);

