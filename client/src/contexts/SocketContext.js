'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeSocket, disconnectSocket, onAccountBanned, offAccountBanned, onAccountUnbanned, offAccountUnbanned } from '@/utils/socket';
import { getUserFromStorage } from '@/utils/userStorage';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getUserFromStorage();
    
    if (user && user.id) {
      // Initialize socket connection
      const newSocket = initializeSocket(user.id);
      setSocket(newSocket);

      // Setup connection listeners
      newSocket.on('connect', () => {
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      // Listen for ban events
      onAccountBanned((data) => {
        console.log('🚨 ACCOUNT BANNED EVENT RECEIVED:', data);
        
        // Update localStorage immediately
        const currentUser = getUserFromStorage();
        if (currentUser) {
          currentUser.status = 'banned';
          localStorage.setItem('userData', JSON.stringify(currentUser));
          localStorage.setItem('user', JSON.stringify(currentUser));
        }

        // Show alert
        alert('⚠️ Your account has been banned by an administrator.\n\nYou will be redirected to the banned page.');

        // Force redirect to banned page
        window.location.href = '/banned';
      });

      // Listen for unban events
      onAccountUnbanned((data) => {
        console.log('✅ ACCOUNT UNBANNED EVENT RECEIVED:', data);
        
        // Update localStorage immediately
        const currentUser = getUserFromStorage();
        if (currentUser) {
          currentUser.status = data.status || 'offline';
          localStorage.setItem('userData', JSON.stringify(currentUser));
          localStorage.setItem('user', JSON.stringify(currentUser));
        }

        // Show alert
        alert('✅ Your account has been unbanned!\n\nYou can now access the application. You will be redirected to the dashboard.');

        // Force redirect to dashboard
        window.location.href = '/dashboard';
      });

      // Cleanup on unmount
      return () => {
        offAccountBanned();
        offAccountUnbanned();
        disconnectSocket();
      };
    }
  }, [router]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
