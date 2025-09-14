import api from './api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

class ParentsService {
  // Get parent profile
  async getParentProfile() {
    try {
      const response = await api.get('/api/parents/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update parent profile
  async updateParentProfile(profileData) {
    try {
      const response = await api.put('/api/parents/profile', profileData);
      showSuccessToast('Profile updated successfully!', 'Your parent profile has been updated.');
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to update profile. Please try again.');
      throw error.response?.data || error.message;
    }
  }

  // Get parent's children
  async getMyChildren(parentId) {
    try {
      const response = await api.get(`/api/parents/${parentId}/children`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent's children with detailed information
  async getMyChildrenDetailed(parentId) {
    try {
      const response = await api.get(`/api/parents/${parentId}/children-detailed`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create child account
  async createChildAccount(childData, parentId) {
    try {
      const response = await api.post(`/api/parents/${parentId}/create-child-account`, childData);
      showSuccessToast('Child account created successfully!', `Account for ${childData.firstName} ${childData.lastName} has been created.`);
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to create child account. Please try again.');
      throw error.response?.data || error.message;
    }
  }

  // Remove child account
  async removeChild(childId, parentId) {
    try {
      const response = await api.delete(`/api/parents/children/${childId}?parentId=${parentId}`);
      showSuccessToast('Child account removed successfully!', 'The child account has been removed from your profile.');
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to remove child account. Please try again.');
      throw error.response?.data || error.message;
    }
  }

  // Get child progress
  // async getChildProgress(childId, parentId) {
  //   try {
  //     const response = await api.get(`/api/parents/children/${childId}/progress?parentId=${parentId}`);
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || error.message;
  //   }
  // }

  // Get child attendance
  // async getChildAttendance(childId, parentId) {
  //   try {
  //     const response = await api.get(`/api/parents/children/${childId}/attendance?parentId=${parentId}`);
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || error.message;
  //   }
  // }

  // Get child grades
  // async getChildGrades(childId, parentId) {
  //   try {
  //     const response = await api.get(`/api/parents/children/${childId}/grades?parentId=${parentId}`);
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || error.message;
  //   }
  // }

  // Get parent messages
  async getMessages() {
    try {
      const response = await api.get('/api/parents/messages');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Send message
  async sendMessage(messageData) {
    try {
      const response = await api.post('/api/parents/messages', messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }


  // Get parent schedule
  async getParentSchedule(parentId) {
    try {
      const response = await api.get(`/api/parents/${parentId}/schedule`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent notifications
  async getParentNotifications() {
    try {
      const response = await api.get('/api/parents/notifications');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const response = await api.patch(`/api/parents/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get children teachers
  async getChildrenTeachers(parentId) {
    try {
      const response = await api.get(`/api/parents/${parentId}/children-teachers`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new ParentsService();
