import { Server } from 'socket.io';

let io = null;
const userSockets = new Map(); // userId -> set of socketIds

export const initSocket = (server, clientUrl) => {
  io = new Server(server, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join user-specific room upon authentication
    socket.on('authenticate', (userId) => {
      if (userId) {
        socket.join(userId);
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);
        console.log(`Socket ${socket.id} authenticated for user: ${userId}`);
      }
    });

    socket.on('join_ranking', (rankingId) => {
      socket.join(`ranking:${rankingId}`);
      console.log(`Socket ${socket.id} joined ranking room: ranking:${rankingId}`);
    });

    socket.on('leave_ranking', (rankingId) => {
      socket.leave(`ranking:${rankingId}`);
      console.log(`Socket ${socket.id} left ranking room: ranking:${rankingId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Remove socket from userSockets mapping
      for (const [userId, sockets] of userSockets.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
          }
          break;
        }
      }
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

// Real-time notifications
export const sendNotification = (userId, notification) => {
  if (io) {
    io.to(userId).emit('notification', notification);
  }
};

// Real-time vote updates
export const broadcastVoteUpdate = (rankingId, voteData) => {
  if (io) {
    io.to(`ranking:${rankingId}`).emit('vote_update', voteData);
  }
};
