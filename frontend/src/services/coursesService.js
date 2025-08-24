import api from './api';

class CoursesService {
  // Get all courses
  async getAllCourses() {
    try {
      const response = await api.get('/api/courses');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get course by ID
  async getCourseById(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create new course
  async createCourse(courseData) {
    try {
      const response = await api.post('/api/courses', courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update course
  async updateCourse(courseId, courseData) {
    try {
      const response = await api.put(`/api/courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Delete course
  async deleteCourse(courseId) {
    try {
      const response = await api.delete(`/api/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get courses by teacher
  async getCoursesByTeacher(teacherId) {
    try {
      const response = await api.get(`/api/courses/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get enrolled courses for student
  async getEnrolledCourses() {
    try {
      const response = await api.get('/api/courses/enrolled');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Enroll in course
  async enrollInCourse(courseId) {
    try {
      const response = await api.post(`/api/courses/${courseId}/enroll`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Unenroll from course
  async unenrollFromCourse(courseId) {
    try {
      const response = await api.delete(`/api/courses/${courseId}/enroll`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get course materials
  async getCourseMaterials(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}/materials`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Add course material
  async addCourseMaterial(courseId, materialData) {
    try {
      const response = await api.post(`/api/courses/${courseId}/materials`, materialData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get course sessions
  async getCourseSessions(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}/sessions`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create course session
  async createCourseSession(courseId, sessionData) {
    try {
      const response = await api.post(`/api/courses/${courseId}/sessions`, sessionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get course schedule
  async getCourseSchedule(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}/schedule`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Search courses
  async searchCourses(searchTerm, filters = {}) {
    try {
      const params = new URLSearchParams({ search: searchTerm, ...filters });
      const response = await api.get(`/api/courses/search?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get course statistics
  async getCourseStats(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new CoursesService();
