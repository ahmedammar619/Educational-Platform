import api from './api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

class CoursesService {
  // Get all courses
  async getAllCourses() {
    try {
      const response = await api.get('/api/courses');
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get course by ID
  async getCourseById(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Create new course
  async createCourse(courseData) {
    try {
      const response = await api.post('/api/courses', courseData);
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to create course. Please try again.');
      throw error;
    }
  }

  // Get courses by teacher
  async getCoursesByTeacher(teacherId) {
    try {
      const response = await api.get(`/api/courses/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting courses by teacher:', error);
      throw error;
    }
  }

  // Update course
  async updateCourse(courseId, courseData) {
    try {
      const response = await api.patch(`/api/courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to update course. Please try again.');
      throw error;
    }
  }

  // Delete course
  async deleteCourse(courseId) {
    try {
      const response = await api.delete(`/api/courses/${courseId}`);
      return response.data;
    } catch (error) {
      showErrorToast(error, 'Failed to delete course. Please try again.');
      throw error;
    }
  }

  // Get courses by class
  async getCoursesByClass(classId) {
    try {
      const response = await api.get(`/api/courses/class/${classId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get courses by teacher (if implemented in backend)
  async getCoursesByTeacher(teacherId) {
    try {
      const response = await api.get(`/api/courses/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get enrolled courses for student (deprecated - students now get courses through class enrollment)
  // async getEnrolledCourses() {
  //   try {
  //     const response = await api.get('/api/courses/enrolled');
  //     return response.data;
  //   } catch (error) {
  //     // Error is already handled by the API interceptor
  //     throw error;
  //   }
  // }

  // Enroll in course (if implemented in backend)
  async enrollInCourse(courseId) {
    try {
      const response = await api.post(`/api/courses/${courseId}/enroll`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Unenroll from course (if implemented in backend)
  async unenrollFromCourse(courseId) {
    try {
      const response = await api.delete(`/api/courses/${courseId}/enroll`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get course materials
  async getCourseMaterials(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}/materials`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Add course material
  async addCourseMaterial(courseId, materialData) {
    try {
      const response = await api.post(`/api/courses/${courseId}/materials`, materialData);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Note: Session management is now handled through the updateCourse method
  // Sessions are stored as JSON directly in the course entity

  // Get course schedule
  async getCourseSchedule(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}/schedule`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Search courses
  async searchCourses(searchTerm, filters = {}) {
    try {
      const params = new URLSearchParams({ search: searchTerm, ...filters });
      const response = await api.get(`/api/courses/search?${params}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get course statistics
  async getCourseStats(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}/stats`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get students enrolled in a course
  async getCourseStudents(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}/students`);
      // Backend returns {students: []} format, extract the students array
      return response.data.students || response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new CoursesService();
