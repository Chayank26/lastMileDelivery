/**
 * Rate Card Management & Pricing Sandbox Controller
 * --------------------------------------------------
 * Handles CRUD operations for admin rate cards, default rate card retrieval,
 * and the `/api/rates/simulate` pricing sandbox simulator endpoint.
 */

import { Request, Response } from 'express';
import { RateCard, IRateCard } from '../models/RateCard.js';
import { Zone } from '../models/Zone.js';
import { calculateOrderPrice } from '../services/rateEngine.js';
import { detectZoneForCoordinates } from '../utils/geo.js';
import { OrderType, PaymentType } from '../models/Order.js';

/**
 * Controller: Get the default active RateCard for customer pricing previews.
 */
export const getActiveRateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    let rateCard = await RateCard.findOne({ isDefault: true, isActive: true });

    // Fallback: If no default rate card exists, fetch any active card or seed default
    if (!rateCard) {
      rateCard = await RateCard.findOne({ isActive: true });
    }

    if (!rateCard) {
      res.status(404).json({
        error: 'Not Found',
        message: 'No active rate card configured. Please ask Admin to seed default rate card.',
      });
      return;
    }

    res.status(200).json({ rateCard });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Create a new Rate Card configuration (Admin only).
 */
export const createRateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      isDefault,
      volumetricDivisor,
      baseFee,
      intraZoneB2BRatePerKg,
      intraZoneB2CRatePerKg,
      interZoneB2BRatePerKg,
      interZoneB2CRatePerKg,
      codSurchargeB2B,
      codSurchargeB2C,
      codPercentageFee,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Bad Request', message: 'Rate card name is required.' });
      return;
    }

    // If marked as default, un-set default flag on all existing rate cards
    if (isDefault) {
      await RateCard.updateMany({ isDefault: true }, { isDefault: false });
    }

    const rateCard = await RateCard.create({
      name,
      isDefault: !!isDefault,
      volumetricDivisor: volumetricDivisor || 5000,
      baseFee: baseFee !== undefined ? baseFee : 50,
      intraZoneB2BRatePerKg: intraZoneB2BRatePerKg !== undefined ? intraZoneB2BRatePerKg : 30,
      intraZoneB2CRatePerKg: intraZoneB2CRatePerKg !== undefined ? intraZoneB2CRatePerKg : 40,
      interZoneB2BRatePerKg: interZoneB2BRatePerKg !== undefined ? interZoneB2BRatePerKg : 60,
      interZoneB2CRatePerKg: interZoneB2CRatePerKg !== undefined ? interZoneB2CRatePerKg : 80,
      codSurchargeB2B: codSurchargeB2B !== undefined ? codSurchargeB2B : 25,
      codSurchargeB2C: codSurchargeB2C !== undefined ? codSurchargeB2C : 15,
      codPercentageFee: codPercentageFee !== undefined ? codPercentageFee : 0.015,
      isActive: true,
    });

    res.status(201).json({
      message: 'Rate card created successfully',
      rateCard,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Get list of all Rate Cards (Admin only).
 */
export const getAllRateCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const rateCards = await RateCard.find().sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ count: rateCards.length, rateCards });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Update existing Rate Card (Admin only).
 */
export const updateRateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const rateCard = await RateCard.findById(req.params.id);

    if (!rateCard) {
      res.status(404).json({ error: 'Not Found', message: 'Rate card not found.' });
      return;
    }

    const {
      name,
      isDefault,
      volumetricDivisor,
      baseFee,
      intraZoneB2BRatePerKg,
      intraZoneB2CRatePerKg,
      interZoneB2BRatePerKg,
      interZoneB2CRatePerKg,
      codSurchargeB2B,
      codSurchargeB2C,
      codPercentageFee,
      isActive,
    } = req.body;

    if (isDefault) {
      await RateCard.updateMany({ _id: { $ne: rateCard._id } }, { isDefault: false });
      rateCard.isDefault = true;
    }

    if (name) rateCard.name = name;
    if (volumetricDivisor !== undefined) rateCard.volumetricDivisor = volumetricDivisor;
    if (baseFee !== undefined) rateCard.baseFee = baseFee;
    if (intraZoneB2BRatePerKg !== undefined) rateCard.intraZoneB2BRatePerKg = intraZoneB2BRatePerKg;
    if (intraZoneB2CRatePerKg !== undefined) rateCard.intraZoneB2CRatePerKg = intraZoneB2CRatePerKg;
    if (interZoneB2BRatePerKg !== undefined) rateCard.interZoneB2BRatePerKg = interZoneB2BRatePerKg;
    if (interZoneB2CRatePerKg !== undefined) rateCard.interZoneB2CRatePerKg = interZoneB2CRatePerKg;
    if (codSurchargeB2B !== undefined) rateCard.codSurchargeB2B = codSurchargeB2B;
    if (codSurchargeB2C !== undefined) rateCard.codSurchargeB2C = codSurchargeB2C;
    if (codPercentageFee !== undefined) rateCard.codPercentageFee = codPercentageFee;
    if (isActive !== undefined) rateCard.isActive = isActive;

    await rateCard.save();

    res.status(200).json({ message: 'Rate card updated successfully', rateCard });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Real-Time Pricing Simulator Sandbox (`POST /api/rates/simulate`)
 * -----------------------------------------------------------------------------
 * Allows customers or admins to preview calculations in real time.
 * Supports passing custom parameter overrides (e.g. tweaking volumetric divisor or rates)
 * to test pricing impact instantly without mutating stored database records.
 */
