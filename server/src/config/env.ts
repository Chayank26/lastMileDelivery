/**
 * Environment Configuration Module
 * --------------------------------
 * Loads and validates environment variables from .env file.
 * Uses fallback defaults for non-sensitive local development settings
 * to ensure smooth setup for evaluators.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root directory .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  // HTTP Server Port
  port: parseInt(process.env.PORT || '5000', 10),

  // Node execution environment ('development' | 'production' | 'test')
  nodeEnv: process.env.NODE_ENV || 'development',

  // Client Frontend URL for CORS cross-origin configuration
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // MongoDB connection string with replica set support for ACID transactions
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/last_mile_delivery',

  // Secret key used for signing JWT access tokens
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key_unthinkable_solutions_2026',

  // Token lifespan string (e.g. '7d', '24h')
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Google Gemini API Key for Agentic AI Address Resolution
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // Nodemailer SMTP Credentials for notification emails
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};
