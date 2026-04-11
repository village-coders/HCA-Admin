import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

const TableActions = ({ actions, direction = 'down' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && buttonRef.current.contains(event.target)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      if (direction === 'up') {
        setMenuPosition({
          top: rect.top - 8, // we will use bottom for css
          right: window.innerWidth - rect.right,
          isUp: true
        });
      } else {
        setMenuPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
          isUp: false
        });
      }
    }
    setIsOpen(!isOpen);
  };

  const portalContent = isOpen && (
    <div 
      ref={dropdownRef}
      className={`fixed w-48 rounded-xl bg-white shadow-lg border border-gray-100 py-1.5 z-[99999] animate-in fade-in zoom-in duration-150 ${
        menuPosition.isUp ? 'origin-bottom-right' : 'origin-top-right'
      }`}
      style={{
        top: menuPosition.isUp ? 'auto' : `${menuPosition.top}px`,
        bottom: menuPosition.isUp ? `${window.innerHeight - menuPosition.top}px` : 'auto',
        right: `${menuPosition.right}px`,
        margin: 0
      }}
    >
      {actions.map((action, index) => {
        if (!action) return null;
        
        const Icon = action.icon;
        
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              setIsOpen(false);
            }}
            disabled={action.disabled}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 ${
              action.variant === 'danger'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-700 hover:bg-gray-50'
            } ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {Icon && <Icon className={`w-4 h-4 ${action.variant === 'danger' ? 'text-red-500' : 'text-gray-400'}`} />}
            <span className="font-medium">{action.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="More actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {typeof document !== 'undefined' ? createPortal(portalContent, document.body) : portalContent}
    </div>
  );
};

export default TableActions;
