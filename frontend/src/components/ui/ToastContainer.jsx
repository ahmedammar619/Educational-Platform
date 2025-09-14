import React, { useState, useEffect, useCallback } from 'react';
import Toast from './Toast';

const ToastContainer = ({ position = 'top-right' }) => {
  const [toasts, setToasts] = useState([]);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  // Add toast function
  const addToast = useCallback((toastData) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      ...toastData,
      createdAt: Date.now()
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration
    if (toastData.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toastData.duration || 4000);
    }

    return id;
  }, []);

  // Remove toast function
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Expose methods globally
  useEffect(() => {
    window.toastManager = {
      addToast,
      removeToast,
      clearAllToasts
    };
  }, [addToast, removeToast, clearAllToasts]);

  return (
    <div className={`fixed z-50 ${positionClasses[position]} space-y-2 pointer-events-none`}>
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            {...toast}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
