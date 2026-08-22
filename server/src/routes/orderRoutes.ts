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
} from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public Live Tracking Timeline Endpoint (by trackingId)
router.get('/track/:trackingId', trackOrderByTrackingId);

// Authenticated Order Endpoints
router.use(authenticate);

router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/:id', getOrderById);

export default router;
