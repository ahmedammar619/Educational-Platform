import api from './api';

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
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent's children
  async getMyChildren() {
    try {
      const response = await api.get('/api/parents/children');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create child account
  async createChildAccount(childData) {
    try {
      const response = await api.post('/api/parents/children', childData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Remove child account
  async removeChild(childId) {
    try {
      const response = await api.delete(`/api/parents/children/${childId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get child progress
  async getChildProgress(childId) {
    try {
      const response = await api.get(`/api/parents/children/${childId}/progress`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get child attendance
  async getChildAttendance(childId) {
    try {
      const response = await api.get(`/api/parents/children/${childId}/attendance`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get child grades
  async getChildGrades(childId) {
    try {
      const response = await api.get(`/api/parents/children/${childId}/grades`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

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

  // Get parent dashboard
  async getParentDashboard() {
    try {
      const response = await api.get('/api/parents/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent schedule
  async getParentSchedule() {
    try {
      const response = await api.get('/api/parents/schedule');
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
}

export default new ParentsService();
