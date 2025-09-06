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
    const url = queryString ? `/zoom?${queryString}` : '/zoom';
    
    const response = await api.get(url);
    return response.data;
  }

  // Get meetings created by current user
  async getMyMeetings() {
    const response = await api.get('/zoom/my-meetings');
    return response.data;
  }

  // Get a specific meeting by ID
  async getMeetingById(id) {
    const response = await api.get(`/zoom/${id}`);
    return response.data;
  }

  // Create a new meeting
  async createMeeting(meetingData) {
    const response = await api.post('/zoom', meetingData);
    return response.data;
  }

  // Update a meeting
  async updateMeeting(id, meetingData) {
    const response = await api.patch(`/zoom/${id}`, meetingData);
    return response.data;
  }

  // Delete a meeting
  async deleteMeeting(id) {
    await api.delete(`/zoom/${id}`);
  }

  // Join a meeting (increments join count)
  async joinMeeting(id, courseId = null) {
    const body = courseId ? { courseId } : {};
    const response = await api.post(`/zoom/${id}/join`, body);
    return response.data;
  }

  // End a meeting manually (teacher/admin only)
  async endMeeting(id) {
    const response = await api.post(`/zoom/${id}/end`);
    return response.data;
  }

  // Update all meeting statuses (admin only)
  async updateMeetingStatuses() {
    const response = await api.post('/zoom/update-statuses');
    return response.data;
  }
}

export default new ZoomService();
