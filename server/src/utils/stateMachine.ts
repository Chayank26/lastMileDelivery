/**
 * Order Status State Machine Transition Validator
 * ------------------------------------------------
 * Enforces valid delivery status lifecycles to prevent impossible state skips
 * (e.g. transitioning directly from CREATED to DELIVERED without PICKED_UP).
 */

import { OrderStatus } from '../models/Order.js';

/**
 * Directed Graph of Permitted State Machine Transitions
 */
export const PERMITTED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.FAILED, OrderStatus.CANCELLED],
  [OrderStatus.FAILED]: [OrderStatus.RESCHEDULED, OrderStatus.CANCELLED],
  [OrderStatus.RESCHEDULED]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [], // Terminal State
  [OrderStatus.CANCELLED]: [], // Terminal State
};

/**
 * Validates whether a proposed status transition is legal according to the state graph.
 * 
 * @param currentStatus Current status of the order
 * @param targetStatus Proposed target status
 * @returns True if transition is permitted
 */
export const isValidStatusTransition = (
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): boolean => {
  if (currentStatus === targetStatus) return true; // No-op transition
  const allowedNextStates = PERMITTED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedNextStates.includes(targetStatus);
};
