import api from './api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

class ClassesService {
  // Get all classes
  async getAllClasses() {
    try {
      const response = await api.get('/api/classes');
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get class by ID
  async getClassById(classId) {
    try {
      const response = await api.get(`/api/classes/${classId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Create new class
  async createClass(classData) {
    try {
      const response = await api.post('/api/classes', classData);
      showSuccessToast('Class created successfully!', `"${classData.name}" has been created and is ready for students.`);
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to create class. Please try again.');
      throw error;
    }
  }

  // Update class
  async updateClass(classId, classData) {
    try {
      const response = await api.patch(`/api/classes/${classId}`, classData);
      showSuccessToast('Class updated successfully!', `"${classData.name}" has been updated.`);
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to update class. Please try again.');
      throw error;
    }
  }

  // Delete class
  async deleteClass(classId) {
    try {
      const response = await api.delete(`/api/classes/${classId}`);
      showSuccessToast('Class deleted successfully!', 'The class has been removed from the system.');
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to delete class. Please try again.');
      throw error;
    }
  }

  // Enroll students in class
  async enrollStudents(classId, studentIds) {
    try {
      const response = await api.post(`/api/classes/${classId}/enroll`, {
        studentIds
      });
      showSuccessToast('Students enrolled successfully!', `${studentIds.length} student(s) have been added to the class.`);
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to enroll students. Please try again.');
      throw error;
    }
  }

  // Remove student from class
  async removeStudentFromClass(classId, studentId) {
    try {
      const response = await api.delete(`/api/classes/${classId}/students/${studentId}`);
      showSuccessToast('Student removed successfully!', 'The student has been removed from the class.');
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to remove student. Please try again.');
      throw error;
    }
  }

  // Get classes by teacher
  async getClassesByTeacher(teacherId) {
    try {
      const response = await api.get(`/api/classes/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get enrolled classes for student
  async getEnrolledClasses() {
    try {
      const response = await api.get('/api/classes/enrolled');
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
      const response = await api.get(`/api/classes/search?${params}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get class statistics
  async getClassStats(classId) {
    try {
      const response = await api.get(`/api/classes/${classId}/stats`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }
}

export default new ClassesService();
