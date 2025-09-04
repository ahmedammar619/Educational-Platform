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
  async getParentChildren() {
    try {
      const response = await api.get('/api/parents/children');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new StudentsService();
