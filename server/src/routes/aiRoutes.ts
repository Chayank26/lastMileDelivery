/**
 * Agentic AI Express Routes
 * -------------------------
 * Routes for AI-powered logistics features.
 */

import { Router } from 'express';
import { parseAddress } from '../controllers/aiController.js';

const router = Router();

// Public / Authenticated Address Parser Endpoint
router.post('/parse-address', parseAddress);

export default router;
