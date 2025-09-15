import api from './api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

class AuthService {
  // User registration
  async register(userData) {
    try {
      const response = await api.post('/api/auth/register', userData);
      showSuccessToast('Registration successful!', 'Your account has been created successfully.');
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Registration failed. Please try again.');
      throw error.response?.data || error.message;
    }
  }

  // Email-only registration
  async registerWithEmailOnly(emailData) {
    try {
      const response = await api.post('/api/auth/register-email', emailData);
      // Don't show success toast here - the verification modal will handle the UI
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Registration failed. Please try again.');
      throw error.response?.data || error.message;
    }
  }

  // User login
  async login(credentials) {
    try {
      const response = await api.post('/api/auth/login', credentials);
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
  async logout() {
    try {
      // Call backend logout endpoint if user is authenticated
      if (this.isAuthenticated()) {
        await api.post('/api/auth/logout');
      }
    } catch (error) {
      // Don't throw error for logout - just log it
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await api.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      showSuccessToast('Profile updated successfully!', 'Your profile information has been saved.');
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to update profile. Please try again.');
      throw error.response?.data || error.message;
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.put('/api/auth/change-password', passwordData);
      showSuccessToast('Password changed successfully!', 'Your password has been updated.');
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to change password. Please try again.');
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

  // Get current user from API (with latest verification status)
  async getCurrentUserFromAPI() {
    try {
      const response = await api.get('/api/auth/profile');
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Email verification methods
  async sendVerificationEmail(userId) {
    try {
      const response = await api.post('/api/auth/send-verification-email', { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async verifyEmail(token) {
    try {
      const response = await api.get(`/api/auth/verify-email?token=${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async resendVerificationEmail(userId) {
    try {
      const response = await api.post('/api/auth/resend-verification-email', { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async sendWelcomeEmailAfterProfileCompletion(userId) {
    try {
      const response = await api.post('/api/auth/send-welcome-email', { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new AuthService();
