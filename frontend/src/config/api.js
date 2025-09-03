// API Configuration
console.log('🔧 API Config Debug:');
console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  BASE_URL:', import.meta.env.VITE_API_URL || 'http://localhost:3000');
console.log('  All env vars:', import.meta.env);

export const API_CONFIG = {
  // Base URL for API calls
  // You can change this to match your backend URL
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      PROFILE: '/api/auth/profile',
      CHANGE_PASSWORD: '/api/auth/change-password',
    },
    USERS: '/api/users',
    COURSES: '/api/courses',
    CLASSES: '/api/classes',
    MATERIALS: '/api/materials',
    TEACHERS: '/api/teachers',
    STUDENTS: '/api/students',
    PARENTS: '/api/parents',
    ADMIN: {
      ROOT: '/api/admin',
      DASHBOARD: '/api/admin/dashboard',
      USERS: '/api/admin/users',
      TEACHERS: '/api/admin/teachers'
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
