import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (userId) => {
  if (socket) {
    console.log('⚠️ Socket already initialized');
    return socket;
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const socketUrl = API_URL.replace('/api', ''); // Remove /api from URL

  socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log(`✅ WebSocket connected: ${socket.id}`);
    if (userId) {
      socket.emit('join', userId);
      console.log(`👤 Joined room for user: ${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('🔴 WebSocket connection error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn('⚠️ Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected and cleaned up');
  }
};

export const onAccountBanned = (callback) => {
  const currentSocket = getSocket();
  if (currentSocket) {
    currentSocket.on('account_banned', callback);
    console.log('🚨 Listening for account_banned events');
  }
};

export const offAccountBanned = () => {
  const currentSocket = getSocket();
  if (currentSocket) {
    currentSocket.off('account_banned');
    console.log('🔕 Stopped listening for account_banned events');
  }
};

export const onAccountUnbanned = (callback) => {
  const currentSocket = getSocket();
  if (currentSocket) {
    currentSocket.on('account_unbanned', callback);
    console.log('✅ Listening for account_unbanned events');
  }
};

export const offAccountUnbanned = () => {
  const currentSocket = getSocket();
  if (currentSocket) {
    currentSocket.off('account_unbanned');
    console.log('🔕 Stopped listening for account_unbanned events');
  }
};
