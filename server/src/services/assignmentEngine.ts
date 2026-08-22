/**
 * Deterministic Agent Auto-Assignment Engine
 * -------------------------------------------
 * Intelligent agent assignment engine utilizing:
 * 1. Concurrency Capacity Bounds (`currentActiveOrderCount < maxConcurrentOrders`)
 * 2. Primary Zone Alignment (Prefers agents assigned to order's pickup zone)
 * 3. Greedy Haversine Distance Calculation (Finds geographically closest available agent)
 * 4. ACID Transaction Isolation (`runInTransaction`) to prevent concurrent assignment race conditions
 */

import { ClientSession } from 'mongoose';
import { Order, IOrder } from '../models/Order.js';
import { AgentProfile, IAgentProfile, AgentStatus } from '../models/AgentProfile.js';
import { OrderAuditLog } from '../models/OrderAuditLog.js';
import { calculateHaversineDistanceKm } from '../utils/geo.js';
import { IUser, UserRole } from '../models/User.js';

export interface IAssignmentResult {
  success: boolean;
  assignedAgent: IAgentProfile;
  distanceKm: number;
  message: string;
}

/**
 * Finds geographically nearest available delivery agent and atomically commits assignment inside an ACID transaction session.
 * 
 * @param order Target Order document
 * @param actor User triggering the assignment (Admin or System)
 * @param session Active Mongoose ClientSession for transaction isolation
 */
export const executeAutoAssignment = async (
  order: IOrder,
  actor: IUser,
  session: ClientSession
): Promise<IAssignmentResult> => {
  // 1. Query candidate agents who are active and have available capacity
  const candidateAgents = await AgentProfile.find({
    isActive: true,
    status: { $nin: [AgentStatus.OFFLINE, AgentStatus.MAX_CAPACITY] },
  })
    .populate('user', 'name email phone role')
    .session(session);

  if (!candidateAgents || candidateAgents.length === 0) {
    throw new Error('No active delivery agents found in system.');
  }

  // Filter out agents who have reached max capacity
  const availableAgents = candidateAgents.filter(
    (agent) => agent.currentActiveOrderCount < agent.maxConcurrentOrders
  );

  if (availableAgents.length === 0) {
    throw new Error('All delivery agents are currently at maximum capacity.');
  }

  const pickupLocation = order.pickupAddress.location.coordinates; // [lng, lat]

  // 2. Rank candidate agents using Greedy Haversine distance and Zone alignment
  let bestAgent: IAgentProfile | null = null;
  let minDistanceKm = Infinity;

  for (const agent of availableAgents) {
    const agentLocation = agent.currentLocation.coordinates; // [lng, lat]
    const distanceKm = calculateHaversineDistanceKm(agentLocation, pickupLocation);

    // Give a 2.0 km bonus (distance reduction) if agent is assigned to the exact pickup zone
    const zoneBonus =
      order.pickupZone &&
      agent.assignedZone &&
      order.pickupZone.toString() === agent.assignedZone.toString()
        ? 2.0
        : 0.0;

    const effectiveScore = Math.max(0, distanceKm - zoneBonus);

    if (effectiveScore < minDistanceKm) {
      minDistanceKm = distanceKm;
      bestAgent = agent;
    }
  }

  if (!bestAgent) {
    throw new Error('Unable to select a candidate delivery agent.');
  }

  // 3. Atomically update AgentProfile document within ACID transaction session
  bestAgent.currentActiveOrderCount += 1;

  // Transition agent status if capacity limit reached
  if (bestAgent.currentActiveOrderCount >= bestAgent.maxConcurrentOrders) {
    bestAgent.status = AgentStatus.MAX_CAPACITY;
  } else if (bestAgent.status === AgentStatus.IDLE) {
    bestAgent.status = AgentStatus.EN_ROUTE_PICKUP;
  }

  await bestAgent.save({ session });

  // 4. Update Order document
  order.assignedAgent = bestAgent.user._id;
  order.assignedAt = new Date();
  await order.save({ session });

  // 5. Append immutable event audit log
  await OrderAuditLog.create(
    [
      {
        orderId: order._id,
        previousStatus: order.status,
        newStatus: order.status,
        actorId: actor._id,
        actorRole: actor.role,
        action: 'AGENT_ASSIGNED',
        payloadSnapshot: {
          assignedAgentId: bestAgent.user._id,
          agentName: (bestAgent.user as any)?.name || 'Delivery Agent',
          distanceKm: Math.round(minDistanceKm * 100) / 100,
          concurrencyState: `${bestAgent.currentActiveOrderCount}/${bestAgent.maxConcurrentOrders}`,
        },
        timestamp: new Date(),
      },
    ],
    { session }
  );

  return {
    success: true,
    assignedAgent: bestAgent,
    distanceKm: Math.round(minDistanceKm * 100) / 100,
    message: `Assigned to agent ${(bestAgent.user as any)?.name || 'Agent'} (${Math.round(minDistanceKm * 10) / 10} km away)`,
  };
};
