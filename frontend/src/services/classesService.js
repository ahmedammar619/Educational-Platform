import api from './api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

class ClassesService {
  // Get all classes
  async getAllClasses() {
    try {
      const response = await api.get('/classes');
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get class by ID
  async getClassById(classId) {
    try {
      const response = await api.get(`/classes/${classId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Create new class
  async createClass(classData) {
    try {
      const response = await api.post('/classes', classData);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Update class
  async updateClass(classId, classData) {
    try {
      const response = await api.patch(`/classes/${classId}`, classData);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Delete class
  async deleteClass(classId) {
    try {
      const response = await api.delete(`/classes/${classId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Enroll students in class
  async enrollStudents(classId, studentIds) {
    try {
      const response = await api.post(`/classes/${classId}/enroll`, {
        studentIds
      });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Remove student from class
  async removeStudentFromClass(classId, studentId) {
    try {
      const response = await api.delete(`/classes/${classId}/students/${studentId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get classes by teacher
  async getClassesByTeacher(teacherId) {
    try {
      const response = await api.get(`/classes/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get enrolled classes for student
  async getEnrolledClasses() {
    try {
      const response = await api.get('/classes/enrolled');
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Search classes
  async searchClasses(searchTerm, filters = {}) {
    try {
      const params = new URLSearchParams({ search: searchTerm, ...filters });
      const response = await api.get(`/classes/search?${params}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get class statistics
  async getClassStats(classId) {
    try {
      const response = await api.get(`/classes/${classId}/stats`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }
}

export default new ClassesService();
