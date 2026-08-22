/**
 * Order Creation & Tracking Controller
 * ------------------------------------
 * Handles order placement, rate engine evaluation, ACID transaction commitment,
 * immutable audit logging, and public tracking timeline queries.
 */

import { Request, Response } from 'express';
import { Order, OrderStatus, OrderType, PaymentType, FailureReasonCode } from '../models/Order.js';
import { Zone } from '../models/Zone.js';
import { RateCard } from '../models/RateCard.js';
import { OrderAuditLog } from '../models/OrderAuditLog.js';
import { User, UserRole } from '../models/User.js';
import { AgentProfile, AgentStatus } from '../models/AgentProfile.js';
import { calculateOrderPrice } from '../services/rateEngine.js';
import { executeAutoAssignment } from '../services/assignmentEngine.js';
import { detectZoneForCoordinates } from '../utils/geo.js';
import { generateTrackingId } from '../utils/trackingId.js';
import { isValidStatusTransition } from '../utils/stateMachine.js';
import { runInTransaction } from '../config/db.js';

/**
 * Controller: Create a New Delivery Order (Customer or Admin-on-behalf).
 * Uses MongoDB ACID session transaction (`runInTransaction`) to guarantee atomic
 * order saving and immutable audit log entry creation.
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const actor = req.user!;
    const {
      customerId, // Required if Admin is creating on behalf of customer
      pickupAddress, // { street, city, pincode, landmark, location: { coordinates: [lng, lat] } }
      dropAddress, // { street, city, pincode, landmark, location: { coordinates: [lng, lat] } }
      dimensions, // { lengthCm, widthCm, heightCm }
      actualWeightKg,
      orderType, // 'B2B' | 'B2C'
      paymentType, // 'PREPAID' | 'COD'
      codAmount = 0,
    } = req.body;

    // Validate essential inputs
    if (
      !pickupAddress?.location?.coordinates ||
      !dropAddress?.location?.coordinates ||
      !dimensions?.lengthCm ||
      !dimensions?.widthCm ||
      !dimensions?.heightCm ||
      actualWeightKg === undefined ||
      !orderType ||
      !paymentType
    ) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Pickup address, drop address, package dimensions, actualWeightKg, orderType, and paymentType are required.',
      });
      return;
    }

    // Determine target customer user ID
    let targetCustomerId = actor._id.toString();

    if (actor.role === UserRole.ADMIN && customerId) {
      const targetCustomer = await User.findById(customerId);
      if (!targetCustomer) {
        res.status(404).json({ error: 'Not Found', message: 'Target customer account not found.' });
        return;
      }
      targetCustomerId = targetCustomer._id.toString();
    }

    // 1. Fetch active zones and detect Pickup and Drop Zones via Turf.js
    const activeZones = await Zone.find({ isActive: true });

    const pickupLng = pickupAddress.location.coordinates[0];
    const pickupLat = pickupAddress.location.coordinates[1];
    const dropLng = dropAddress.location.coordinates[0];
    const dropLat = dropAddress.location.coordinates[1];

    const detectedPickupZone = detectZoneForCoordinates(pickupLng, pickupLat, activeZones);
    const detectedDropZone = detectZoneForCoordinates(dropLng, dropLat, activeZones);

    // 2. Fetch active default RateCard
    let rateCard = await RateCard.findOne({ isDefault: true, isActive: true });
    if (!rateCard) {
      rateCard = await RateCard.findOne({ isActive: true });
    }

    if (!rateCard) {
      res.status(500).json({
        error: 'Configuration Error',
        message: 'No active rate card available. Please ask Admin to configure a rate card.',
      });
      return;
    }

    // 3. Execute Pure Rate Calculation Engine
    const priceBreakdown = calculateOrderPrice({
      dimensions: {
        lengthCm: Number(dimensions.lengthCm),
        widthCm: Number(dimensions.widthCm),
        heightCm: Number(dimensions.heightCm),
      },
      actualWeightKg: Number(actualWeightKg),
      orderType: orderType as OrderType,
      paymentType: paymentType as PaymentType,
      codAmount: Number(codAmount),
      pickupZoneId: detectedPickupZone ? detectedPickupZone._id.toString() : null,
      dropZoneId: detectedDropZone ? detectedDropZone._id.toString() : null,
      rateCard,
    });

    const trackingId = generateTrackingId();

    // 4. Commit Order Creation and Immutable Audit Log in ACID Transaction Session
    const newOrder = await runInTransaction(async (session) => {
      const orderDocs = await Order.create(
        [
          {
            trackingId,
            customer: targetCustomerId,
            createdByAdmin: actor.role === UserRole.ADMIN ? actor._id : undefined,
            pickupAddress: {
              street: pickupAddress.street,
              city: pickupAddress.city,
              pincode: pickupAddress.pincode,
              landmark: pickupAddress.landmark,
              location: {
                type: 'Point',
                coordinates: [pickupLng, pickupLat],
              },
            },
            dropAddress: {
              street: dropAddress.street,
              city: dropAddress.city,
              pincode: dropAddress.pincode,
              landmark: dropAddress.landmark,
              location: {
                type: 'Point',
                coordinates: [dropLng, dropLat],
              },
            },
            pickupZone: detectedPickupZone ? detectedPickupZone._id : undefined,
            dropZone: detectedDropZone ? detectedDropZone._id : undefined,
            dimensions: {
              lengthCm: Number(dimensions.lengthCm),
              widthCm: Number(dimensions.widthCm),
              heightCm: Number(dimensions.heightCm),
            },
            actualWeightKg: Number(actualWeightKg),
            orderType,
            paymentType,
            codAmount: Number(codAmount),
            priceBreakdown,
            rateCardApplied: rateCard._id,
            status: OrderStatus.CREATED,
          },
        ],
        { session }
      );

      const createdOrder = orderDocs[0];

      // Write immutable event audit ledger entry
      await OrderAuditLog.create(
        [
          {
            orderId: createdOrder._id,
            previousStatus: undefined,
            newStatus: OrderStatus.CREATED,
            actorId: actor._id,
            actorRole: actor.role,
            action: 'ORDER_CREATED',
            payloadSnapshot: {
              trackingId,
              orderType,
              paymentType,
              priceBreakdown,
              pickupZone: detectedPickupZone?.name || 'Unzoned',
              dropZone: detectedDropZone?.name || 'Unzoned',
            },
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            timestamp: new Date(),
          },
        ],
        { session }
      );

      return createdOrder;
    });

    res.status(201).json({
      message: 'Order created successfully',
      trackingId: newOrder.trackingId,
      order: newOrder,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Query All Orders with Filtering and RBAC Scoping.
 * - Customer: Only sees orders created by / for their user ID.
 * - Agent: Only sees orders assigned to their agent user ID.
 * - Admin: Sees all orders; supports filtering by status, zone, and agent.
 */
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, zoneId, agentId, orderType } = req.query;

    const queryFilter: any = {};

    // Role-based scoping
    if (user.role === UserRole.CUSTOMER) {
      queryFilter.customer = user._id;
    } else if (user.role === UserRole.AGENT) {
      queryFilter.assignedAgent = user._id;
    }

    // Admin filters
    if (status) queryFilter.status = status;
    if (orderType) queryFilter.orderType = orderType;
    if (agentId) queryFilter.assignedAgent = agentId;
    if (zoneId) {
      queryFilter.$or = [{ pickupZone: zoneId }, { dropZone: zoneId }];
    }

    const orders = await Order.find(queryFilter)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name phone')
      .populate('pickupZone', 'name code colorHex')
      .populate('dropZone', 'name code colorHex')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: orders.length, orders });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Get Single Order Details by Document ID.
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name phone')
      .populate('pickupZone', 'name code colorHex')
      .populate('dropZone', 'name code colorHex')
      .populate('rateCardApplied', 'name volumetricDivisor baseFee');

    if (!order) {
      res.status(404).json({ error: 'Not Found', message: 'Order not found.' });
      return;
    }

    // Check authorization: Customer can only view own order
    if (req.user!.role === UserRole.CUSTOMER && order.customer._id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ error: 'Forbidden', message: 'Unauthorized access to this order.' });
      return;
    }

    // Fetch immutable audit trail for this order
    const auditLogs = await OrderAuditLog.find({ orderId: order._id })
      .populate('actorId', 'name role')
      .sort({ timestamp: 1 });

    res.status(200).json({ order, auditLogs });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Public / Customer Live Tracking by Tracking ID.
 * Returns order details and full chronological audit timeline.
 */
