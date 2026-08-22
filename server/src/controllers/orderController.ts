/**
 * Order Creation & Tracking Controller
 * ------------------------------------
 * Handles order placement, rate engine evaluation, ACID transaction commitment,
 * immutable audit logging, and public tracking timeline queries.
 */

import { Request, Response } from 'express';
import { Order, OrderStatus, OrderType, PaymentType } from '../models/Order.js';
import { Zone } from '../models/Zone.js';
import { RateCard } from '../models/RateCard.js';
import { OrderAuditLog } from '../models/OrderAuditLog.js';
import { User, UserRole } from '../models/User.js';
import { calculateOrderPrice } from '../services/rateEngine.js';
import { detectZoneForCoordinates } from '../utils/geo.js';
import { generateTrackingId } from '../utils/trackingId.js';
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
