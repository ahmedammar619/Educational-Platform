import api from './api';

class ZoomService {
  // Get all meetings with optional filtering
  async getMeetings(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    
    if (filters.search) {
      params.append('search', filters.search);
    }

    const queryString = params.toString();
    const url = queryString ? `/api/zoom?${queryString}` : '/api/zoom';
    
    const response = await api.get(url);
    return response.data;
  }

  // Get meetings created by current user
  async getMyMeetings() {
    const response = await api.get('/api/zoom/my-meetings');
    return response.data;
  }

  // Get a specific meeting by ID
  async getMeetingById(id) {
    const response = await api.get(`/api/zoom/${id}`);
    return response.data;
  }

  // Create a new meeting
  async createMeeting(meetingData) {
    const response = await api.post('/api/zoom', meetingData);
    return response.data;
  }

  // Update a meeting
  async updateMeeting(id, meetingData) {
    const response = await api.patch(`/api/zoom/${id}`, meetingData);
    return response.data;
  }

  // Delete a meeting
  async deleteMeeting(id) {
    await api.delete(`/api/zoom/${id}`);
  }

  // Join a meeting (increments join count)
  async joinMeeting(id) {
    const response = await api.post(`/api/zoom/${id}/join`);
    return response.data;
  }

  // End a meeting manually (teacher/admin only)
  async endMeeting(id) {
    const response = await api.post(`/api/zoom/${id}/end`);
    return response.data;
  }

  // Update all meeting statuses (admin only)
  async updateMeetingStatuses() {
    const response = await api.post('/api/zoom/update-statuses');
    return response.data;
  }
}

export default new ZoomService();
