/**
 * Automated System Integration & E2E Verification Suite
 * ------------------------------------------------------
 * Programmatically validates core logistics services, rate engine volumetric calculations,
 * GeoJSON spatial zone detection, directed graph state machine constraints, and AI address resolution.
 */

import { calculateOrderPrice } from '../services/rateEngine.js';
import { detectZoneForCoordinates } from '../utils/geo.js';
import { isValidStatusTransition } from '../utils/stateMachine.js';
import { resolveUnstructuredAddress } from '../services/aiAddressParser.js';
import { OrderStatus, OrderType, PaymentType } from '../models/Order.js';
import { UserRole } from '../models/User.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASSED: ${testName}`);
  } else {
    console.error(`  ❌ FAILED: ${testName}`);
  }
}

async function runE2EVerificationSuite() {
  console.log(`\n=======================================================`);
  console.log(`🧪 RUNNING END-TO-END SYSTEM INTEGRATION TEST SUITE`);
  console.log(`=======================================================\n`);

  // 1. Rate Engine & Volumetric Pricing Test
  console.log(`--- [1/4] Pure Rate Calculation Engine ---`);
  const rateCardMock: any = {
    _id: 'card_mock_1',
    name: 'NCR Base Card',
    baseFee: 50,
    volumetricDivisor: 5000,
    intraZoneB2CRatePerKg: 15,
    intraZoneB2BRatePerKg: 25,
    interZoneB2CRatePerKg: 30,
    interZoneB2BRatePerKg: 40,
    codSurchargeB2C: 15,
    codSurchargeB2B: 20,
    codPercentageFee: 0.02, // 2%
  };

  const priceResult = calculateOrderPrice({
    dimensions: { lengthCm: 40, widthCm: 30, heightCm: 20 },
    actualWeightKg: 2.0,
    orderType: OrderType.B2B,
    paymentType: PaymentType.COD,
    codAmount: 1000,
    pickupZoneId: 'zone_1',
    dropZoneId: 'zone_2',
    rateCard: rateCardMock,
  });

  // Volumetric = (40*30*20)/5000 = 4.8kg. Max(2.0, 4.8) = 4.8kg.
  assert(priceResult.volumetricWeightKg === 4.8, 'Volumetric weight calculation (4.8 kg)');
  assert(priceResult.billableWeightKg === 4.8, 'Billable weight selection max(actual, volumetric)');
  assert(priceResult.isInterZone === true, 'Inter-zone cross-tier shipment detection');
  assert(priceResult.codSurcharge === 40, 'COD surcharge calculation (₹20 flat B2B + 2% of ₹1000)');
  assert(priceResult.totalCharge > 0, 'Total billable price computed');

  // 2. GeoJSON Point-in-Polygon Spatial Zone Matching Test
  console.log(`\n--- [2/4] GeoJSON Spatial Zone Detector ---`);
  const mockZones: any[] = [
    {
      _id: 'zone_south_gurgaon',
      name: 'South Gurgaon Core',
      code: 'ZONE_GUR_SOUTH',
      boundary: {
        type: 'Polygon',
        coordinates: [
          [
            [77.0100, 28.4500],
            [77.0600, 28.4500],
            [77.0600, 28.5000],
            [77.0100, 28.5000],
            [77.0100, 28.4500],
          ],
        ],
      },
    },
  ];

  const matchedZone = detectZoneForCoordinates(77.0300, 28.4700, mockZones);
  assert(matchedZone !== null && matchedZone.code === 'ZONE_GUR_SOUTH', 'Turf.js point-in-polygon zone match');

  const outsideZone = detectZoneForCoordinates(78.0000, 30.0000, mockZones);
  assert(outsideZone === null, 'Out-of-bounds coordinate returns null zone');

  // 3. Order Status State Machine Directed Graph Test
  console.log(`\n--- [3/4] Order State Machine Directed Graph ---`);
  assert(isValidStatusTransition(OrderStatus.CREATED, OrderStatus.PICKED_UP), 'Legal transition: CREATED -> PICKED_UP');
  assert(isValidStatusTransition(OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT), 'Legal transition: PICKED_UP -> IN_TRANSIT');
  assert(isValidStatusTransition(OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY), 'Legal transition: IN_TRANSIT -> OUT_FOR_DELIVERY');
  assert(isValidStatusTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED), 'Legal transition: OUT_FOR_DELIVERY -> DELIVERED');
  assert(isValidStatusTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.FAILED), 'Legal transition: OUT_FOR_DELIVERY -> FAILED');
  assert(isValidStatusTransition(OrderStatus.FAILED, OrderStatus.RESCHEDULED), 'Legal transition: FAILED -> RESCHEDULED');
  assert(!isValidStatusTransition(OrderStatus.CREATED, OrderStatus.DELIVERED), 'Illegal state skip rejected: CREATED -> DELIVERED');
  assert(!isValidStatusTransition(OrderStatus.DELIVERED, OrderStatus.PICKED_UP), 'Terminal state jump rejected: DELIVERED -> PICKED_UP');

  // 4. Agentic AI Address Resolution Service Test
  console.log(`\n--- [4/4] Agentic AI Address Resolution Service ---`);
  const aiResult = await resolveUnstructuredAddress('Opposite Apollo Pharmacy near Green Park metro, Delhi 110016');
  assert(aiResult.pincode === '110016', 'Extracted 6-digit Indian pincode (110016)');
  assert(aiResult.city === 'Delhi', 'Extracted city (Delhi)');
  assert(aiResult.parsedVia === 'GEMINI_AI' || aiResult.parsedVia === 'HEURISTIC_FALLBACK', 'Address parsing engine execution');

  console.log(`\n=======================================================`);
  console.log(`📊 E2E INTEGRATION TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`=======================================================\n`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runE2EVerificationSuite().catch((err) => {
  console.error('Fatal Integration Test Error:', err);
  process.exit(1);
});
