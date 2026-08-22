/**
 * Agent Profile Data Model
 * -----------------------
 * Models delivery agent state machines, real-time spatial locations,
 * assigned primary zones, and active concurrency capacity bounds.
 */

import { Schema, model, Document, Types } from 'mongoose';

export enum AgentStatus {
  OFFLINE = 'OFFLINE',
  IDLE = 'IDLE',
  EN_ROUTE_PICKUP = 'EN_ROUTE_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  MAX_CAPACITY = 'MAX_CAPACITY',
}

export interface IPointGeometry {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IAgentProfile extends Document {
  user: Types.ObjectId; // Reference to User account (role: AGENT)
  assignedZone?: Types.ObjectId; // Primary assigned zone
  currentLocation: IPointGeometry;
  status: AgentStatus;
  maxConcurrentOrders: number; // e.g. 3 active packages
  currentActiveOrderCount: number;
  vehicleType: 'BIKE' | 'SCOOTER' | 'VAN' | 'TRUCK';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const agentProfileSchema = new Schema<IAgentProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    assignedZone: {
      type: Schema.Types.ObjectId,
      ref: 'Zone',
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [77.0266, 28.4595], // Default coordinates (Gurgaon Hub)
      },
    },
    status: {
      type: String,
      enum: Object.values(AgentStatus),
      default: AgentStatus.IDLE,
      index: true,
    },
    maxConcurrentOrders: {
      type: Number,
      default: 3, // Concurrency limit
      required: true,
    },
    currentActiveOrderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    vehicleType: {
      type: String,
      enum: ['BIKE', 'SCOOTER', 'VAN', 'TRUCK'],
      default: 'BIKE',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere Spatial Index for Haversine nearest-neighbor agent lookups ($nearSphere)
agentProfileSchema.index({ currentLocation: '2dsphere' });

export const AgentProfile = model<IAgentProfile>('AgentProfile', agentProfileSchema);
