import { io } from 'socket.io-client';

let socket;

export const initSocket = (token) => {
  socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Connected to WebSocket');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket');
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket first.');
  }
  return socket;
};

export const joinGame = (gameId) => {
  if (socket) {
    socket.emit('joinGame', gameId);
  }
};

export const leaveGame = (gameId) => {
  if (socket) {
    socket.emit('leaveGame', gameId);
  }
};

export const sendGameAction = (gameId, action) => {
  if (socket) {
    socket.emit('gameAction', { gameId, action });
  }
};

export const sendChatMessage = (gameId, message) => {
  if (socket) {
    socket.emit('sendMessage', { gameId, message });
  }
};

export const onPlayerJoined = (callback) => {
  if (socket) {
    socket.on('playerJoined', callback);
  }
};

export const onPlayerLeft = (callback) => {
  if (socket) {
    socket.on('playerLeft', callback);
  }
};

export const onGameUpdate = (callback) => {
  if (socket) {
    socket.on('gameUpdate', callback);
  }
};

export const onJackpotChange = (callback) => {
  if (socket) {
    socket.on('jackpotChange', callback);
  }
};

export const onPromotionChange = (callback) => {
  if (socket) {
    socket.on('promotionChange', callback);
  }
};

export const onNewMessage = (callback) => {
  if (socket) {
    socket.on('newMessage', callback);
  }
};
