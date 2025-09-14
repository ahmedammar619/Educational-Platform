import toastService from '../services/toastService';

// Success toast with new design
export const showSuccessToast = (message, description = '', options = {}) => {
  return toastService.success(message, description, options);
};

// Error toast with new design
export const showErrorToast = (message, description = '', options = {}) => {
  return toastService.error(message, description, options);
};

// Warning toast with new design
export const showWarningToast = (message, description = '', options = {}) => {
  return toastService.warning(message, description, options);
};

// Info toast with new design
export const showInfoToast = (message, description = '', options = {}) => {
  return toastService.info(message, description, options);
};

// Confirmation toast with new design
export const showConfirmToast = (message, onConfirm, onCancel, options = {}) => {
  return toastService.confirm(message, '', onConfirm, onCancel, options);
};

// Loading toast with new design
export const showLoadingToast = (message, description = '', options = {}) => {
  return toastService.loading(message, description, options);
};

// Dismiss a specific toast
export const dismissToast = (toastId) => {
  toastService.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toastService.dismissAll();
};
