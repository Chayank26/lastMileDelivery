/**
 * Authentication Express Routes
 * -----------------------------
 * Maps HTTP requests to authentication controller handlers.
 * 
 * Endpoints:
 * - POST /api/auth/register    -> Register new customer
 * - POST /api/auth/login       -> Standard email/password login
 * - POST /api/auth/demo-login  -> Evaluator 1-Click Demo Role Switcher
 * - GET  /api/auth/me          -> Get profile of authenticated user
 */

import { Router } from 'express';
import { register, login, demoLogin, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);

// Protected Profile Endpoint
router.get('/me', authenticate, getMe);

export default router;
