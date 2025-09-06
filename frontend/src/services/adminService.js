import api from './api';

class AdminService {
  // Get admin dashboard stats
  async getDashboardStats() {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get admin dashboard (legacy method - keeping for backward compatibility)
  async getAdminDashboard() {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create user
  async createUser(userData) {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Deactivate user
  async deactivateUser(userId) {
    try {
      const response = await api.patch(`/admin/users/${userId}/deactivate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Reactivate user
  async reactivateUser(userId) {
    try {
      const response = await api.patch(`/admin/users/${userId}/reactivate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get recent users
  async getRecentUsers() {
    try {
      const response = await api.get('/admin/users/recent');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get recent classes
  async getRecentClasses() {
    try {
      const response = await api.get('/admin/classes/recent');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const response = await api.get('/admin/users/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get system statistics
  async getSystemStats() {
    try {
      const response = await api.get('/admin/system/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get system logs
  async getSystemLogs() {
    try {
      const response = await api.get('/admin/system/logs');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get audit trail
  async getAuditTrail() {
    try {
      const response = await api.get('/admin/audit-trail');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get system health
  async getSystemHealth() {
    try {
      const response = await api.get('/admin/system/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new AdminService();
