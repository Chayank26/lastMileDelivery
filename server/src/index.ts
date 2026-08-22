/**
 * Server Entrypoint
 * -----------------
 * Binds the Express app instance to an HTTP server listener port.
 * Handles graceful shutdown on system signals (SIGINT, SIGTERM).
 */

import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/db.js';

// Create HTTP server wrapping Express application
const server = http.createServer(app);

// Connect to MongoDB and start HTTP listener
connectDatabase().then(() => {
  server.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Last-Mile Delivery API Server running on port ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Healthcheck: http://localhost:${config.port}/health`);
    console.log(`=======================================================`);
  });
});

/**
 * Graceful Shutdown Handler
 * Ensures pending requests complete before process exit.
 */
const gracefulShutdown = (signal: string) => {
  console.log(`\n[${signal}] Received shutdown signal. Closing HTTP server...`);
  server.close(() => {
    console.log('HTTP server closed successfully. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
