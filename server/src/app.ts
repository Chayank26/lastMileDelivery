/**
 * Express Application Bootstrapper
 * --------------------------------
 * Configures global middlewares (CORS, JSON body parser), system health-check
 * endpoints, root route handler, and centralized error catching.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import zoneRoutes from './routes/zoneRoutes.js';
import rateCardRoutes from './routes/rateCardRoutes.js';

// Initialize core Express app instance
const app = express();

/**
 * Global Middlewares Configuration
 */

// 1. CORS: Allow cross-origin requests from the React frontend SPA
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 2. Body Parser: Parse incoming JSON request payloads (max 10mb limit for GeoJSON uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Route Mounting
 */
app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/rates', rateCardRoutes);

/**
 * Base Diagnostics & Health Routes
 */

// Root baseline route
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Last-Mile Delivery Management API',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    documentation: '/docs',
  });
});

// Dedicated health-check route for monitoring services (e.g. Render, Railway health probes)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Centralized Unhandled Route & Error Handling Middleware
 */

// Catch-all 404 handler for undefined API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route Not Found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Centralized error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER ERROR]:', err.stack || err.message);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred.',
  });
});

export default app;
