const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.user._id})`);

    // Join user's personal room for notifications
    socket.join(`user-${socket.user._id}`);

    // Handle project room joins
    socket.on('joinProject', (projectId) => {
      socket.join(`project-${projectId}`);
      console.log(`User ${socket.user.username} joined project-${projectId}`);
    });

    // Handle project room leaves
    socket.on('leaveProject', (projectId) => {
      socket.leave(`project-${projectId}`);
      console.log(`User ${socket.user.username} left project-${projectId}`);
    });

    // Handle task updates
    socket.on('taskUpdated', (data) => {
      const { projectId, task } = data;
      socket.to(`project-${projectId}`).emit('taskUpdated', task);
    });

    // Handle task creation
    socket.on('taskCreated', (data) => {
      const { projectId, task } = data;
      socket.to(`project-${projectId}`).emit('taskCreated', task);
    });

    // Handle task deletion
    socket.on('taskDeleted', (data) => {
      const { projectId, taskId } = data;
      socket.to(`project-${projectId}`).emit('taskDeleted', { taskId });
    });

    // Handle task movement
    socket.on('taskMoved', (data) => {
      const { projectId, taskId, column, order } = data;
      socket.to(`project-${projectId}`).emit('taskMoved', { 
        taskId, 
        column, 
        order 
      });
    });

    // Handle notifications
    socket.on('sendNotification', (data) => {
      const { userId, notification } = data;
      socket.to(`user-${userId}`).emit('notification', notification);
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { projectId, userId, isTyping } = data;
      socket.to(`project-${projectId}`).emit('userTyping', {
        userId,
        isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
      // Leave all rooms automatically handled by socket.io
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Make io available to other modules
  return io;
};

// Helper function to emit events from controllers
const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user-${userId}`).emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO: () => io,
  emitToRoom,
  emitToUser
};