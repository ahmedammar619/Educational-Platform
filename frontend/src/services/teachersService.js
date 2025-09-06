import { API_CONFIG } from '../config/api';
import api from './api';

class TeachersService {
  // Get teacher profile
  async getTeacherProfile() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.TEACHERS/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update teacher profile
  async updateTeacherProfile(profileData) {
    try {
      const response = await api.put('API_CONFIG.ENDPOINTS.TEACHERS/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get teacher classes
  async getTeacherClasses() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.TEACHERSAPI_CONFIG.ENDPOINTS.CLASSES');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get teacher students
  async getTeacherStudents() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.TEACHERS/students');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get teacher schedule
  async getTeacherSchedule() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.TEACHERS/schedule');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create class
  async createClass(classData) {
    try {
      const response = await api.post('API_CONFIG.ENDPOINTS.TEACHERSAPI_CONFIG.ENDPOINTS.CLASSES', classData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update class
  async updateClass(classId, classData) {
    try {
      const response = await api.put(`API_CONFIG.ENDPOINTS.TEACHERSAPI_CONFIG.ENDPOINTS.CLASSES/${classId}`, classData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Delete class
  async deleteClass(classId) {
    try {
      const response = await api.delete(`API_CONFIG.ENDPOINTS.TEACHERSAPI_CONFIG.ENDPOINTS.CLASSES/${classId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get class details
  async getClassDetails(classId) {
    try {
      const response = await api.get(`API_CONFIG.ENDPOINTS.TEACHERSAPI_CONFIG.ENDPOINTS.CLASSES/${classId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get class students
  async getClassStudents(classId) {
    try {
      const response = await api.get(`API_CONFIG.ENDPOINTS.TEACHERSAPI_CONFIG.ENDPOINTS.CLASSES/${classId}/students`);
      // Backend returns {students: []} format, extract the students array
      return response.data.students || response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Add student to class
  async addStudentToClass(classId, studentId) {
    try {
      const response = await api.post(`API_CONFIG.ENDPOINTS.TEACHERSAPI_CONFIG.ENDPOINTS.CLASSES/${classId}/students`, { studentId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Remove student from class
  async removeStudentFromClass(classId, studentId) {
    try {
      const response = await api.delete(`API_CONFIG.ENDPOINTS.TEACHERSAPI_CONFIG.ENDPOINTS.CLASSES/${classId}/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get teacher statistics
  async getTeacherStats() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.TEACHERS/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get teacher availability
  async getTeacherAvailability() {
    try {
      const response = await api.get('API_CONFIG.ENDPOINTS.TEACHERS/availability');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update teacher availability
  async updateTeacherAvailability(availabilityData) {
    try {
      const response = await api.put('API_CONFIG.ENDPOINTS.TEACHERS/availability', availabilityData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new TeachersService();
