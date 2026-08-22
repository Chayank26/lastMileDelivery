/**
 * Dynamic Rate Calculation Engine (Pure Core Logic)
 * --------------------------------------------------
 * Side-effect-free pricing engine that calculates logistics charges according to:
 * 1. Volumetric Weight: (L × B × H) / volumetricDivisor
 * 2. Billable Weight: Max(actualWeight, volumetricWeight)
 * 3. Spatial Zone Rate Card: Intra-Zone vs Inter-Zone rates for B2B and B2C
 * 4. Payment Surcharges: Flat & percentage COD fees
 */

import { IRateCard } from '../models/RateCard.js';
import { OrderType, PaymentType, IPackageDimensions, IPriceBreakdown } from '../models/Order.js';

export interface IRateCalculationParams {
  dimensions: IPackageDimensions; // Length, Width, Height in cm
  actualWeightKg: number; // Actual weight in kg
  orderType: OrderType; // B2B or B2C
  paymentType: PaymentType; // PREPAID or COD
  codAmount?: number; // Cash collection amount if COD
  pickupZoneId?: string | null; // Zone ID of pickup address
  dropZoneId?: string | null; // Zone ID of drop address
  rateCard: IRateCard; // Active admin rate card document
}

/**
 * Calculates complete pricing breakdown for an order.
 * Pure function: No external I/O or database mutations.
 * 
 * @param params Calculation inputs (dimensions, weight, types, zones, rate card)
 * @returns Structured IPriceBreakdown payload
 */
export const calculateOrderPrice = (params: IRateCalculationParams): IPriceBreakdown => {
  const {
    dimensions,
    actualWeightKg,
    orderType,
    paymentType,
    codAmount = 0,
    pickupZoneId,
    dropZoneId,
    rateCard,
  } = params;

  // 1. Calculate Volumetric Weight (L × B × H / divisor)
  const divisor = rateCard.volumetricDivisor || 5000;
  const rawVolumetricWeight = (dimensions.lengthCm * dimensions.widthCm * dimensions.heightCm) / divisor;
  
  // Round weights to 2 decimal places for billing transparency
  const volumetricWeightKg = Math.round(rawVolumetricWeight * 100) / 100;
  const roundedActualWeight = Math.round(actualWeightKg * 100) / 100;

  // 2. Determine Billable Weight (higher of actual vs volumetric weight)
  const billableWeightKg = Math.max(roundedActualWeight, volumetricWeightKg);

  // 3. Detect Intra-Zone vs Inter-Zone Shipment
  // Intra-zone requires BOTH pickup and drop points to be inside the EXACT SAME zone
  const isInterZone =
    !pickupZoneId ||
    !dropZoneId ||
    pickupZoneId.toString() !== dropZoneId.toString();

  // 4. Select Rate per Kg based on Zone Tier and Order Type (B2B vs B2C)
  let ratePerKgApplied = 0;

  if (isInterZone) {
    ratePerKgApplied =
      orderType === OrderType.B2B
        ? rateCard.interZoneB2BRatePerKg
        : rateCard.interZoneB2CRatePerKg;
  } else {
    ratePerKgApplied =
      orderType === OrderType.B2B
        ? rateCard.intraZoneB2BRatePerKg
        : rateCard.intraZoneB2CRatePerKg;
  }

  // 5. Calculate Base Operational Fee and Weight Fee
  const baseFee = rateCard.baseFee;
  const weightFee = Math.round(billableWeightKg * ratePerKgApplied * 100) / 100;

  // 6. Calculate Cash on Delivery (COD) Surcharge if applicable
  let codSurcharge = 0;
  if (paymentType === PaymentType.COD) {
    const flatCodSurcharge =
      orderType === OrderType.B2B
        ? rateCard.codSurchargeB2B
        : rateCard.codSurchargeB2C;

    const percentageCodFee = codAmount > 0
      ? codAmount * (rateCard.codPercentageFee || 0.015)
      : 0;

    codSurcharge = Math.round((flatCodSurcharge + percentageCodFee) * 100) / 100;
  }

  // 7. Calculate Total Charge
  const totalCharge = Math.round((baseFee + weightFee + codSurcharge) * 100) / 100;

  return {
    actualWeightKg: roundedActualWeight,
    volumetricWeightKg,
    billableWeightKg,
    volumetricDivisorUsed: divisor,
    isInterZone,
    ratePerKgApplied,
    baseFee,
    weightFee,
    codSurcharge,
    totalCharge,
  };
};
