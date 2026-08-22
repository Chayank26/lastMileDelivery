/**
 * JWT Utility Functions
 * ---------------------
 * Sign and verify JSON Web Tokens for stateless authentication.
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UserRole } from '../models/User.js';

export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Signs a new JWT access token for a given user payload.
 * 
 * @param payload Object containing userId, email, and role
 * @returns Encrypted JWT token string
 */
export const generateToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Verifies and decodes an incoming JWT access token.
 * 
 * @param token Raw JWT string from Authorization header
 * @returns Decoded payload object
 */
export const verifyToken = (token: string): IJwtPayload => {
  return jwt.verify(token, config.jwtSecret) as IJwtPayload;
};
