import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { handleApiError } from '../utils/errorHandler';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.REQUEST_CONFIG.TIMEOUT,
  headers: API_CONFIG.REQUEST_CONFIG.HEADERS,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔐 API Request Interceptor:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header added:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('❌ No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.log('🚨 401 Unauthorized - Clearing token and redirecting to login');
      localStorage.removeItem('token');
      
      // Don't redirect if this is a login attempt
      const isLoginAttempt = error.config?.url?.includes('/auth/login');
      if (!isLoginAttempt) {
        // Show session expired toast before redirecting
        if (window.toastManager) {
          window.toastManager.addToast({
            type: 'warning',
            title: 'Session Expired',
            description: 'Your session has expired. Please log in again.',
            showLeftBar: true,
            showDescription: true,
            duration: 5000
          });
        }
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } else if (error.response?.status === 403) {
      // Show permission denied toast
      if (window.toastManager) {
        window.toastManager.addToast({
          type: 'error',
          title: 'Access Denied',
          description: 'You do not have permission to perform this action.',
          showLeftBar: true,
          showDescription: true,
          duration: 5000
        });
      }
    } else if (error.response?.status >= 500) {
      // Show server error toast
      if (window.toastManager) {
        window.toastManager.addToast({
          type: 'error',
          title: 'Server Error',
          description: 'Something went wrong on our end. Please try again later.',
          showLeftBar: true,
          showDescription: true,
          duration: 5000
        });
      }
    }
    
    // Transform error using our error handler
    const handledError = handleApiError(error);
    return Promise.reject(handledError);
  }
);

export default api;
