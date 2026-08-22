/**
 * Delivery Agent Management Express Routes
 * -----------------------------------------
 * Routes for agent list queries and location/status updates.
 */

import { Router } from 'express';
import { getAllAgents, updateAgentStatus } from '../controllers/agentController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = Router();

router.use(authenticate);

// List all active delivery agents (Admin only)
router.get('/', requireRole(UserRole.ADMIN), getAllAgents);

// Update current agent location & status (Agent role)
router.put('/status', requireRole(UserRole.AGENT, UserRole.ADMIN), updateAgentStatus);

export default router;
