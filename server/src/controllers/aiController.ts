/**
 * Agentic AI Address Resolution Controller
 * -----------------------------------------
 * Exposes AI endpoints for parsing unstructured Indian addresses.
 */

import { Request, Response } from 'express';
import { resolveUnstructuredAddress } from '../services/aiAddressParser.js';

/**
 * Controller: Parse Unstructured Indian Address (`POST /api/ai/parse-address`).
 */
export const parseAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rawAddress } = req.body;

    if (!rawAddress || typeof rawAddress !== 'string' || rawAddress.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Unstructured rawAddress string is required.',
      });
      return;
    }

    const result = await resolveUnstructuredAddress(rawAddress.trim());

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};
