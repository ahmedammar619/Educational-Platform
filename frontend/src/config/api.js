// API Configuration
import { getVersion } from '../utils/version.js';

// Get the base URL
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Check if the base URL already includes /api in the path
const hasApiInBaseUrl = baseUrl.includes('/api');

// API prefix logic - BOTH environments need /api prefix
const getApiPrefix = () => {
  if (hasApiInBaseUrl) {
    return ''; // Base URL already includes /api in the path
  }
  return '/api'; // Both local and Railway backends need /api prefix
};

console.log('🔧 API Config Debug:');
console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  BASE_URL:', baseUrl);
console.log('  VERSION:', getVersion());
console.log('  hasApiInBaseUrl:', hasApiInBaseUrl);
console.log('  API_PREFIX:', getApiPrefix());
console.log('  LOGIN_ENDPOINT:', `${getApiPrefix()}/auth/login`);
console.log('  FINAL_LOGIN_URL:', `${baseUrl}${getApiPrefix()}/auth/login`);
console.log('  All env vars:', import.meta.env);

export const API_CONFIG = {
  // Base URL for API calls
  // You can change this to match your backend URL
  BASE_URL: baseUrl,
  
  // API endpoints - dynamically add /api prefix based on environment
  ENDPOINTS: {
    AUTH: {
      LOGIN: `${getApiPrefix()}/auth/login`,
      REGISTER: `${getApiPrefix()}/auth/register`,
      PROFILE: `${getApiPrefix()}/auth/profile`,
      CHANGE_PASSWORD: `${getApiPrefix()}/auth/change-password`,
    },
    USERS: `${getApiPrefix()}/users`,
    COURSES: `${getApiPrefix()}/courses`,
    CLASSES: `${getApiPrefix()}/classes`,
    MATERIALS: `${getApiPrefix()}/materials`,
    TEACHERS: `${getApiPrefix()}/teachers`,
    STUDENTS: `${getApiPrefix()}/students`,
    PARENTS: `${getApiPrefix()}/parents`,
    ADMIN: {
      ROOT: `${getApiPrefix()}/admin`,
      DASHBOARD: `${getApiPrefix()}/admin/dashboard`,
      USERS: `${getApiPrefix()}/admin/users`,
      TEACHERS: `${getApiPrefix()}/admin/teachers`
    },
  },
  
  // Request configuration
  REQUEST_CONFIG: {
    TIMEOUT: 10000,
    HEADERS: {
      'Content-Type': 'application/json',
    },
  },
  
  // Error messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to access this resource.',
    FORBIDDEN: 'Access forbidden.',
    NOT_FOUND: 'Resource not found.',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
  },
};

export default API_CONFIG;
