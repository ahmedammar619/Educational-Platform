import api from './api';
import { API_CONFIG } from '../config/api';

class UsersService {
  // Get all users
  async getAllUsers() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.USERS);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get all students
  async getAllStudents() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.STUDENTS);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get users by role
  async getUsersByRole(role) {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.USERS}/role/${role}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.USERS, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await api.delete(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.USERS + '/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.USERS + '/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.USERS + '/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Deactivate account
  async deactivateAccount() {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.USERS + '/deactivate');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Search users
  async searchUsers(searchTerm, filters = {}) {
    try {
      const params = new URLSearchParams({ search: searchTerm, ...filters });
      const response = await api.get(`${API_CONFIG.ENDPOINTS.USERS}/search?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.USERS + '/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new UsersService();
