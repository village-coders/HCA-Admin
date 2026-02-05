import React, { useState, useRef, useEffect } from 'react';
import { useMessages } from '../hooks/useMessage';
import { Send, Paperclip, Image, File, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useSocket } from '../contexts/SocketContext';

const Messages = ({ userId }) => {
  const {
    messages,
    unreadCount,
    loading,
    sendMessage,
    markAsRead,
    isConnected
  } = useMessages();


  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when viewed
  useEffect(() => {
    const unreadMessages = messages.filter(msg => !msg.read && msg.receiver === userId);
    unreadMessages.forEach(msg => {
      markAsRead(msg._id);
    });
  }, [messages, userId, markAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim() && files.length === 0) {
      toast.warning('Please enter a message or attach a file');
      return;
    }

    try {
      await sendMessage(newMessage, 'admin', files);
      setNewMessage('');
      setFiles([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Messages</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="text-center py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.sender._id === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${message.sender._id === userId
                    ? 'bg-[#00853b] text-white rounded-br-none'
                    : 'bg-white border rounded-bl-none'
                  }`}
              >
                {/* Sender info for received messages */}
                {message.sender._id !== userId && (
                  <div className="text-xs font-semibold mb-1 text-gray-700">
                    {message.sender.fullName}
                  </div>
                )}

                {/* Message content */}
                {message.content && (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                )}

                {/* Attachments */}
                {message.attachments?.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment, idx) => (
                      <a
                        key={idx}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-colors"
                      >
                        {getFileIcon(attachment.fileType)}
                        <span className="text-sm truncate">{attachment.filename}</span>
                        <span className="text-xs opacity-75">
                          ({(attachment.size / 1024).toFixed(1)}KB)
                        </span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Message meta */}
                <div className={`flex items-center justify-end gap-2 mt-1 text-xs ${message.sender._id === userId ? 'text-white/80' : 'text-gray-500'}`}>
                  <span>{formatTime(message.createdAt)}</span>
                  {message.sender._id === userId && (
                    message.read ? (
                      <CheckCheck className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
        {/* File preview */}
        {files.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg"
              >
                {getFileIcon(file.type)}
                <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00853b]"
            disabled={!isConnected}
          />

          <button
            onClick={handleSend}
            disabled={(!newMessage.trim() && files.length === 0) || !isConnected}
            className={`px-4 py-2 rounded-lg font-medium ${isConnected
                ? 'bg-[#00853b] text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Messages;