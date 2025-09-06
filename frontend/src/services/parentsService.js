import { API_CONFIG } from '../config/api';
import api from './api';

class ParentsService {
  // Get parent profile
  async getParentProfile() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.PARENTS/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update parent profile
  async updateParentProfile(profileData) {
    try {
      const response = await api.put('API_CONFIG.ENDPOINTS.PARENTS/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent's children
  async getMyChildren(parentId) {
    try {
      const response = await api.get(`API_CONFIG.ENDPOINTS.PARENTS/${parentId}/children`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent's children with detailed information
  async getMyChildrenDetailed(parentId) {
    try {
      const response = await api.get(`API_CONFIG.ENDPOINTS.PARENTS/${parentId}/children-detailed`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create child account
  async createChildAccount(childData, parentId) {
    try {
      const response = await api.post(`API_CONFIG.ENDPOINTS.PARENTS/${parentId}/create-child-account`, childData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Remove child account
  async removeChild(childId, parentId) {
    try {
      const response = await api.delete(`API_CONFIG.ENDPOINTS.PARENTS/children/${childId}?parentId=${parentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get child progress
  // async getChildProgress(childId, parentId) {
  //   try {
  //     const response = await api.get(`API_CONFIG.ENDPOINTS.PARENTS/children/${childId}/progress?parentId=${parentId}`);
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || error.message;
  //   }
  // }

  // Get child attendance
  // async getChildAttendance(childId, parentId) {
  //   try {
  //     const response = await api.get(`API_CONFIG.ENDPOINTS.PARENTS/children/${childId}/attendance?parentId=${parentId}`);
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || error.message;
  //   }
  // }

  // Get child grades
  // async getChildGrades(childId, parentId) {
  //   try {
  //     const response = await api.get(`API_CONFIG.ENDPOINTS.PARENTS/children/${childId}/grades?parentId=${parentId}`);
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || error.message;
  //   }
  // }

  // Get parent messages
  async getMessages() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.PARENTS/messages');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Send message
  async sendMessage(messageData) {
    try {
      const response = await api.post('API_CONFIG.ENDPOINTS.PARENTS/messages', messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent dashboard
  async getParentDashboard() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.PARENTS/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent schedule
  async getParentSchedule() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.PARENTS/schedule');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent notifications
  async getParentNotifications() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.PARENTS/notifications');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const response = await api.patch(`API_CONFIG.ENDPOINTS.PARENTS/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get children teachers
  async getChildrenTeachers(parentId) {
    try {
      const response = await api.get(`API_CONFIG.ENDPOINTS.PARENTS/${parentId}/children-teachers`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new ParentsService();
