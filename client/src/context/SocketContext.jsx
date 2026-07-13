import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    console.log(`Connecting socket to: ${socketUrl}`);
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log(`Socket client connected: ${newSocket.id}`);
      // Authenticate with server
      newSocket.emit('authenticate', user._id);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Join a ranking detail room to receive vote count updates
  const joinRankingRoom = (rankingId) => {
    if (socket) {
      socket.emit('join_ranking', rankingId);
    }
  };

  const leaveRankingRoom = (rankingId) => {
    if (socket) {
      socket.emit('leave_ranking', rankingId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinRankingRoom, leaveRankingRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
