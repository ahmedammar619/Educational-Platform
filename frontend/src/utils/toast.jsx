import toast from 'react-hot-toast';

// Success toast with custom styling
export const showSuccessToast = (message) => {
  return toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#10B981',
      color: '#fff',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  });
};

// Error toast with custom styling
export const showErrorToast = (message) => {
  return toast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#EF4444',
      color: '#fff',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  });
};

// Warning toast with custom styling
export const showWarningToast = (message) => {
  return toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: '#fff',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  });
};

// Info toast with custom styling
export const showInfoToast = (message) => {
  return toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#fff',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  });
};

// Confirmation toast with custom styling
export const showConfirmToast = (message, onConfirm, onCancel) => {
  return toast(
    (t) => (
      <div className="flex flex-col gap-3">
        <span className="font-medium">{message}</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onConfirm();
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => {
              onCancel?.();
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ),
    {
      duration: 0, // No auto-dismiss for confirmation toasts
      position: 'top-center',
      style: {
        background: '#1F2937',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: '300px',
      },
    }
  );
};

// Loading toast with custom styling
export const showLoadingToast = (message) => {
  return toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#6B7280',
      color: '#fff',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  });
};

// Dismiss a specific toast
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};
