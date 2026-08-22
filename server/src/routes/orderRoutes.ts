/**
 * Order Management Express Routes
 * -------------------------------
 * Routes for order creation, multi-filter querying, single order detail retrieval,
 * and public tracking timeline lookups.
 */

import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  trackOrderByTrackingId,
  autoAssignOrder,
  manualAssignOrder,
} from '../controllers/orderController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = Router();

// Public Live Tracking Timeline Endpoint (by trackingId)
router.get('/track/:trackingId', trackOrderByTrackingId);

// Authenticated Order Endpoints
router.use(authenticate);

router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/:id', getOrderById);

// Agent Assignment Endpoints (Admin only)
router.post('/:id/auto-assign', requireRole(UserRole.ADMIN), autoAssignOrder);
router.post('/:id/assign', requireRole(UserRole.ADMIN), manualAssignOrder);

export default router;
