/**
 * Order Data Model
 * ----------------
 * Core entity representing a package shipment across its complete lifecycle.
 * Encapsulates addresses, dimensions, volumetric calculations, rate breakdown,
 * assigned delivery agent, failure diagnostics, and rescheduling history.
 */

import { Schema, model, Document, Types } from 'mongoose';

export enum OrderType {
  B2B = 'B2B',
  B2C = 'B2C',
}

export enum PaymentType {
  PREPAID = 'PREPAID',
  COD = 'COD',
}

export enum OrderStatus {
  CREATED = 'CREATED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
}

export enum FailureReasonCode {
  CUSTOMER_UNAVAILABLE = 'CUSTOMER_UNAVAILABLE',
  INCORRECT_ADDRESS = 'INCORRECT_ADDRESS',
  CASH_UNAVAILABLE_COD = 'CASH_UNAVAILABLE_COD',
  ACCESS_RESTRICTED = 'ACCESS_RESTRICTED',
  OTHER = 'OTHER',
}

export interface IAddress {
  street: string;
  city: string;
  pincode: string;
  landmark?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface IPackageDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface IPriceBreakdown {
  actualWeightKg: number;
  volumetricWeightKg: number;
  billableWeightKg: number; // max(actual, volumetric)
  volumetricDivisorUsed: number; // e.g. 5000
  isInterZone: boolean;
  ratePerKgApplied: number;
  baseFee: number;
  weightFee: number;
  codSurcharge: number;
  totalCharge: number;
}

export interface IRescheduleAttempt {
  attemptNumber: number;
  rescheduledDate: Date;
  reasonCode: FailureReasonCode;
  notes?: string;
  previousAgentId?: Types.ObjectId;
  newAgentId?: Types.ObjectId;
  createdAt: Date;
}

export interface IOrder extends Document {
  trackingId: string; // Public unique tracking reference (e.g. "ORD-2026-98214")
  customer: Types.ObjectId; // User account (role: CUSTOMER)
  createdByAdmin?: Types.ObjectId; // Admin account if created on behalf
  
  pickupAddress: IAddress;
  dropAddress: IAddress;

  pickupZone?: Types.ObjectId; // Auto-detected via Turf.js point-in-polygon
  dropZone?: Types.ObjectId; // Auto-detected via Turf.js point-in-polygon

  dimensions: IPackageDimensions;
  actualWeightKg: number;
  orderType: OrderType;
  paymentType: PaymentType;
  codAmount: number;

  priceBreakdown: IPriceBreakdown;
  rateCardApplied: Types.ObjectId;

  status: OrderStatus;
  assignedAgent?: Types.ObjectId;
  assignedAt?: Date;

  failureReasonCode?: FailureReasonCode;
  rescheduleHistory: IRescheduleAttempt[];

  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  },
  { _id: false }
);

const priceBreakdownSchema = new Schema<IPriceBreakdown>(
  {
    actualWeightKg: { type: Number, required: true },
    volumetricWeightKg: { type: Number, required: true },
    billableWeightKg: { type: Number, required: true },
    volumetricDivisorUsed: { type: Number, required: true, default: 5000 },
    isInterZone: { type: Boolean, required: true },
    ratePerKgApplied: { type: Number, required: true },
    baseFee: { type: Number, required: true },
    weightFee: { type: Number, required: true },
    codSurcharge: { type: Number, required: true, default: 0 },
    totalCharge: { type: Number, required: true },
  },
  { _id: false }
);

const rescheduleAttemptSchema = new Schema<IRescheduleAttempt>(
  {
    attemptNumber: { type: Number, required: true },
    rescheduledDate: { type: Date, required: true },
    reasonCode: { type: String, enum: Object.values(FailureReasonCode), required: true },
    notes: { type: String, trim: true },
    previousAgentId: { type: Schema.Types.ObjectId, ref: 'User' },
    newAgentId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdByAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    pickupAddress: {
      type: addressSchema,
      required: true,
    },
    dropAddress: {
      type: addressSchema,
      required: true,
    },
    pickupZone: {
      type: Schema.Types.ObjectId,
      ref: 'Zone',
      index: true,
    },
    dropZone: {
      type: Schema.Types.ObjectId,
      ref: 'Zone',
      index: true,
    },
    dimensions: {
      lengthCm: { type: Number, required: true, min: 0.1 },
      widthCm: { type: Number, required: true, min: 0.1 },
      heightCm: { type: Number, required: true, min: 0.1 },
    },
    actualWeightKg: {
      type: Number,
      required: true,
      min: 0.01,
    },
    orderType: {
      type: String,
      enum: Object.values(OrderType),
      required: true,
    },
    paymentType: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
    },
    codAmount: {
      type: Number,
      default: 0,
    },
    priceBreakdown: {
      type: priceBreakdownSchema,
      required: true,
    },
    rateCardApplied: {
      type: Schema.Types.ObjectId,
      ref: 'RateCard',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.CREATED,
      index: true,
    },
    assignedAgent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedAt: {
      type: Date,
    },
    failureReasonCode: {
      type: String,
      enum: Object.values(FailureReasonCode),
    },
    rescheduleHistory: [rescheduleAttemptSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for fast Admin filtering by Zone and Status
orderSchema.index({ pickupZone: 1, status: 1 });
orderSchema.index({ dropZone: 1, status: 1 });

export const Order = model<IOrder>('Order', orderSchema);
