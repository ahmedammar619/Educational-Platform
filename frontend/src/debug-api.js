// Debug API configuration
import { API_CONFIG } from './config/api.js';

console.log('🔍 API Debug Information:');
console.log('BASE_URL:', API_CONFIG.BASE_URL);
console.log('AUTH.LOGIN:', API_CONFIG.ENDPOINTS.AUTH.LOGIN);
console.log('Full Login URL:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.LOGIN);
console.log('Environment:', import.meta.env.MODE);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

export default API_CONFIG;
