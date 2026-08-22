/**
 * Delivery Agent Management Controller
 * -------------------------------------
 * Provides endpoints for viewing agent profiles, spatial locations,
 * concurrency capacities, and current delivery statuses.
 */

import { Request, Response } from 'express';
import { AgentProfile, AgentStatus } from '../models/AgentProfile.js';
import { User, UserRole } from '../models/User.js';

/**
 * Controller: Get List of All Active Delivery Agents (Admin map & dispatch overview).
 */
export const getAllAgents = async (req: Request, res: Response): Promise<void> => {
  try {
    const agents = await AgentProfile.find()
      .populate('user', 'name email phone role')
      .populate('assignedZone', 'name code colorHex');

    res.status(200).json({ count: agents.length, agents });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Controller: Update Delivery Agent Location & Status (Agent / System endpoint).
 */
export const updateAgentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { longitude, latitude, status } = req.body;

    let agent = await AgentProfile.findOne({ user: user._id });

    if (!agent) {
      // Auto-create agent profile if missing for current agent account
      agent = await AgentProfile.create({
        user: user._id,
        status: AgentStatus.IDLE,
        maxConcurrentOrders: 3,
        currentActiveOrderCount: 0,
        currentLocation: {
          type: 'Point',
          coordinates: [longitude || 77.0266, latitude || 28.4595],
        },
      });
    }

    if (longitude !== undefined && latitude !== undefined) {
      agent.currentLocation = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    if (status && Object.values(AgentStatus).includes(status)) {
      agent.status = status;
    }

    await agent.save();

    res.status(200).json({ message: 'Agent status updated successfully', agent });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};
