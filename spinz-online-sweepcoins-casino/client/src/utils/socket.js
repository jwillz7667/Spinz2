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
