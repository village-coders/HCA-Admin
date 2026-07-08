import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);

  useEffect(() => {
    const initializeSocket = () => {
      const token = JSON.parse(localStorage.getItem('accessToken'));
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !userData) {
        console.log('No auth data found for Socket.IO');
        return;
      }

      // console.log('Initializing Socket.IO connection...');

      // Create socket connection
      const socketInstance = io("http://localhost:333", {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        path: '/socket.io/',
        query: {
          userId: userData.id,
          userRole: userData.role
        }
      });

      // Connection events
      socketInstance.on('connect', () => {
        // console.log('✅ Socket.IO connected:', socketInstance.id);
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectionAttempts(0);
        
        // Test connection
        socketInstance.emit('ping', { message: 'Hello from client' });
      });

      // socketInstance.on('connected', (data) => {
      //   console.log('Server acknowledged connection:', data);
      // });

      // socketInstance.on('pong', (data) => {
      //   console.log('Pong received:', data);
      // });

      socketInstance.on('disconnect', (reason) => {
        // console.log('❌ Socket.IO disconnected:', reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          socketInstance.connect();
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionStatus('error');
        
        if (error.message.includes('Invalid namespace')) {
          // console.log('Namespace error detected, checking configuration...');
          // Add delay before reconnection attempt
          setTimeout(() => {
            if (socketInstance.disconnected) {
              socketInstance.connect();
            }
          }, 2000);
        }
        
        setReconnectionAttempts(prev => prev + 1);
      });

      socketInstance.on('reconnect', (attemptNumber) => {
        // console.log(`🔄 Reconnected on attempt ${attemptNumber}`);
        setConnectionStatus('reconnected');
      });

      socketInstance.on('reconnect_attempt', (attemptNumber) => {
        // console.log(`🔄 Reconnection attempt ${attemptNumber}`);
        setConnectionStatus('reconnecting');
      });

      socketInstance.on('reconnect_error', (error) => {
        // console.error('Reconnection error:', error);
        setConnectionStatus('reconnection_failed');
      });

      socketInstance.on('reconnect_failed', () => {
        // console.error('Reconnection failed');
        setConnectionStatus('failed');
      });

      // Application-specific events
      socketInstance.on('new-message', (message) => {
        // console.log('📨 New message received via Socket.IO:', message);
        
        // Check if message is for current user
        const isForCurrentUser = message.receiver === userData.id || 
                                (message.sender?._id !== userData.id && message.receiver === 'admin');
        
        if (isForCurrentUser && !message.read) {
          // Show notification
          toast.info(`New message from ${message.sender?.fullName || 'Admin'}`, {
            description: message.content?.substring(0, 100) || 'Attachment sent',
            duration: 5000,
          });
        }
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('socket:new-message', { detail: message }));
      });

      socketInstance.on('message-read', ({ messageId }) => {
        // console.log('✅ Message read event:', messageId);
        window.dispatchEvent(new CustomEvent('socket:message-read', { detail: { messageId } }));
      });

      socketInstance.on('user-typing', ({ userId, isTyping }) => {
        // console.log('⌨️ Typing event:', userId, isTyping);
        window.dispatchEvent(new CustomEvent('socket:user-typing', { 
          detail: { userId, isTyping } 
        }));
      });

      // Store socket instance
      setSocket(socketInstance);
    };

    // Initialize socket connection
    initializeSocket();

    // Cleanup on unmount
    return () => {
      if (socket) {
        // console.log('Cleaning up Socket.IO connection');
        socket.disconnect();
      }
    };
  }, []);

  // Provide socket functions
  const value = {
    socket,
    isConnected,
    connectionStatus,
    reconnectionAttempts,
    joinConversation: (conversationId) => {
      if (socket && isConnected) {
        // console.log('Joining conversation:', conversationId);
        socket.emit('join-conversation', conversationId);
      }
    },
    leaveConversation: (conversationId) => {
      if (socket && isConnected) {
        // console.log('Leaving conversation:', conversationId);
        socket.emit('leave-conversation', conversationId);
      }
    },
    sendTyping: (conversationId, isTyping) => {
      if (socket && isConnected) {
        socket.emit('typing', { conversationId, isTyping });
      }
    },
    testConnection: () => {
      if (socket && isConnected) {
        socket.emit('ping', { timestamp: Date.now() });
      }
    },
    reconnect: () => {
      if (socket && !isConnected) {
        socket.connect();
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};