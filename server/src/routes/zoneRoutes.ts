/**
 * Zone Management Express Routes
 * ------------------------------
 * Routes for GeoJSON polygon delivery zones, spatial detection, and seed utilities.
 */

import { Router } from 'express';
import {
  createZone,
  getAllZones,
  getZoneById,
  updateZone,
  deleteZone,
  detectZoneByPoint,
  seedSampleZones,
} from '../controllers/zoneController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = Router();

// Public / Client Read-Only & Detection Endpoints
router.get('/', getAllZones);
router.get('/:id', getZoneById);
router.post('/detect', detectZoneByPoint);

// Admin-Only Zone Management Routes
router.post('/', authenticate, requireRole(UserRole.ADMIN), createZone);
router.put('/:id', authenticate, requireRole(UserRole.ADMIN), updateZone);
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), deleteZone);
router.post('/seed', authenticate, requireRole(UserRole.ADMIN), seedSampleZones);

export default router;
