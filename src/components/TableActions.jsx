import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

const TableActions = ({ actions, direction = 'down' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="More actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className={`absolute right-0 w-48 rounded-xl bg-white shadow-lg border border-gray-100 py-1.5 z-100 animate-in fade-in zoom-in duration-150 ${
          direction === 'up' ? 'bottom-full mb-2 origin-bottom-right' : 'mt-2 origin-top-right'
        }`}>
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
      )}
    </div>
  );
};

export default TableActions;
