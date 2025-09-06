import { API_CONFIG } from '../config/api';
import api from './api';

class AdminService {
  // Get admin dashboard stats
  async getDashboardStats() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.ADMIN.ROOT/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get admin dashboard (legacy method - keeping for backward compatibility)
  async getAdminDashboard() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.ADMIN.ROOT/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.ADMIN.ROOT/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await api.get(`API_CONFIG.ENDPOINTS.ADMIN.ROOT/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create user
  async createUser(userData) {
    try {
      const response = await api.post('API_CONFIG.ENDPOINTS.ADMIN.ROOT/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`API_CONFIG.ENDPOINTS.ADMIN.ROOT/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await api.delete(`API_CONFIG.ENDPOINTS.ADMIN.ROOT/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Deactivate user
  async deactivateUser(userId) {
    try {
      const response = await api.patch(`API_CONFIG.ENDPOINTS.ADMIN.ROOT/users/${userId}/deactivate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Reactivate user
  async reactivateUser(userId) {
    try {
      const response = await api.patch(`API_CONFIG.ENDPOINTS.ADMIN.ROOT/users/${userId}/reactivate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get recent users
  async getRecentUsers() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.ADMIN.ROOT/users/recent');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get recent classes
  async getRecentClasses() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.ADMIN.ROOTAPI_CONFIG.ENDPOINTS.CLASSES/recent');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.ADMIN.ROOT/users/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get system statistics
  async getSystemStats() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.ADMIN.ROOT/system/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get system logs
  async getSystemLogs() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.ADMIN.ROOT/system/logs');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get audit trail
  async getAuditTrail() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.ADMIN.ROOT/audit-trail');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get system health
  async getSystemHealth() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.ADMIN.ROOT/system/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new AdminService();
