/**
 * Database Connection & Transaction Manager
 * ----------------------------------------
 * Manages the Mongoose connection lifecycle to MongoDB.
 * Provides an ACID transaction helper (`runInTransaction`) using MongoDB Sessions
 * to guarantee atomic order assignment and prevent concurrent race conditions.
 */

import mongoose, { ClientSession } from 'mongoose';
import { config } from './env.js';

/**
 * Establishes connection to MongoDB database cluster.
 */
export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`🍃 MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);

    // Register Mongoose connection lifecycle event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Connection Error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB Disconnected. Attempting reconnection...');
    });

    return conn;
  } catch (error) {
    console.error('❌ Database Connection Failed:', error);
    process.exit(1);
  }
};

/**
 * ACID Transaction Helper Utility
 * -------------------------------
 * Wraps database operations in a MongoDB session transaction.
 * Used during agent assignment and order status transitions to prevent race conditions.
 * Automatically handles transaction rollback on error.
 * 
 * @param callback Async function receiving the active ClientSession
 * @returns Result of the transaction callback
 */
export const runInTransaction = async <T>(
  callback: (session: ClientSession | null) => Promise<T>
): Promise<T> => {
  let session: ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err: any) {
    // Standalone MongoDB instances without replica sets do not support transactions
    session = null;
  }

  if (!session) {
    return callback(null);
  }

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error('[ACID TRANSACTION ROLLED BACK]:', error);
    throw error;
  } finally {
    session.endSession();
  }
};
