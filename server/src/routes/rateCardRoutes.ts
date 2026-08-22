/**
 * Rate Card Management & Simulator Express Routes
 * -----------------------------------------------
 * Routes for pricing rate cards and the real-time simulation sandbox.
 */

import { Router } from 'express';
import {
  getActiveRateCard,
  getAllRateCards,
  createRateCard,
  updateRateCard,
  simulateRate,
  seedDefaultRateCard,
} from '../controllers/rateCardController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = Router();

// Public / Client Read-Only & Simulation Endpoints
router.get('/active', getActiveRateCard);
router.post('/simulate', simulateRate);

// Admin-Only Rate Card Management Routes
router.get('/', authenticate, requireRole(UserRole.ADMIN), getAllRateCards);
router.post('/', authenticate, requireRole(UserRole.ADMIN), createRateCard);
router.put('/:id', authenticate, requireRole(UserRole.ADMIN), updateRateCard);
router.post('/seed', authenticate, requireRole(UserRole.ADMIN), seedDefaultRateCard);

export default router;
