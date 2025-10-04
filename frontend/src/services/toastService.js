// Toast service for managing toast notifications
class ToastService {
  constructor() {
    this.toastManager = null;
    this.pendingToasts = [];
  }

  // Initialize the toast manager
  init() {
    // Wait for toast manager to be available
    const checkManager = () => {
      if (window.toastManager) {
        this.toastManager = window.toastManager;
        console.log('✅ Toast manager initialized successfully');
        
        // Process any pending toasts
        this.processPendingToasts();
        return true;
      }
      return false;
    };

    if (!checkManager()) {
      // Retry after a short delay
      setTimeout(() => {
        if (!checkManager()) {
          console.warn('❌ Toast manager not available after retry');
        }
      }, 100);
    }
  }

  // Process pending toasts
  processPendingToasts() {
    while (this.pendingToasts.length > 0) {
      const toastOptions = this.pendingToasts.shift();
      this.showToastDirect(toastOptions);
    }
  }

  // Direct toast method that doesn't retry
  showToastDirect(options) {
    if (!this.toastManager) {
      console.warn('❌ Toast manager not available, falling back to alert');
      alert(`${options.title}: ${options.description || ''}`);
      return null;
    }

    const defaultOptions = {
      type: 'default',
      title: 'Notification',
      description: '',
      showLeftBar: false,
      showDescription: false,
      duration: 4000,
      position: 'top-right'
    };

    console.log('📢 Showing toast:', { ...defaultOptions, ...options });
    return this.toastManager.addToast({ ...defaultOptions, ...options });
  }

  // Generic toast method
  showToast(options) {
    // Try to get the toast manager
    if (!this.toastManager) {
      this.toastManager = window.toastManager;
    }

    // If still not available, add to pending queue
    if (!this.toastManager) {
      console.log('📝 Toast manager not ready, queuing toast');
      this.pendingToasts.push(options);
      this.init();
      return null;
    }

    return this.showToastDirect(options);
  }

  // Success toast
  success(title, description = '', options = {}) {
    return this.showToast({
      type: 'success',
      title,
      description,
      showLeftBar: options.showLeftBar || false,
      showDescription: !!description || options.showDescription,
      duration: options.duration || 4000,
      ...options
    });
  }

  // Error toast
  error(title, description = '', options = {}) {
    return this.showToast({
      type: 'error',
      title,
      description,
      showLeftBar: options.showLeftBar || false,
      showDescription: !!description || options.showDescription,
      duration: options.duration || 5000,
      ...options
    });
  }

  // Warning toast
  warning(title, description = '', options = {}) {
    return this.showToast({
      type: 'warning',
      title,
      description,
      showLeftBar: options.showLeftBar || false,
      showDescription: !!description || options.showDescription,
      duration: options.duration || 4000,
      ...options
    });
  }

  // Info toast
  info(title, description = '', options = {}) {
    return this.showToast({
      type: 'default',
      title,
      description,
      showLeftBar: options.showLeftBar || false,
      showDescription: !!description || options.showDescription,
      duration: options.duration || 4000,
      ...options
    });
  }

  // Loading toast (persistent until dismissed)
  loading(title, description = '', options = {}) {
    return this.showToast({
      type: 'default',
      title,
      description,
      showLeftBar: options.showLeftBar || false,
      showDescription: !!description || options.showDescription,
      duration: 0, // No auto-dismiss
      ...options
    });
  }

  // Confirmation toast with actions
  confirm(title, description = '', onConfirm, onCancel, options = {}) {
    const toastId = this.showToast({
      type: 'default',
      title,
      description,
      showLeftBar: options.showLeftBar || false,
      showDescription: !!description || options.showDescription,
      duration: 0, // No auto-dismiss
      ...options
    });

    // Add action buttons to the toast
    // This would require extending the Toast component to support custom content
    return toastId;
  }

  // Dismiss specific toast
  dismiss(toastId) {
    if (this.toastManager) {
      this.toastManager.removeToast(toastId);
    }
  }

  // Dismiss all toasts
  dismissAll() {
    if (this.toastManager) {
      this.toastManager.clearAllToasts();
    }
  }

  // Convenience methods for common use cases
  showSuccess = (message) => this.success(message);
  showError = (message) => this.error(message);
  showWarning = (message) => this.warning(message);
  showInfo = (message) => this.info(message);
  showLoading = (message) => this.loading(message);
}

// Create singleton instance
const toastService = new ToastService();

export default toastService;
