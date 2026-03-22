import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BellDot, X } from 'lucide-react';

const DashboardHeader = ({ title }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const baseUrl = import.meta.env.VITE_BASE_URL;

  const fetchNotifications = async () => {
    try {
      const tokenString = localStorage.getItem("accessToken");
      if (!tokenString) return;
      const token = JSON.parse(tokenString);
      
      const res = await axios.get(`${baseUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);
    if (unreadCount > 0 && !showDropdown) {
      try {
        const tokenString = localStorage.getItem("accessToken");
        if (!tokenString) return;
        const token = JSON.parse(tokenString);
        
        await axios.put(`${baseUrl}/notifications/mark-read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(0);
        fetchNotifications();
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
  };

  const handleClearAll = async () => {
    try {
      const tokenString = localStorage.getItem("accessToken");
      if (!tokenString) return;
      const token = JSON.parse(tokenString);

      await axios.delete(`${baseUrl}/notifications/clear-all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const handleClearOne = async (id, e) => {
    e.stopPropagation();
    try {
      const tokenString = localStorage.getItem("accessToken");
      if (!tokenString) return;
      const token = JSON.parse(tokenString);

      await axios.delete(`${baseUrl}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  };

  return (
    <div className="dashboard-header relative">
      <h1>{title}</h1>
      <div className="header-actions">
        <div className="relative" ref={dropdownRef}>
          <button className="notification-btn cursor-pointer" onClick={handleBellClick}>
            <BellDot />
            {unreadCount > 0 && (
              <span className="text-red-500 font-bold absolute -top-5 right-0">{unreadCount}</span>
            )}
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif._id} className={`p-4 border-b border-gray-100 ${notif.isRead ? 'bg-white' : 'bg-green-50'} hover:bg-gray-50 transition-colors relative group`}>
                      <button 
                        onClick={(e) => handleClearOne(notif._id, e)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-sm font-medium text-gray-800 pr-6">{notif.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <button className="user-menu">
          <i className="fas fa-user-circle"></i>
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;