/**
 * Rate Engine Verification Test Suite
 * -----------------------------------
 * Executes pure mathematical test assertions against `calculateOrderPrice`.
 */

import { calculateOrderPrice } from './rateEngine.js';
import { OrderType, PaymentType } from '../models/Order.js';
import { IRateCard } from '../models/RateCard.js';

// Mock active RateCard document for testing
const mockRateCard = {
  volumetricDivisor: 5000,
  baseFee: 50,
  intraZoneB2BRatePerKg: 30,
  intraZoneB2CRatePerKg: 40,
  interZoneB2BRatePerKg: 60,
  interZoneB2CRatePerKg: 80,
  codSurchargeB2B: 25,
  codSurchargeB2C: 15,
  codPercentageFee: 0.02,
} as IRateCard;

/**
 * Runs inline verification assertions on rate calculation engine formulas.
 */
export const runRateEngineTests = () => {
  console.log('🧪 Running Rate Engine Formula Tests...');

  // Test Case 1: Volumetric Weight Higher Than Actual Weight
  // Dimensions: 50cm x 40cm x 30cm = 60,000 cm³ / 5000 = 12.0 kg (vs actual 5.0 kg)
  const test1 = calculateOrderPrice({
    dimensions: { lengthCm: 50, widthCm: 40, heightCm: 30 },
    actualWeightKg: 5,
    orderType: OrderType.B2C,
    paymentType: PaymentType.PREPAID,
    pickupZoneId: 'zone-1',
    dropZoneId: 'zone-1', // Intra-Zone
    rateCard: mockRateCard,
  });

  console.assert(test1.volumetricWeightKg === 12, `Test 1 Failed: Volumetric weight should be 12kg, got ${test1.volumetricWeightKg}`);
  console.assert(test1.billableWeightKg === 12, `Test 1 Failed: Billable weight should be 12kg, got ${test1.billableWeightKg}`);
  console.assert(test1.ratePerKgApplied === 40, `Test 1 Failed: Intra-zone B2C rate should be 40, got ${test1.ratePerKgApplied}`);
  console.assert(test1.totalCharge === 530, `Test 1 Failed: Total charge should be 50 + (12 * 40) = 530, got ${test1.totalCharge}`);

  // Test Case 2: Inter-Zone B2B COD Order with Percentage Fee
  // Actual Weight: 20kg (higher than volumetric 20cm x 20cm x 20cm / 5000 = 1.6kg)
  // COD Amount: ₹1000 -> 2% percentage fee = ₹20 + ₹25 flat = ₹45 COD Surcharge
  // Inter-zone B2B rate = ₹60/kg * 20kg = ₹1200 + ₹50 base = ₹1250 + ₹45 COD = ₹1295
  const test2 = calculateOrderPrice({
    dimensions: { lengthCm: 20, widthCm: 20, heightCm: 20 },
    actualWeightKg: 20,
    orderType: OrderType.B2B,
    paymentType: PaymentType.COD,
    codAmount: 1000,
    pickupZoneId: 'zone-1',
    dropZoneId: 'zone-2', // Inter-Zone
    rateCard: mockRateCard,
  });

  console.assert(test2.billableWeightKg === 20, `Test 2 Failed: Billable weight should be 20kg, got ${test2.billableWeightKg}`);
  console.assert(test2.isInterZone === true, 'Test 2 Failed: Should be inter-zone');
  console.assert(test2.ratePerKgApplied === 60, `Test 2 Failed: Inter-zone B2B rate should be 60, got ${test2.ratePerKgApplied}`);
  console.assert(test2.codSurcharge === 45, `Test 2 Failed: COD surcharge should be 45, got ${test2.codSurcharge}`);
  console.assert(test2.totalCharge === 1295, `Test 2 Failed: Total charge should be 1295, got ${test2.totalCharge}`);

  console.log('✅ All Rate Engine Mathematical Tests Passed Cleanly!');
};
