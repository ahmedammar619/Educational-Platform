import api from './api';
import { API_CONFIG } from '../config/api';

class AuthService {
  // User registration
  async register(userData) {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // User login
  async login(credentials) {
    try {
      console.log('🔐 Auth Login Debug:', {
        endpoint: API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        baseUrl: API_CONFIG.BASE_URL,
        fullUrl: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`
      });
      const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
      const { token, user } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // User logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Don't redirect here - let the App component handle it
    // window.location.href = '/login';
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.AUTH.PROFILE, profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Get current user from localStorage
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }
}

export default new AuthService();