export const trackOrderByTrackingId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;

    const order = await Order.findOne({ trackingId: trackingId.toUpperCase() })
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name phone')
      .populate('pickupZone', 'name code colorHex')
      .populate('dropZone', 'name code colorHex');

    if (!order) {
      res.status(404).json({ error: 'Not Found', message: `No order found with Tracking ID: ${trackingId}` });
      return;
    }

    // Retrieve full immutable status history timeline
    const timeline = await OrderAuditLog.find({ orderId: order._id })
      .populate('actorId', 'name role')
      .sort({ timestamp: 1 });

    res.status(200).json({
      trackingId: order.trackingId,
      status: order.status,
      order,
      timeline,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Trigger Intelligent Nearest-Neighbor Auto-Assignment (`POST /api/orders/:id/auto-assign`).
 * Finds geographically closest available agent within capacity bounds and assigns order atomically.
 */
export const autoAssignOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const actor = req.user!;
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ error: 'Not Found', message: 'Order not found.' });
      return;
    }

    // Execute nearest-neighbor assignment engine inside ACID session transaction
    const result = await runInTransaction(async (session) => {
      const liveOrder = await Order.findById(order._id).session(session);
      if (!liveOrder) throw new Error('Order not found in transaction session.');
      return executeAutoAssignment(liveOrder, actor, session);
    });

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name phone');

    res.status(200).json({
      message: result.message,
      distanceKm: result.distanceKm,
      order: updatedOrder,
    });
  } catch (error: any) {
    res.status(422).json({
      error: 'Unprocessable Entity',
      message: error.message || 'Auto-assignment failed.',
    });
  }
};

