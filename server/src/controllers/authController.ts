/**
 * Authentication Controller
 * -------------------------
 * Handles user registration, credential verification, profile retrieval,
 * and the 1-Click Demo Role Switcher endpoint for evaluators.
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User.js';
import { AgentProfile, AgentStatus } from '../models/AgentProfile.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Controller: Register a new Customer account.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Name, email, password, and phone number are required.',
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
      return;
    }

    // Hash password with bcrypt salt factor 10
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      role: UserRole.CUSTOMER,
    });

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
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
 * Controller: Login with email and password credentials.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required.',
      });
      return;
    }

    // Explicitly select passwordHash since it is marked `select: false` in schema
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email address or password.',
      });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
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
 * Controller: 1-Click Demo Role Switcher for Evaluators.
 * --------------------------------------------------------
 * Seeds demo accounts for Admin, Agent, and Customer on first request.
 * Allows evaluators to switch roles instantly without password entry.
 */
export const demoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body; // Expected: 'ADMIN' | 'AGENT' | 'CUSTOMER'

    const targetRole = (role as UserRole) || UserRole.ADMIN;

    if (!Object.values(UserRole).includes(targetRole)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid demo role requested. Permitted roles: [${Object.values(UserRole).join(', ')}]`,
      });
      return;
    }

    const demoCredentialsMap = {
      [UserRole.ADMIN]: {
        name: 'Superuser Admin (Demo)',
        email: 'admin.demo@unthinkable.co',
        phone: '+919876543210',
      },
      [UserRole.AGENT]: {
        name: 'Karan Sharma (Demo Agent)',
        email: 'karan.agent@unthinkable.co',
        phone: '+919876543211',
      },
      [UserRole.CUSTOMER]: {
        name: 'Apex Logistics (Demo B2B Customer)',
        email: 'apex.customer@unthinkable.co',
        phone: '+919876543212',
      },
    };

    const targetDemoInfo = demoCredentialsMap[targetRole];

    let user = await User.findOne({ email: targetDemoInfo.email });

    if (!user) {
      const passwordHash = await bcrypt.hash('DemoPassword2026!', 10);
      user = await User.create({
        name: targetDemoInfo.name,
        email: targetDemoInfo.email,
        passwordHash,
        phone: targetDemoInfo.phone,
        role: targetRole,
        isDemoAccount: true,
      });

      // If created user is an AGENT, auto-seed an AgentProfile record with location
      if (targetRole === UserRole.AGENT) {
        await AgentProfile.create({
          user: user._id,
          status: AgentStatus.IDLE,
          maxConcurrentOrders: 3,
          currentActiveOrderCount: 0,
          vehicleType: 'BIKE',
          currentLocation: {
            type: 'Point',
            coordinates: [77.0266, 28.4595], // Gurgaon Hub Coordinates
          },
        });
      }
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: `Switched into Demo ${targetRole} Mode successfully`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isDemoAccount: user.isDemoAccount,
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
 * Controller: Get profile of currently authenticated user.
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        isDemoAccount: req.user.isDemoAccount,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};
