/**
 * Socket.io Real-Time Gateway & Event Stream Manager
 * ----------------------------------------------------
 * Manages bi-directional WebSocket connections, room subscriptions (`order:${id}`, `admin`, `agent:${id}`),
 * and real-time event broadcasts for status transitions and driver position updates.
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from './config/env.js';

let io: SocketIOServer | null = null;

/**
 * Initializes Socket.io server instance attached to HTTP server.
 * 
 * @param httpServer Node.js HTTP server instance
 */
export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected to Socket.io [ID: ${socket.id}]`);

    // Room Subscription: Customer order tracking timeline (`order:${orderId}`)
    socket.on('subscribe:order', (orderId: string) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`📡 Socket [${socket.id}] joined room: order:${orderId}`);
      }
    });

    socket.on('unsubscribe:order', (orderId: string) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
        console.log(`📡 Socket [${socket.id}] left room: order:${orderId}`);
      }
    });

    // Room Subscription: Admin command center live feed (`admin`)
    socket.on('subscribe:admin', () => {
      socket.join('admin');
      console.log(`👑 Socket [${socket.id}] joined room: admin`);
    });

    // Room Subscription: Delivery agent alerts (`agent:${agentId}`)
    socket.on('subscribe:agent', (agentId: string) => {
      if (agentId) {
        socket.join(`agent:${agentId}`);
        console.log(`🚚 Socket [${socket.id}] joined room: agent:${agentId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected [ID: ${socket.id}] Reason: ${reason}`);
    });
  });

  return io;
};

/**
 * Helper: Retrieve global Socket.io instance.
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io server instance has not been initialized.');
  }
  return io;
};

/**
 * Broadcast Event: Order Created
 * Broadcasts to Admin room.
 */
export const emitOrderCreated = (orderPayload: any) => {
  if (!io) return;
  io.to('admin').emit('order:created', {
    timestamp: new Date().toISOString(),
    order: orderPayload,
  });
};

/**
 * Broadcast Event: Agent Assigned
 * Broadcasts to Customer order room, Admin room, and target Agent room.
 */
export const emitOrderAssigned = (orderId: string, assignedAgentId: string, payload: any) => {
  if (!io) return;
  const data = {
    timestamp: new Date().toISOString(),
    orderId,
    assignedAgentId,
    payload,
  };

  io.to(`order:${orderId}`).emit('order:assigned', data);
  io.to(`agent:${assignedAgentId}`).emit('order:assigned', data);
  io.to('admin').emit('order:assigned', data);
};

/**
 * Broadcast Event: Order Status Transition
 * Broadcasts to Customer order room, Admin room, and assigned Agent room.
 */
export const emitOrderStatusUpdated = (orderId: string, statusPayload: any) => {
  if (!io) return;
  const data = {
    timestamp: new Date().toISOString(),
    orderId,
    statusPayload,
  };

  io.to(`order:${orderId}`).emit('order:status_updated', data);
  io.to('admin').emit('order:status_updated', data);
  if (statusPayload.assignedAgentId) {
    io.to(`agent:${statusPayload.assignedAgentId}`).emit('order:status_updated', data);
  }
};

/**
 * Broadcast Event: Agent Location Update
 * Broadcasts live coordinates to active customer tracking rooms and Admin room.
 */
export const emitAgentLocationUpdated = (agentId: string, locationPayload: any) => {
  if (!io) return;
  io.to('admin').emit('agent:location_updated', {
    agentId,
    location: locationPayload,
    timestamp: new Date().toISOString(),
  });
};
