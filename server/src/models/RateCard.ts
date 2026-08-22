/**
 * Dynamic Rate Card Data Model
 * ----------------------------
 * Eliminates pricing hardcoding by storing configurable base rates,
 * volumetric divisors, intra/inter-zone multipliers, and COD surcharge rules.
 */

import { Schema, model, Document } from 'mongoose';

export interface IRateCard extends Document {
  name: string; // e.g. "Standard Enterprise Rate Card 2026"
  isDefault: boolean;

  // Volumetric divisor rule (Standard: 5000 cm³/kg; Admin can tweak to 4000/6000)
  volumetricDivisor: number;

  // Base fixed operational charge per order
  baseFee: number;

  // Intra-zone flat rate per billable kg (pickup & drop in SAME zone)
  intraZoneB2BRatePerKg: number;
  intraZoneB2CRatePerKg: number;

  // Inter-zone flat rate per billable kg (pickup & drop in DIFFERENT zones)
  interZoneB2BRatePerKg: number;
  interZoneB2CRatePerKg: number;

  // COD (Cash on Delivery) Surcharge Rules
  codSurchargeB2B: number; // Flat fee or percentage multiplier
  codSurchargeB2C: number;
  codPercentageFee: number; // e.g. 0.02 (2% of COD collection amount)

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const rateCardSchema = new Schema<IRateCard>(
  {
    name: {
      type: String,
      required: [true, 'Rate card name is required'],
      unique: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    volumetricDivisor: {
      type: Number,
      default: 5000, // (Length × Width × Height) / 5000
      required: true,
    },
    baseFee: {
      type: Number,
      default: 50, // Base flat delivery fee in currency units (INR)
      required: true,
    },
    intraZoneB2BRatePerKg: {
      type: Number,
      default: 30, // ₹30 per kg for intra-zone B2B shipments
      required: true,
    },
    intraZoneB2CRatePerKg: {
      type: Number,
      default: 40, // ₹40 per kg for intra-zone B2C shipments
      required: true,
    },
    interZoneB2BRatePerKg: {
      type: Number,
      default: 60, // ₹60 per kg for inter-zone B2B shipments
      required: true,
    },
    interZoneB2CRatePerKg: {
      type: Number,
      default: 80, // ₹80 per kg for inter-zone B2C shipments
      required: true,
    },
    codSurchargeB2B: {
      type: Number,
      default: 25, // ₹25 flat surcharge for B2B COD orders
      required: true,
    },
    codSurchargeB2C: {
      type: Number,
      default: 15, // ₹15 flat surcharge for B2C COD orders
      required: true,
    },
    codPercentageFee: {
      type: Number,
      default: 0.015, // 1.5% fee on collected cash amount
      required: true,
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

export const RateCard = model<IRateCard>('RateCard', rateCardSchema);
