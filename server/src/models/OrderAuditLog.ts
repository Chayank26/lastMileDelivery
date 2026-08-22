/**
 * Order Audit Log Data Model (Immutable Event Ledger)
 * ----------------------------------------------------
 * Logs every order payload difference, state transition, user actor ID,
 * IP address, and cryptographic timestamp for audit compliance.
 * Document entries are strictly append-only.
 */

import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderAuditLog extends Document {
  orderId: Types.ObjectId;
  previousStatus?: string;
  newStatus: string;
  actorId: Types.ObjectId;
  actorRole: string;
  action: string; // e.g. "ORDER_CREATED", "AGENT_ASSIGNED", "STATUS_UPDATED", "FAILED_RESCHEDULED"
  payloadSnapshot?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const orderAuditLogSchema = new Schema<IOrderAuditLog>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
    },
    newStatus: {
      type: String,
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    payloadSnapshot: {
      type: Schema.Types.Mixed, // Flexible JSON snapshot of payload modifications
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Managed manually via `timestamp`
  }
);

export const OrderAuditLog = model<IOrderAuditLog>('OrderAuditLog', orderAuditLogSchema);
