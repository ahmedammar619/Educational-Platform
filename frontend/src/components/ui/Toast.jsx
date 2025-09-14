import React from 'react';
import { X } from 'lucide-react';

const Toast = ({ 
  id, 
  type = 'default', 
  title, 
  description, 
  showLeftBar = false, 
  showDescription = false,
  onClose,
  duration = 4000 
}) => {
  // Color configurations based on type
  const colorConfig = {
    default: {
      icon: 'text-gray-600',
      title: 'text-gray-900',
      description: 'text-gray-600',
      leftBar: 'bg-gray-600',
      iconBg: 'border-gray-600'
    },
    success: {
      icon: 'text-green-600',
      title: 'text-green-700',
      description: 'text-green-600',
      leftBar: 'bg-green-600',
      iconBg: 'border-green-600'
    },
    warning: {
      icon: 'text-orange-600',
      title: 'text-orange-700',
      description: 'text-orange-600',
      leftBar: 'bg-orange-600',
      iconBg: 'border-orange-600'
    },
    error: {
      icon: 'text-red-600',
      title: 'text-red-700',
      description: 'text-red-600',
      leftBar: 'bg-red-600',
      iconBg: 'border-red-600'
    }
  };

  const colors = colorConfig[type] || colorConfig.default;

  return (
    <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[320px] max-w-[480px] animate-in slide-in-from-right-full duration-300">
      {/* Left colored bar */}
      {showLeftBar && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.leftBar} rounded-l-lg`} />
      )}
      
      <div className="flex items-start gap-3">
        {/* Left icon */}
        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${colors.iconBg} flex items-center justify-center`}>
          <div className={`w-2 h-2 rounded-full ${colors.icon}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${colors.title}`}>
            {title}
          </div>
          {showDescription && description && (
            <div className={`text-xs mt-1 ${colors.description} leading-relaxed`}>
              {description}
            </div>
          )}
        </div>
        
        {/* Close button */}
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
