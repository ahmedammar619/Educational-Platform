// API Configuration
import { getVersion } from '../utils/version.js';

// All environments use /api prefix
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const apiPrefix = '/api'; // All environments use /api prefix

console.log('🔧 API Config Debug:');
console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  BASE_URL:', baseUrl);
console.log('  API_PREFIX:', apiPrefix);
console.log('  VERSION:', getVersion());
console.log('  All env vars:', import.meta.env);

export const API_CONFIG = {
  // Base URL for API calls
  BASE_URL: baseUrl,
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: `${apiPrefix}/auth/login`,
      REGISTER: `${apiPrefix}/auth/register`,
      PROFILE: `${apiPrefix}/auth/profile`,
      CHANGE_PASSWORD: `${apiPrefix}/auth/change-password`,
    },
    USERS: `${apiPrefix}/users`,
    COURSES: `${apiPrefix}/courses`,
    CLASSES: `${apiPrefix}/classes`,
    MATERIALS: `${apiPrefix}/materials`,
    TEACHERS: `${apiPrefix}/teachers`,
    STUDENTS: `${apiPrefix}/students`,
    PARENTS: `${apiPrefix}/parents`,
    ADMIN: {
      ROOT: `${apiPrefix}/admin`,
      DASHBOARD: `${apiPrefix}/admin/dashboard`,
      USERS: `${apiPrefix}/admin/users`,
      TEACHERS: `${apiPrefix}/admin/teachers`
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
