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
    });

    socket.on('leaveGame', (gameId) => {
      socket.leave(gameId);
      console.log(`User ${socket.user.name} left game ${gameId}`);
    });

    socket.on('gameAction', (data) => {
      // Handle game actions here
      console.log(`Game action received from ${socket.user.name}:`, data);
      // Broadcast the action to other players in the game
      socket.to(data.gameId).emit('gameUpdate', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};

module.exports = setupWebSocket;
