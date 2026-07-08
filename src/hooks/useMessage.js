import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { toast } from 'sonner';

export const useMessages = (receiverId = 'admin') => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { socket, isConnected, joinConversation, sendTyping } = useSocket();

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('accessToken'));
      const user = JSON.parse(localStorage.getItem('user'));
      
      let url = `${import.meta.env.VITE_BASE_URL}/api/messages/user`;
      if (user?.role === 'admin' || user?.role === 'super admin') {
        if (receiverId !== 'admin') {
          url = `${import.meta.env.VITE_BASE_URL}/api/messages/admin/user/${receiverId}`;
        } else {
          url = `${import.meta.env.VITE_BASE_URL}/api/messages/admin/conversations`;
        }
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [receiverId]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = JSON.parse(localStorage.getItem('accessToken'));
      const user = JSON.parse(localStorage.getItem('user'));
      
      const url = `${import.meta.env.VITE_BASE_URL}/api/messages/unread-count`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (content, receiver = 'admin', files = []) => {
    try {
      setSending(true);
      const token = JSON.parse(localStorage.getItem('accessToken'));
      const formData = new FormData();
      formData.append('content', content);
      formData.append('receiver', receiver);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      return { success: false, error: error.message };
    } finally {
      setSending(false);
    }
  }, []);

  // Mark message as read
  const markAsRead = useCallback(async (messageId) => {
    try {
      const token = JSON.parse(localStorage.getItem('accessToken'));
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/messages/${messageId}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, read: true, readAt: new Date() } : msg
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  // Join conversation room
  useEffect(() => {
    if (isConnected && receiverId) {
      joinConversation(receiverId);
    }
  }, [isConnected, receiverId, joinConversation]);

  // Socket event listeners
  useEffect(() => {
    const handleNewMessage = (event) => {
      const message = event.detail;
      
      // Only add message if it belongs to current conversation
      const isRelevant = 
        (message.receiver === receiverId || message.sender._id === receiverId) ||
        (receiverId === 'admin' && message.receiver === 'admin');
      
      if (isRelevant) {
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) return prev;
          
          return [message, ...prev];
        });

        // Update unread count
        if (!message.read && message.receiver !== receiverId) {
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    const handleMessageRead = (event) => {
      const { messageId } = event.detail;
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      ));
    };

    window.addEventListener('socket:new-message', handleNewMessage);
    window.addEventListener('socket:message-read', handleMessageRead);

    return () => {
      window.removeEventListener('socket:new-message', handleNewMessage);
      window.removeEventListener('socket:message-read', handleMessageRead);
    };
  }, [receiverId]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [fetchMessages, fetchUnreadCount]);

  return {
    messages,
    unreadCount,
    loading,
    sending,
    sendMessage,
    markAsRead,
    refreshMessages: fetchMessages,
    refreshUnreadCount: fetchUnreadCount,
    isConnected,
    sendTyping: (isTyping) => sendTyping(receiverId, isTyping)
  };
};