import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import axios from "axios";
import { toast } from "sonner";
import { 
  Search, 
  MessageSquare, 
  Users, 
  Archive, 
  Eye, 
  Phone, 
  Video, 
  MoreVertical,
  Paperclip,
  Send,
  Download,
  File,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  UserCircle,
  Mail,
  Calendar,
  Building,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Trash2,
  Edit2,
  Clock,
  UserPlus,
  AlertCircle
} from "lucide-react";
import { format, isValid } from "date-fns";
import { useSocket } from "../contexts/SocketContext";

function AdminMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  
  const searchTimeout = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const { socket, isConnected } = useSocket();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const controller = new AbortController();

    fetchConversations(controller.signal);

    const interval = setInterval(() => {
      fetchConversations(controller.signal);
    }, 6000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    const handleNewMessage = (message) => {
      console.log('Admin received new message:', message);
      
      // If message is for admin
      if (message.receiver === 'admin') {
        // Add to messages if viewing this conversation
        if (selectedConversation && message.sender._id === selectedConversation._id) {
          setMessages(prev => {
            const exists = prev.some(msg => msg._id === message._id);
            if (exists) return prev;
            return [...prev, { ...message, isMine: false }];
          });
          
          // Show notification
          toast.info(`New message from ${message.sender.fullName}`);
        }
        
        // Update conversation list
        updateConversationList(message);
      }
    };

    // Listen for message read events
    const handleMessageRead = ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      ));
    };

    // Listen for typing indicators
    const handleUserTyping = ({ userId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));

      // Clear typing indicator after 3 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [userId]: false
          }));
        }, 3000);
      }
    };

    // Listen for user joined (for real-time status)
    const handleUserJoined = (data) => {
      console.log('User joined conversation:', data);
      // You can update user online status here
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-read', handleMessageRead);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-joined', handleUserJoined);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-read', handleMessageRead);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-joined', handleUserJoined);
    };
  }, [socket, selectedConversation]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      fetchConversations();
    }, 400);

    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (!selectedConversation) return;

    const controller = new AbortController();

    fetchMessages(controller.signal);
    markAsRead();
    
    // Join the conversation room for real-time updates
    if (socket && isConnected) {
      socket.emit('join-conversation', selectedConversation._id);
    }

    return () => {
      controller.abort();
      // Leave conversation room
      if (socket && isConnected) {
        socket.emit('leave-conversation', selectedConversation._id);
      }
    };
  }, [selectedConversation, socket, isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (signal) => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));

      const response = await axios.get(
        `${baseUrl}/messages/admin/all`,
        {
          signal,
          headers: { Authorization: `Bearer ${token}` },
          params: {
            search: searchQuery,
            status: statusFilter !== 'all' ? statusFilter : undefined
          }
        }
      );

      if (response.data.status === "success") {
        setConversations(response.data.data.conversations || []);
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        toast.error("Failed to load conversations");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update conversation list when new message arrives
  const updateConversationList = (message) => {
    setConversations(prev => {
      const index = prev.findIndex(conv => conv._id === message.sender._id);
      
      if (index !== -1) {
        // Update existing conversation
        const updatedConversations = [...prev];
        updatedConversations[index] = {
          ...updatedConversations[index],
          lastMessage: message,
          unreadCount: updatedConversations[index].unreadCount + 1,
          updatedAt: new Date().toISOString()
        };
        
        // Move to top
        const [movedConversation] = updatedConversations.splice(index, 1);
        return [movedConversation, ...updatedConversations];
      } else {
        // Add new conversation
        const newConversation = {
          _id: message.sender._id,
          user: message.sender,
          lastMessage: message,
          unreadCount: 1,
          updatedAt: new Date().toISOString(),
          status: 'active'
        };
        
        return [newConversation, ...prev];
      }
    });
  };

  const fetchMessages = async (signal) => {
    try {
      setIsLoadingMessages(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));

      const response = await axios.get(
        `${baseUrl}/messages/admin/conversation/${selectedConversation._id}`,
        {
          signal,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === "success") {
        setMessages(response.data.messages);
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        toast.error(error.message);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const markAsRead = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      await axios.put(`${baseUrl}/messages/admin/mark-read/${selectedConversation._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConversations(prev => prev.map(conv => 
        conv._id === selectedConversation._id 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Handle typing events
  const handleTyping = (isTyping) => {
    if (!socket || !isConnected || !selectedConversation) return;

    socket.emit('typing', { 
      conversationId: selectedConversation._id, 
      isTyping 
    });
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { 
          conversationId: selectedConversation._id, 
          isTyping: false 
        });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isSending) return;
    
    if (!newMessage.trim() && attachments.length === 0) {
      toast.error("Message cannot be empty");
      return;
    }

    if (!selectedConversation) {
      toast.error("Please select a conversation first");
      return;
    }

    setIsSending(true);
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const formData = new FormData();
      
      formData.append("content", newMessage);
      formData.append("receiver", selectedConversation.user._id);
      
      attachments.forEach((file) => {
        formData.append("files", file);
      });

      const response = await axios.post(`${baseUrl}/messages/admin/send`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === "success") {
        const newMsg = {
          ...response.data.data,
          senderType: 'admin',
          isMine: true
        };
        
        // Add message to local state immediately
        setMessages(prev => [...prev, newMsg]);
        setNewMessage("");
        setAttachments([]);
        
        // Stop typing indicator
        handleTyping(false);
        
        // Refresh conversations
        fetchConversations();
        
        toast.success("Message sent!");
      }
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);
    if (!isValid(parsedDate)) return "—";

    return format(parsedDate, "hh:mm a");
  };

  const formatDate = (date) => {
    if (!date) return "";

    const messageDate = new Date(date);
    if (!isValid(messageDate)) return "";

    const today = new Date();

    if (today.toDateString() === messageDate.toDateString()) {
      return "Today";
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (yesterday.toDateString() === messageDate.toDateString()) {
      return "Yesterday";
    }

    return format(messageDate, "MMM dd, yyyy");
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowUserInfo(true);
  };

  const archiveConversation = async (conversationId) => {
    if (!window.confirm("Are you sure you want to archive this conversation?")) return;
    
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.put(`${baseUrl}/messages/admin/archive/${conversationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        toast.success("Conversation archived");
        fetchConversations();
        
        if (selectedConversation && selectedConversation._id === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      toast.error("Failed to archive conversation");
      console.error(error);
    }
  };

  const deleteConversation = async (conversationId) => {
    if (!window.confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) return;
    
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.delete(`${baseUrl}/messages/admin/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        toast.success("Conversation deleted");
        fetchConversations();
        
        if (selectedConversation && selectedConversation._id === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      toast.error("Failed to delete conversation");
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.put(`${baseUrl}/messages/admin/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        toast.success("All conversations marked as read");
        fetchConversations();
      }
    } catch (error) {
      toast.error("Failed to mark all as read");
      console.error(error);
    }
  };

  const getUserInfo = async (userId) => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(`${baseUrl}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        setSelectedUser(response.data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  useEffect(() => {
    if (selectedConversation && selectedConversation.user._id) {
      getUserInfo(selectedConversation.user._id);
    }
  }, [selectedConversation]);

  const statsData = [
    { 
      title: "TOTAL CONVERSATIONS", 
      count: conversations.length, 
      icon: MessageSquare,
      color: "bg-blue-500"
    },
    { 
      title: "UNREAD CONVERSATIONS", 
      count: conversations.filter(conv => conv.unreadCount > 0).length, 
      icon: AlertCircle,
      color: "bg-orange-500"
    },
    { 
      title: "ACTIVE TODAY", 
      count: conversations.filter(conv => {
        const today = new Date();
        const convDate = new Date(conv.updatedAt);
        return today.toDateString() === convDate.toDateString();
      }).length, 
      icon: Users,
      color: "bg-green-500"
    },
    { 
      title: "ARCHIVED", 
      count: conversations.filter(conv => conv.status === 'archived').length, 
      icon: Archive,
      color: "bg-purple-500"
    }
  ];

  const filteredConversations = conversations.filter(conv => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'unread') return conv.unreadCount > 0;
    if (statusFilter === 'active') return conv.status === 'active';
    if (statusFilter === 'archived') return conv.status === 'archived';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-purple-100 text-purple-800';
      case 'closed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="dash">       
      <Sidebar /> 
      <main className="content">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Admin Messages</h1>
                <p className="text-gray-600 mt-1">Manage and respond to user messages</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600">
                    {isConnected ? 'Real-time connected' : 'Real-time disconnected'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2.5 bg-[#00853b] text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200 inline-flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Mark All Read
                </button>
                <button 
                  onClick={() => fetchConversations()}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200 inline-flex items-center justify-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {statsData.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{stat.count}</p>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex flex-col lg:flex-row h-[600px]">
              {/* Conversations Sidebar */}
              <div className="lg:w-96 border-r border-gray-200 flex flex-col">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Conversations</h2>
                    <span className="px-2.5 py-1 bg-[#00853b] text-white text-sm font-medium rounded-full">
                      {filteredConversations.length}
                    </span>
                  </div>
                  
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && fetchConversations()}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          fetchConversations();
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Filter Tabs */}
                  <div className="flex space-x-2">
                    {['all', 'unread', 'active', 'archived'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 ${
                          statusFilter === filter
                            ? 'bg-[#00853b] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto p-2">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00853b]"></div>
                      <p className="mt-4 text-gray-600">Loading conversations...</p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                      <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
                      <p className="text-gray-600">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation._id}
                        onClick={() => selectConversation(conversation)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 mb-2 ${
                          selectedConversation?._id === conversation._id
                            ? 'bg-[#00853b]/10 border border-[#00853b]/20'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-full bg-[#00853b]/10 flex items-center justify-center relative">
                              <UserCircle className="w-5 h-5 text-[#00853b]" />
                              {/* Online indicator */}
                              {typingUsers[conversation._id] && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {conversation.user?.fullName || conversation.companyName || 'Unknown User'}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {formatTime(conversation?.lastMessage?.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {conversation.lastMessage?.content?.substring(0, 40) || "No messages yet"}...
                              </p>
                              {typingUsers[conversation._id] && (
                                <p className="text-xs text-blue-500 italic mt-1">
                                  typing...
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conversation.status)}`}>
                                  {conversation.status}
                                </span>
                                {conversation.unreadCount > 0 && (
                                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                                    {conversation.unreadCount} unread
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveConversation(conversation._id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                              title="Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conversation._id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-[#00853b]/10 flex items-center justify-center relative">
                            <UserCircle className="w-6 h-6 text-[#00853b]" />
                            {typingUsers[selectedConversation._id] && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {selectedUser?.fullName || selectedConversation.user?.fullName || 'User'}
                            </h3>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="flex items-center text-sm text-gray-600">
                                <Mail className="w-4 h-4 mr-1" />
                                {selectedUser?.email || selectedConversation.user?.email || 'No email'}
                              </span>
                              <span className="flex items-center text-sm text-gray-600">
                                <Building className="w-4 h-4 mr-1" />
                                {selectedUser?.companyName || selectedConversation.user?._id.slice(0, 6) || 'No company'}
                              </span>
                              <span className="flex items-center text-sm text-gray-600">
                                <Calendar className="w-4 h-4 mr-1" />
                                Joined {selectedUser?.createdAt ? format(new Date(selectedUser.createdAt), 'MMM dd, yyyy') : 'N/A'}
                              </span>
                            </div>
                            {typingUsers[selectedConversation._id] && (
                              <div className="mt-1 text-sm text-blue-500 italic">
                                User is typing...
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowUserInfo(!showUserInfo)}
                            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            title="User Information"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                            <Phone className="w-5 h-5" />
                          </button>
                          <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                      {isLoadingMessages ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00853b]"></div>
                          <p className="mt-4 text-gray-600">Loading messages...</p>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                          <p className="text-gray-600">Start the conversation by sending a message</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {messages.map((message, index) => {
                            const showDate = index === 0 || 
                              formatDate(messages[index-1].createdAt) !== formatDate(message.createdAt);
                            
                            return (
                              <div key={message._id}>
                                {showDate && (
                                  <div className="flex items-center justify-center my-6">
                                    <div className="px-4 py-1.5 bg-white border border-gray-200 rounded-full">
                                      <span className="text-xs font-medium text-gray-600">
                                        {formatDate(message.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                <div className={`flex ${message.receiver !== 'admin' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[70%] ${message.receiver !== 'admin' ? 'ml-auto' : 'mr-auto'}`}>
                                    <div className={`rounded-2xl px-4 py-3 ${
                                      message.receiver !== 'admin' 
                                        ? 'bg-[#00853b] text-white rounded-br-none' 
                                        : 'bg-white border border-gray-200 rounded-bl-none'
                                    }`}>
                                      <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-xs font-medium opacity-90">
                                          {message.receiver !== 'admin' ? 'You' : selectedUser?.fullName || 'User'}
                                        </span>
                                        <Clock className="w-3 h-3" />
                                        <span className="text-xs opacity-75">
                                          {formatTime(message.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-sm">{message.content}</p>
                                      
                                      {message.attachments?.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                          {message.attachments.map((attachment, idx) => (
                                            <div key={idx} className={`p-3 rounded-lg ${
                                              message.receiver !== 'admin' 
                                                ? 'bg-[#00853b]/20' 
                                                : 'bg-gray-100'
                                            }`}>
                                              <div className="flex items-center space-x-3">
                                                {attachment.fileType?.startsWith('image/') || attachment.url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                  <>
                                                    <ImageIcon className="w-5 h-5" />
                                                    <div className="flex-1">
                                                      <p className="text-sm font-medium">{attachment.filename}</p>
                                                      <p className="text-xs text-gray-600">
                                                        {(attachment.size / 1024).toFixed(1)} KB
                                                      </p>
                                                    </div>
                                                    <a 
                                                      href={attachment.url} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="p-1.5 hover:bg-white/20 rounded-lg"
                                                    >
                                                      <Eye className="w-4 h-4" />
                                                    </a>
                                                  </>
                                                ) : (
                                                  <>
                                                    <File className="w-5 h-5" />
                                                    <div className="flex-1">
                                                      <p className="text-sm font-medium">{attachment.filename}</p>
                                                      <p className="text-xs text-gray-600">
                                                        {(attachment.size / 1024).toFixed(1)} KB
                                                      </p>
                                                    </div>
                                                    <a 
                                                      href={attachment.url} 
                                                      download
                                                      className="p-1.5 hover:bg-white/20 rounded-lg"
                                                    >
                                                      <Download className="w-4 h-4" />
                                                    </a>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      
                                      <div className="flex items-center justify-end mt-2">
                                        {message.receiver !== 'admin' && (
                                          <div className="text-xs opacity-75">
                                            {message.read ? (
                                              <span className="flex items-center">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Read
                                              </span>
                                            ) : (
                                              <span className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Sent
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200">
                      {/* Attachments Preview */}
                      {attachments.length > 0 && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">Attachments ({attachments.length})</p>
                            <button
                              type="button"
                              onClick={() => setAttachments([])}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="space-y-2">
                            {attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                  <Paperclip className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-600">
                                      {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(index)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-end space-x-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          className="p-3 text-gray-600 hover:text-[#00853b] hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                          <Paperclip className="w-5 h-5" />
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            multiple
                            className="hidden"
                          />
                        </button>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#00853b] focus:ring-1 focus:ring-[#00853b]"
                            placeholder={`Reply to ${selectedUser?.fullName || 'user'}...`}
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              // Send typing event
                              if (e.target.value.trim()) {
                                handleTyping(true);
                              } else {
                                handleTyping(false);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                              }
                            }}
                            onBlur={() => handleTyping(false)}
                            disabled={isSending}
                          />
                          <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                            Press Enter to send
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                          className="px-6 py-3 bg-[#00853b] text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {isSending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Send</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        <File className="w-3 h-3 inline mr-1" />
                        Maximum file size: 10MB • Supported: Images, PDF, Documents
                      </p>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                    <div className="flex items-center gap-2 mt-4">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-gray-600">
                        {isConnected ? 'Real-time messaging enabled' : 'Real-time messaging disabled'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminMessages;