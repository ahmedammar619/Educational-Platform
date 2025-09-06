import api from './api';

class UsersService {
  // Get all users
  async getAllUsers() {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get all students
  async getAllStudents() {
    try {
      const response = await api.get('/students');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get users by role
  async getUsersByRole(role) {
    try {
      const response = await api.get(`/users/role/${role}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.put('/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Deactivate account
  async deactivateAccount() {
    try {
      const response = await api.put('/users/deactivate');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Search users
  async searchUsers(searchTerm, filters = {}) {
    try {
      const params = new URLSearchParams({ search: searchTerm, ...filters });
      const response = await api.get(`/users/search?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new UsersService();
