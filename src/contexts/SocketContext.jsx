import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const socketRef = useRef(null);

  // Derive socket base URL from VITE_BASE_URL_SOCKET if available,
  // otherwise strip the /api suffix from VITE_BASE_URL.
  // This ensures the socket always points to the same host as the REST API.
  const socketUrl =
    import.meta.env.VITE_BASE_URL_SOCKET ||
    (import.meta.env.VITE_BASE_URL?.endsWith('/api')
      ? import.meta.env.VITE_BASE_URL.slice(0, -4)
      : import.meta.env.VITE_BASE_URL) ||
    'http://localhost:3000';

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('accessToken'));
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || !userData) return;

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      path: '/socket.io/',
      query: {
        userId: userData.id,
        userRole: userData.role,
      },
    });

    socketRef.current = socketInstance;

    // ── Connection lifecycle ────────────────────────────────────────────
    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      // If the server intentionally closed the connection, reconnect manually
      if (reason === 'io server disconnect') {
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', () => {
      setConnectionStatus('error');
    });

    socketInstance.on('reconnect', () => {
      setConnectionStatus('connected');
    });

    // ── Application events ──────────────────────────────────────────────
    socketInstance.on('new-message', (message) => {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const isForAdmin =
        message.receiver === currentUser?.id ||
        (message.sender?._id !== currentUser?.id && message.receiver === 'admin');

      if (isForAdmin && !message.read) {
        toast.info(`New message from ${message.sender?.fullName || 'User'}`, {
          description: message.content?.substring(0, 100) || 'Attachment received',
          duration: 5000,
        });
      }

      window.dispatchEvent(new CustomEvent('socket:new-message', { detail: message }));
    });

    socketInstance.on('message-read', ({ messageId }) => {
      window.dispatchEvent(new CustomEvent('socket:message-read', { detail: { messageId } }));
    });

    socketInstance.on('user-typing', ({ userId, isTyping }) => {
      window.dispatchEvent(
        new CustomEvent('socket:user-typing', { detail: { userId, isTyping } })
      );
    });

    setSocket(socketInstance);

    // Cleanup: remove all listeners and disconnect when component unmounts
    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stable socket action helpers ────────────────────────────────────
  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-conversation', conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-conversation', conversationId);
    }
  }, []);

  const sendTyping = useCallback((conversationId, isTyping) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { conversationId, isTyping });
    }
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  const value = {
    socket,
    isConnected,
    connectionStatus,
    joinConversation,
    leaveConversation,
    sendTyping,
    reconnect,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};