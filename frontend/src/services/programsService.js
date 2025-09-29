import api from './api';

class ProgramsService {
  async getAllPrograms() {
    try {
      const response = await api.get('/api/programs');
      return response.data;
    } catch (error) {
      console.error('Error fetching programs:', error);
      throw error;
    }
  }

  async getProgram(id) {
    try {
      const response = await api.get(`/api/programs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching program:', error);
      throw error;
    }
  }

  async createProgram(programData) {
    try {
      const response = await api.post('/api/programs', programData);
      return response.data;
    } catch (error) {
      console.error('Error creating program:', error);
      throw error;
    }
  }

  async updateProgram(id, programData) {
    try {
      const response = await api.patch(`/api/programs/${id}`, programData);
      return response.data;
    } catch (error) {
      console.error('Error updating program:', error);
      throw error;
    }
  }

  async deleteProgram(id) {
    try {
      const response = await api.delete(`/api/programs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  }

  async enrollStudents(programId, studentData) {
    try {
      const response = await api.post(`/api/programs/${programId}/enroll-students`, studentData);
      return response.data;
    } catch (error) {
      console.error('Error enrolling students:', error);
      throw error;
    }
  }

  async removeStudent(programId, studentId) {
    try {
      const response = await api.delete(`/api/programs/${programId}/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing student:', error);
      throw error;
    }
  }
}

export default new ProgramsService();
