import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

const AlertDialog = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info', // 'info', 'success', 'warning', 'error'
  buttonText = 'OK'
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      titleColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      titleColor: 'text-green-800',
      borderColor: 'border-green-200',
      buttonColor: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      titleColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      titleColor: 'text-red-800',
      borderColor: 'border-red-200',
      buttonColor: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
    }
  };

  const config = typeConfig[type];
  const IconComponent = config.icon;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${config.borderColor}`}>
            <div className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
                <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${config.titleColor}`}>
                  {title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-gray-700 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${config.buttonColor}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
