// API Configuration
import { getVersion } from '../utils/version.js';

// Get the base URL
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// SIMPLE BULLETPROOF LOGIC: 
// If base URL contains /api in the path, don't add it
// Otherwise, always add /api
const getApiPrefix = () => {
  // Check if /api is already in the URL path (not just domain)
  const urlPath = new URL(baseUrl).pathname;
  if (urlPath.includes('/api')) {
    return ''; // Already has /api in path
  }
  return '/api'; // Always add /api prefix
};

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

const urlPath = new URL(baseUrl).pathname;
console.log('🔧 API Config Debug:');
console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  BASE_URL:', baseUrl);
console.log('  URL_PATH:', urlPath);
console.log('  PATH_HAS_API:', urlPath.includes('/api'));
console.log('  VERSION:', getVersion());
console.log('  API_PREFIX:', getApiPrefix());
console.log('  LOGIN_ENDPOINT:', `${getApiPrefix()}/auth/login`);
console.log('  FINAL_LOGIN_URL:', `${baseUrl}${getApiPrefix()}/auth/login`);
console.log('  AUTH.LOGIN from config:', API_CONFIG.ENDPOINTS.AUTH.LOGIN);

export default API_CONFIG;
