/**
 * Tracking ID Generator Utility
 * -----------------------------
 * Generates human-readable, collision-resistant tracking IDs for orders.
 * Format: ORD-YYYY-XXXXXX (e.g., ORD-2026-K92A8F)
 */

import crypto from 'crypto';

export const generateTrackingId = (): string => {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 character hex
  return `ORD-${year}-${randomHex}`;
};