/**
 * Controller: Manual Agent Assignment Override (`POST /api/orders/:id/assign`).
 * Allows Admin to directly assign a specific delivery agent to an order.
 */
export const manualAssignOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const actor = req.user!;
    const { agentId } = req.body;

    if (!agentId) {
      res.status(400).json({ error: 'Bad Request', message: 'Target agentId is required.' });
      return;
    }

    const targetUser = await User.findById(agentId);
    if (!targetUser || targetUser.role !== UserRole.AGENT) {
      res.status(400).json({ error: 'Bad Request', message: 'Target user is not a valid delivery agent.' });
      return;
    }

    const resultOrder = await runInTransaction(async (session) => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new Error('Order not found.');

      let agentProfile = await AgentProfile.findOne({ user: agentId }).session(session);

      if (!agentProfile) {
        // Auto-seed profile if missing
        const createdProfiles = await AgentProfile.create(
          [
            {
              user: agentId,
              status: AgentStatus.IDLE,
              maxConcurrentOrders: 3,
              currentActiveOrderCount: 0,
              currentLocation: { type: 'Point', coordinates: [77.0266, 28.4595] },
            },
          ],
          { session }
        );
        agentProfile = createdProfiles[0];
      }

      if (!agentProfile) {
        throw new Error('Failed to load or initialize target agent profile.');
      }

      // Check capacity bound
      if (agentProfile.currentActiveOrderCount >= agentProfile.maxConcurrentOrders) {
        throw new Error(`Agent ${targetUser.name} has reached maximum concurrent order capacity (${agentProfile.maxConcurrentOrders}).`);
      }

      agentProfile.currentActiveOrderCount += 1;
      if (agentProfile.currentActiveOrderCount >= agentProfile.maxConcurrentOrders) {
        agentProfile.status = AgentStatus.MAX_CAPACITY;
      } else {
        agentProfile.status = AgentStatus.EN_ROUTE_PICKUP;
      }
      await agentProfile.save({ session });

      const previousAgent = order.assignedAgent;
      order.assignedAgent = targetUser._id;
      order.assignedAt = new Date();
      await order.save({ session });

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
              assignedAgentId: targetUser._id,
              agentName: targetUser.name,
              assignmentType: 'MANUAL_OVERRIDE',
              previousAgentId: previousAgent,
            },
            timestamp: new Date(),
          },
        ],
        { session }
      );

      return order;
    });

    const populatedOrder = await Order.findById(resultOrder._id)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name phone');

    res.status(200).json({
      message: `Manually assigned order to agent ${targetUser.name}`,
      order: populatedOrder,
    });
  } catch (error: any) {
    res.status(422).json({
      error: 'Unprocessable Entity',
      message: error.message,
    });
  }
};

