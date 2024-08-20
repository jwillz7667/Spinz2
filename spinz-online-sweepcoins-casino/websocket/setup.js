const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User');

const setupWebSocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, config.get('jwtSecret'));
      const user = await User.findById(decoded.user.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('joinGame', (gameId) => {
      socket.join(gameId);
      console.log(`User ${socket.user.name} joined game ${gameId}`);
      io.to(gameId).emit('playerJoined', { userId: socket.user.id, name: socket.user.name });
    });

    socket.on('leaveGame', (gameId) => {
      socket.leave(gameId);
      console.log(`User ${socket.user.name} left game ${gameId}`);
      io.to(gameId).emit('playerLeft', { userId: socket.user.id, name: socket.user.name });
    });

    socket.on('gameAction', (data) => {
      console.log(`Game action received from ${socket.user.name}:`, data);
      io.to(data.gameId).emit('gameUpdate', { ...data, userId: socket.user.id });
    });

    socket.on('sendMessage', (data) => {
      console.log(`Chat message received from ${socket.user.name}:`, data);
      io.to(data.gameId).emit('newMessage', {
        userId: socket.user.id,
        name: socket.user.name,
        message: data.message,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};

module.exports = setupWebSocket;
