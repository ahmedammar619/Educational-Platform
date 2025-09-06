import api from './api';
import { API_CONFIG } from '../config/api';

class StudentsService {
  // Get all students (for admin use)
  async getAllStudents() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.STUDENTS);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student by ID
  async getStudentById(studentId) {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.STUDENTS}/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student profile
  async getStudentProfile() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.STUDENTS + '/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update student profile
  async updateStudentProfile(profileData) {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.STUDENTS + '/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student classes
  async getStudentClasses(studentId) {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.STUDENTS}/${studentId}/classes`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student schedule
  async getStudentSchedule() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.STUDENTS + '/schedule');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Enroll in class
  async enrollInClass(classId) {
    try {
      const response = await api.post(`${API_CONFIG.ENDPOINTS.STUDENTS}/classes/${classId}/enroll`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Unenroll from class
  async unenrollFromClass(classId) {
    try {
      const response = await api.delete(`${API_CONFIG.ENDPOINTS.STUDENTS}/classes/${classId}/enroll`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student progress
  async getStudentProgress() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.STUDENTS + '/progress');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student attendance
  async getStudentAttendance() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.STUDENTS + '/attendance');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student materials
  async getStudentMaterials() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.STUDENTS + '/materials');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student assignments
  async getStudentAssignments() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.STUDENTS + '/assignments');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Submit assignment
  async submitAssignment(assignmentId, submissionData) {
    try {
      const response = await api.post(`${API_CONFIG.ENDPOINTS.STUDENTS}/assignments/${assignmentId}/submit`, submissionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student grades
  async getStudentGrades() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.STUDENTS + '/grades');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student statistics
  async getStudentStats() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.STUDENTS + '/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent's children (for parent use)
  async getParentChildren(parentId) {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.PARENTS}/${parentId}/children`);
      return response.data.children || []; // Extract the children array from the response
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new StudentsService();
