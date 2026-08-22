/**
 * Express Request Type Definition Extensions
 * -------------------------------------------
 * Extends the global Express Request interface to attach the authenticated `user` payload.
 */

import { IUser } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
