import api from './api';

class AgoraService {
  // Get all meetings with optional filtering
  async getMeetings(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    
    if (filters.search) {
      params.append('search', filters.search);
    }

    if (filters.courseId) {
      params.append('courseId', filters.courseId);
    }

    const queryString = params.toString();
    const url = queryString ? `/api/agora?${queryString}` : '/api/agora';
    
    const response = await api.get(url);
    return response.data;
  }

  // Get meetings for a specific course
  async getMeetingsByCourse(courseId) {
    const response = await api.get(`/api/agora/course/${courseId}`);
    return response.data;
  }

  // Get meetings created by current user
  async getMyMeetings() {
    const response = await api.get('/api/agora/my-meetings');
    return response.data;
  }

  // Get a specific meeting by ID
  async getMeetingById(id) {
    const response = await api.get(`/api/agora/${id}`);
    return response.data;
  }

  // Create a new meeting
  async createMeeting(meetingData) {
    const response = await api.post('/api/agora', meetingData);
    return response.data;
  }

  // Update a meeting
  async updateMeeting(id, meetingData) {
    const response = await api.patch(`/api/agora/${id}`, meetingData);
    return response.data;
  }

  // Delete a meeting
  async deleteMeeting(id) {
    await api.delete(`/api/agora/${id}`);
  }

  // Join a meeting (increments join count)
  async joinMeeting(id, courseId = null) {
    const body = courseId ? { courseId } : {};
    console.log('🚀 agoraService.joinMeeting called with:', { id, courseId, body });
    const response = await api.post(`/api/agora/${id}/join`, body);
    console.log('✅ agoraService.joinMeeting response:', response.data);
    return response.data;
  }

  // Start a meeting and notify students (teacher/admin only)
  async startMeeting(id) {
    console.log('🚀 agoraService.startMeeting called with:', { id });
    const response = await api.post(`/api/agora/${id}/start`);
    console.log('✅ agoraService.startMeeting response:', response.data);
    return response.data;
  }

  // End a meeting manually (teacher/admin only)
  async endMeeting(id) {
    const response = await api.post(`/api/agora/${id}/end`);
    return response.data;
  }

  // Cancel an upcoming meeting (teacher/admin only)
  async cancelMeeting(id) {
    const response = await api.post(`/api/agora/${id}/cancel`);
    return response.data;
  }

  // Get meeting token for joining
  async getMeetingToken(id, role = 'attendee') {
    const response = await api.get(`/api/agora/tokens/${id}`);
    return response.data;
  }

  // Get recording status
  async getRecordingStatus(id) {
    const response = await api.get(`/api/agora/${id}/recording-status`);
    return response.data;
  }
}

export default new AgoraService();
