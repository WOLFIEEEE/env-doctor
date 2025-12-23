// Example: Node.js API server
// This demonstrates comprehensive env var usage

import express from 'express';
import { config } from './config.js';
import { db } from './db.js';

const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Example protected endpoint
app.get('/api/data', async (req, res) => {
  try {
    const data = await db.query('SELECT * FROM items LIMIT 10');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Log level: ${config.logLevel}`);
});

