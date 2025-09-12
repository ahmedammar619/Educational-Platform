import api from './api';

// Updated: Fixed API endpoints with /api/ prefix - v1.1
const announcementsService = {
  // Posts related functions
  async getAnnouncementPosts() {
    try {
      const response = await api.get('/api/announcements/posts');
      return response.data;
    } catch (error) {
      console.error('Error fetching announcement posts:', error);
      throw error;
    }
  },

  async createAnnouncementPost(postData, file = null) {
    try {
      const formData = new FormData();
      formData.append('subject', postData.subject);
      formData.append('description', postData.description);
      
      if (file) {
        formData.append('file', file);
      }

      const response = await api.post('/api/announcements/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating announcement post:', error);
      throw error;
    }
  },

  async updateAnnouncementPost(postId, updateData, file = null) {
    try {
      const formData = new FormData();
      if (updateData.subject) formData.append('subject', updateData.subject);
      formData.append('description', updateData.description);
      
      if (file) {
        formData.append('file', file);
      }

      const response = await api.patch(`/api/announcements/posts/${postId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating announcement post:', error);
      throw error;
    }
  },

  async deleteAnnouncementPost(postId) {
    try {
      const response = await api.delete(`/api/announcements/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting announcement post:', error);
      throw error;
    }
  },

  // Attachment related functions
  async downloadAnnouncementAttachment(attachmentId) {
    try {
      const response = await api.get(`/api/announcements/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading announcement attachment:', error);
      throw error;
    }
  },

  async previewAnnouncementAttachment(attachmentId) {
    try {
      const response = await api.get(`/api/announcements/attachments/${attachmentId}/preview`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error previewing announcement attachment:', error);
      throw error;
    }
  },

  async deleteAnnouncementAttachment(attachmentId) {
    try {
      const response = await api.delete(`/api/announcements/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting announcement attachment:', error);
      throw error;
    }
  },

  // Zoom meetings related functions
  async getAnnouncementMeetings(filters = {}) {
    try {
      const response = await api.get('/api/announcements/meetings', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching announcement meetings:', error);
      throw error;
    }
  },

  async createAnnouncementMeeting(meetingData) {
    try {
      const response = await api.post('/api/announcements/meetings', meetingData);
      return response.data;
    } catch (error) {
      console.error('Error creating announcement meeting:', error);
      throw error;
    }
  },

  async updateAnnouncementMeeting(meetingId, updateData) {
    try {
      const response = await api.put(`/api/announcements/meetings/${meetingId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating announcement meeting:', error);
      throw error;
    }
  },

  async deleteAnnouncementMeeting(meetingId) {
    try {
      const response = await api.delete(`/api/announcements/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting announcement meeting:', error);
      throw error;
    }
  },

  async joinAnnouncementMeeting(meetingId) {
    try {
      const response = await api.post(`/api/announcements/meetings/${meetingId}/join`);
      return response.data;
    } catch (error) {
      console.error('Error joining announcement meeting:', error);
      throw error;
    }
  },

  async endAnnouncementMeeting(meetingId) {
    try {
      const response = await api.post(`/api/announcements/meetings/${meetingId}/end`);
      return response.data;
    } catch (error) {
      console.error('Error ending announcement meeting:', error);
      throw error;
    }
  },

  async cancelAnnouncementMeeting(meetingId) {
    try {
      const response = await api.post(`/api/announcements/meetings/${meetingId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error canceling announcement meeting:', error);
      throw error;
    }
  },
};

export default announcementsService;
