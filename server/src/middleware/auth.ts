/**
 * Authentication & Role Guard Middleware
 * --------------------------------------
 * `authenticate`: Extracts Bearer token, verifies JWT, and attaches user document to `req.user`.
 * `requireRole`: Restricts route access to specific permitted UserRole values.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { User, UserRole } from '../models/User.js';

/**
 * Middleware: Verify Bearer JWT in Authorization header.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token missing or invalid authorization header format. Expected Bearer token.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Fetch user from database to verify account still exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User account associated with token no longer exists.',
      });
      return;
    }

    // Attach authenticated user document to request
    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired access token.',
      details: error.message,
    });
  }
};

/**
 * Middleware Factory: Enforce Role-Based Access Control (RBAC).
 * 
 * @param allowedRoles Array of UserRole values permitted to access the route
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before role verification.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Access restricted to roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};