export const simulateRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      dimensions, // { lengthCm, widthCm, heightCm }
      actualWeightKg,
      orderType, // 'B2B' | 'B2C'
      paymentType, // 'PREPAID' | 'COD'
      codAmount = 0,
      pickupCoordinates, // optional: [lng, lat]
      dropCoordinates, // optional: [lng, lat]
      pickupZoneId, // optional: string
      dropZoneId, // optional: string
      rateCardOverrides, // optional: custom rates for sandbox slider testing
    } = req.body;

    if (!dimensions || actualWeightKg === undefined || !orderType || !paymentType) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Package dimensions, actualWeightKg, orderType, and paymentType are required.',
      });
      return;
    }

    // Determine Pickup & Drop Zone IDs
    let finalPickupZoneId = pickupZoneId || null;
    let finalDropZoneId = dropZoneId || null;

    // If coordinates were passed, perform Turf.js point-in-polygon zone matching
    if (pickupCoordinates || dropCoordinates) {
      const activeZones = await Zone.find({ isActive: true });

      if (pickupCoordinates && Array.isArray(pickupCoordinates)) {
        const detectedPickup = detectZoneForCoordinates(pickupCoordinates[0], pickupCoordinates[1], activeZones);
        if (detectedPickup) finalPickupZoneId = detectedPickup._id.toString();
      }

      if (dropCoordinates && Array.isArray(dropCoordinates)) {
        const detectedDrop = detectZoneForCoordinates(dropCoordinates[0], dropCoordinates[1], activeZones);
        if (detectedDrop) finalDropZoneId = detectedDrop._id.toString();
      }
    }

    // Retrieve active default RateCard from database
    let baseRateCard = await RateCard.findOne({ isDefault: true, isActive: true });
    if (!baseRateCard) {
      baseRateCard = await RateCard.findOne({ isActive: true });
    }

    // Construct effective RateCard object, applying any ephemeral sandbox slider overrides
    const effectiveRateCard = {
      volumetricDivisor: rateCardOverrides?.volumetricDivisor || baseRateCard?.volumetricDivisor || 5000,
      baseFee: rateCardOverrides?.baseFee !== undefined ? rateCardOverrides.baseFee : (baseRateCard?.baseFee || 50),
      intraZoneB2BRatePerKg: rateCardOverrides?.intraZoneB2BRatePerKg !== undefined ? rateCardOverrides.intraZoneB2BRatePerKg : (baseRateCard?.intraZoneB2BRatePerKg || 30),
      intraZoneB2CRatePerKg: rateCardOverrides?.intraZoneB2CRatePerKg !== undefined ? rateCardOverrides.intraZoneB2CRatePerKg : (baseRateCard?.intraZoneB2CRatePerKg || 40),
      interZoneB2BRatePerKg: rateCardOverrides?.interZoneB2BRatePerKg !== undefined ? rateCardOverrides.interZoneB2BRatePerKg : (baseRateCard?.interZoneB2BRatePerKg || 60),
      interZoneB2CRatePerKg: rateCardOverrides?.interZoneB2CRatePerKg !== undefined ? rateCardOverrides.interZoneB2CRatePerKg : (baseRateCard?.interZoneB2CRatePerKg || 80),
      codSurchargeB2B: rateCardOverrides?.codSurchargeB2B !== undefined ? rateCardOverrides.codSurchargeB2B : (baseRateCard?.codSurchargeB2B || 25),
      codSurchargeB2C: rateCardOverrides?.codSurchargeB2C !== undefined ? rateCardOverrides.codSurchargeB2C : (baseRateCard?.codSurchargeB2C || 15),
      codPercentageFee: rateCardOverrides?.codPercentageFee !== undefined ? rateCardOverrides.codPercentageFee : (baseRateCard?.codPercentageFee || 0.015),
    } as IRateCard;

    // Run pure rate calculation engine
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
      pickupZoneId: finalPickupZoneId,
      dropZoneId: finalDropZoneId,
      rateCard: effectiveRateCard,
    });

    res.status(200).json({
      simulation: {
        pickupZoneId: finalPickupZoneId,
        dropZoneId: finalDropZoneId,
        isInterZone: priceBreakdown.isInterZone,
        priceBreakdown,
        rateCardUsed: {
          id: baseRateCard?._id || 'ephemeral-default',
          name: baseRateCard?.name || 'Standard Default Rate Card',
          hasOverrides: !!rateCardOverrides,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Seed Default Enterprise Rate Card (Admin / Evaluator Helper).
 */
export const seedDefaultRateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    let rateCard = await RateCard.findOne({ isDefault: true });

    if (!rateCard) {
      rateCard = await RateCard.create({
        name: 'Standard Enterprise Rate Card 2026',
        isDefault: true,
        volumetricDivisor: 5000,
        baseFee: 50,
        intraZoneB2BRatePerKg: 30,
        intraZoneB2CRatePerKg: 40,
        interZoneB2BRatePerKg: 60,
        interZoneB2CRatePerKg: 80,
        codSurchargeB2B: 25,
        codSurchargeB2C: 15,
        codPercentageFee: 0.015,
        isActive: true,
      });
    }

    res.status(200).json({
      message: 'Default rate card verified and available',
      rateCard,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};
