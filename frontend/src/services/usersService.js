import api from './api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

class UsersService {
  // Get all users
  async getAllUsers() {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get all students
  async getAllStudents() {
    try {
      const response = await api.get('/api/students');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await api.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get users by role
  async getUsersByRole(role) {
    try {
      const response = await api.get(`/api/users/role/${role}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      const response = await api.post('/api/users', userData);
      showSuccessToast('User created successfully!', `User account for ${userData.firstName} ${userData.lastName} has been created.`);
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to create user. Please try again.');
      throw error.response?.data || error.message;
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/api/users/${userId}`, userData);
      showSuccessToast('User updated successfully!', 'User information has been updated.');
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to update user. Please try again.');
      throw error.response?.data || error.message;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/api/users/${userId}`);
      showSuccessToast('User deleted successfully!', 'The user account has been removed.');
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to delete user. Please try again.');
      throw error.response?.data || error.message;
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const response = await api.get('/api/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const response = await api.put('/api/users/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.put('/api/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Deactivate account
  async deactivateAccount() {
    try {
      const response = await api.put('/api/users/deactivate');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Search users
  async searchUsers(searchTerm, filters = {}) {
    try {
      const params = new URLSearchParams({ search: searchTerm, ...filters });
      const response = await api.get(`/api/users/search?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const response = await api.get('/api/users/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new UsersService();
