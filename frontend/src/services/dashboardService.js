import api from './api';

class DashboardService {
  // Get general dashboard data
  async getDashboardData() {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user-specific dashboard data
  async getUserDashboard() {
    try {
      const response = await api.get('/dashboard/user');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get teacher dashboard data
  async getTeacherDashboard(teacherId) {
    try {
      const response = await api.get(`/dashboard/teacher?userId=${teacherId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student dashboard data
  async getStudentDashboard(studentId) {
    try {
      const response = await api.get(`/dashboard/student?studentId=${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent dashboard data
  async getParentDashboard(parentId) {
    try {
      const response = await api.get(`/dashboard/parent?parentId=${parentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get admin dashboard data
  async getAdminDashboard() {
    try {
      const response = await api.get('/dashboard/admin');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get recent activities
  async getRecentActivities() {
    try {
      const response = await api.get('/dashboard/activities');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get notifications
  async getNotifications() {
    try {
      const response = await api.get('/dashboard/notifications');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const response = await api.patch(`/dashboard/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get upcoming events
  async getUpcomingEvents() {
    try {
      const response = await api.get('/dashboard/events');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get announcements
  async getAnnouncements() {
    try {
      const response = await api.get('/dashboard/announcements');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get system statistics
  async getSystemStats() {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get user activity summary
  async getUserActivitySummary() {
    try {
      const response = await api.get('/dashboard/activity-summary');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get course progress summary
  async getCourseProgressSummary() {
    try {
      const response = await api.get('/dashboard/course-progress');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get attendance summary
  async getAttendanceSummary() {
    try {
      const response = await api.get('/dashboard/attendance-summary');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new DashboardService();