/**
 * Controller: Order Status Lifecycle State Transition (`PATCH /api/orders/:id/status`).
 * Enforces directed graph state machine validation, releases agent capacity on terminal/failed states,
 * and records immutable audit log entries in an ACID session transaction.
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const actor = req.user!;
    const { status, failureReasonCode, notes } = req.body;

    if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Valid target status is required. Permitted: [${Object.values(OrderStatus).join(', ')}]`,
      });
      return;
    }

    const targetStatus = status as OrderStatus;

    // Execute status transition and audit logging inside ACID session transaction
    const updatedOrder = await runInTransaction(async (session) => {
      const order = await Order.findById(req.params.id).session(session);

      if (!order) {
        throw new Error('Order not found.');
      }

      // Authorization Check: Delivery Agent can only update their assigned orders (Admin can update any)
      if (
        actor.role === UserRole.AGENT &&
        (!order.assignedAgent || order.assignedAgent.toString() !== actor._id.toString())
      ) {
        throw new Error('Forbidden: Delivery agents can only update status for orders assigned to them.');
      }

      // State Machine Directed Graph Validation
      if (!isValidStatusTransition(order.status, targetStatus)) {
        throw new Error(`Invalid status transition from '${order.status}' to '${targetStatus}'. State graph violation.`);
      }

      // Failure Reason Code requirement check
      if (targetStatus === OrderStatus.FAILED && !failureReasonCode) {
        throw new Error('Failure reason code (e.g. CUSTOMER_UNAVAILABLE, INCORRECT_ADDRESS) is mandatory when marking order as FAILED.');
      }

      const previousStatus = order.status;
      order.status = targetStatus;

      if (failureReasonCode && Object.values(FailureReasonCode).includes(failureReasonCode)) {
        order.failureReasonCode = failureReasonCode as FailureReasonCode;
      }

      await order.save({ session });

      // Handle Agent Capacity Release on Terminal or Failed States
      if (
        order.assignedAgent &&
        [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.FAILED].includes(targetStatus)
      ) {
        const agentProfile = await AgentProfile.findOne({ user: order.assignedAgent }).session(session);
        if (agentProfile) {
          agentProfile.currentActiveOrderCount = Math.max(0, agentProfile.currentActiveOrderCount - 1);

          // Restore agent status from MAX_CAPACITY to IDLE or EN_ROUTE_PICKUP
          if (agentProfile.status === AgentStatus.MAX_CAPACITY) {
            agentProfile.status = agentProfile.currentActiveOrderCount > 0 ? AgentStatus.EN_ROUTE_PICKUP : AgentStatus.IDLE;
          } else if (agentProfile.currentActiveOrderCount === 0) {
            agentProfile.status = AgentStatus.IDLE;
          }

          await agentProfile.save({ session });
        }
      }

      // Write immutable event audit log
      await OrderAuditLog.create(
        [
          {
            orderId: order._id,
            previousStatus,
            newStatus: targetStatus,
            actorId: actor._id,
            actorRole: actor.role,
            action: 'STATUS_UPDATED',
            payloadSnapshot: {
              previousStatus,
              newStatus: targetStatus,
              failureReasonCode: failureReasonCode || undefined,
              notes: notes || undefined,
            },
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            timestamp: new Date(),
          },
        ],
        { session }
      );

      return order;
    });

    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name phone')
      .populate('pickupZone', 'name code colorHex')
      .populate('dropZone', 'name code colorHex');

    res.status(200).json({
      message: `Order status updated from '${updatedOrder.status}' successfully`,
      order: populatedOrder,
    });
  } catch (error: any) {
    res.status(422).json({
      error: 'Unprocessable Entity',
      message: error.message,
    });
  }
};


