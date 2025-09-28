import api from './api';

class StudentsService {
  // Get all students (for admin use)
  async getAllStudents() {
    try {
      const response = await api.get('/api/students');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student by ID
  async getStudentById(studentId) {
    try {
      const response = await api.get(`/api/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student profile
  async getStudentProfile() {
    try {
      const response = await api.get('/api/students/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update student profile
  async updateStudentProfile(profileData) {
    try {
      const response = await api.put('/api/students/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student classes
  async getStudentClasses(studentId) {
    try {
      const response = await api.get(`/api/students/${studentId}/classes`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student schedule
  async getStudentSchedule() {
    try {
      const response = await api.get('/api/students/schedule');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Enroll in class
  async enrollInClass(classId) {
    try {
      const response = await api.post(`/api/students/classes/${classId}/enroll`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Unenroll from class
  async unenrollFromClass(classId) {
    try {
      const response = await api.delete(`/api/students/classes/${classId}/enroll`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student progress
  async getStudentProgress() {
    try {
      const response = await api.get('/api/students/progress');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student attendance
  async getStudentAttendance() {
    try {
      const response = await api.get('/api/students/attendance');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student materials
  async getStudentMaterials() {
    try {
      const response = await api.get('/api/students/materials');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student assignments
  async getStudentAssignments() {
    try {
      const response = await api.get('/api/students/assignments');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Submit assignment
  async submitAssignment(assignmentId, submissionData) {
    try {
      const response = await api.post(`/api/students/assignments/${assignmentId}/submit`, submissionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student grades
  async getStudentGrades() {
    try {
      const response = await api.get('/api/students/grades');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get student statistics
  async getStudentStats() {
    try {
      const response = await api.get('/api/students/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get parent's children (for parent use)
  async getParentChildren(parentId) {
    try {
      const response = await api.get(`/api/parents/${parentId}/children`);
      return response.data.children || []; // Extract the children array from the response
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get Google Form URL for student registration
  async getGoogleFormUrl() {
    try {
      const response = await api.get('/api/students/google-form-url');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Mark registration form as completed
  async markFormCompleted() {
    try {
      const response = await api.post('/api/students/mark-form-completed');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get form completion status
  async getFormStatus() {
    try {
      const response = await api.get('/api/students/form-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get all form completions (Admin only)
  async getFormCompletions() {
    try {
      const response = await api.get('/api/students/form-completions');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Reset student form completion (Admin only)
  async resetFormCompletion(studentId) {
    try {
      const response = await api.post(`/api/students/${studentId}/reset-form-completion`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Individual course enrollment methods
  async enrollStudentInCourse(studentId, courseId) {
    try {
      const response = await api.post(`/api/students/${studentId}/enroll-course/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async unenrollStudentFromCourse(studentId, courseId) {
    try {
      const response = await api.delete(`/api/students/${studentId}/unenroll-course/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async getStudentCourseEnrollments(studentId) {
    try {
      const response = await api.get(`/api/students/${studentId}/course-enrollments`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new StudentsService();
