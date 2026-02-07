import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  FileText, 
  Package, 
  Award, 
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MessageCircleIcon
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth'
import {useNavigate} from 'react-router-dom'

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const {user, fetchUser} = useAuth()
  const navigate = useNavigate()

  useEffect(()=> {
    fetchUser()
  }, [])

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/companies', icon: Building2, label: 'Companies' },
    { path: '/applications', icon: FileText, label: 'Applications' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/certificates', icon: Award, label: 'Certificates' },
    ...(user?.role === "super admin"
      ? [{ path: '/manage-admins', icon: Users, label: 'Manage Admin' }]
      : []),
    { path: '/message', icon: MessageCircleIcon, label: 'Message' },
  ];

  function logout(){
    localStorage.removeItem("accessToken")
    navigate("/")
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-800">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#00853b] flex items-center justify-center text-white font-bold">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-200 shadow-sm
        transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
        {/* Sidebar Header */}
        <div className={`p-6 border-b border-gray-200 ${isCollapsed ? 'lg:px-4' : ''}`}>
          <div className={`flex items-center justify-between ${isCollapsed ? 'flex-col space-y-2' : ''}`}>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-xs text-gray-600 mt-1">Certification System</p>
              </div>
            )}
            {isCollapsed && (
              <div className="w-10 h-10 rounded-lg bg-[#00853b] flex items-center justify-center">
                <span className="text-white font-bold text-lg">{user.fullName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {
          navItems.map((item) => (          
            
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-4'} py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-[#00853b] text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
          
          <button className={`
            flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-4'} py-3 w-full rounded-lg
            text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 mt-8 cursor-pointer`}
            onClick={logout}
            >
            <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </nav>

        {/* User Profile */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[#00853b]/10 flex items-center justify-center">
                <span className="text-[#00853b] font-bold">{user?.fullName?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">{`${user?.fullName?.split(' ')[0].charAt(0).toUpperCase() + user?.fullName?.split(' ')[0].slice(1)} `}</p>
                <p className="text-xs text-gray-600">{user?.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;