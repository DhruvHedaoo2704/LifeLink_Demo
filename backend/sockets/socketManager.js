import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import config from '../config/index.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (config.isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST']
    }
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      logger.warn('Socket connection attempt rejected: No token provided');
      return next(); // Still allow connection but unauthenticated; or next(new Error('Auth failed'))
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      logger.warn(`Socket connection attempt rejected: Invalid token - ${err.message}`);
      next(); // Connect as unauthenticated
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id} (User: ${socket.userId || 'Guest'})`);

    // Join user room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      logger.info(`User ${socket.userId} joined room: user:${socket.userId}`);
    }

    // Join role-specific rooms
    socket.on('join-role', (role) => {
      if (['donor', 'recipient', 'hospital', 'blood_bank', 'admin'].includes(role)) {
        socket.join(`role:${role}`);
        logger.info(`Client ${socket.id} joined role room: role:${role}`);
      }
    });

    // Share real-time location updates for traveling donors
    socket.on('share-location', (data) => {
      const { requestId, location } = data; // location: { lat, lng }
      if (socket.userId && requestId) {
        // Broadcast location updates to the specific recipient of the request
        io.to(`request:${requestId}`).emit('donor-location-update', {
          donorId: socket.userId,
          location
        });
      }
    });

    // Join a specific request tracking room
    socket.on('track-request', (requestId) => {
      socket.join(`request:${requestId}`);
      logger.info(`Client ${socket.id} joined request room: request:${requestId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

// Helper: Broadcast to specific rooms or events
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

export const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};
