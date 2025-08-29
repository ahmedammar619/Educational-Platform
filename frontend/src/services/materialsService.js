import api from './api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

class MaterialsService {
  // Posts
  async createPost(courseId, postData, file = null) {
    try {
      const formData = new FormData();
      
      // Add post data
      formData.append('subject', postData.subject);
      formData.append('description', postData.description);
      
      // Add file if provided
      if (file) {
        formData.append('file', file);
      }
      
      const response = await api.post(`/api/materials/courses/${courseId}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async getCoursePosts(courseId) {
    try {
      const response = await api.get(`/api/materials/courses/${courseId}/posts`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async updatePost(postId, postData, file = null) {
    try {
      const formData = new FormData();
      
      // Add post data
      formData.append('subject', postData.subject || '');
      formData.append('description', postData.description);
      
      // Add file if provided
      if (file) {
        formData.append('file', file);
      }
      
      const response = await api.patch(`/api/materials/posts/${postId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async deletePost(postId) {
    try {
      const response = await api.delete(`/api/materials/posts/${postId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Files and Folders
  async createFolder(courseId, folderData) {
    try {
      const response = await api.post(`/api/materials/courses/${courseId}/folders`, folderData);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async uploadFile(courseId, file, folderId = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) {
        formData.append('folderId', folderId);
      }

      const response = await api.post(`/api/materials/courses/${courseId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async getCourseFiles(courseId, folderId = null) {
    try {
      const params = folderId ? { folderId } : {};
      const response = await api.get(`/api/materials/courses/${courseId}/files`, { params });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      const response = await api.delete(`/api/materials/files/${fileId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async deleteFolder(folderId) {
    try {
      const response = await api.delete(`/api/materials/folders/${folderId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Assignments
  async createAssignment(courseId, assignmentData) {
    try {
      const response = await api.post(`/api/materials/courses/${courseId}/assignments`, assignmentData);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async getCourseAssignments(courseId) {
    try {
      const response = await api.get(`/api/materials/courses/${courseId}/assignments`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async submitAssignment(assignmentId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/api/materials/assignments/${assignmentId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async gradeAssignment(submissionId, gradeData) {
    try {
      const response = await api.patch(`/api/materials/submissions/${submissionId}/grade`, gradeData);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Attendance
  async markAttendance(courseId, attendanceData) {
    try {
      const response = await api.post(`/api/materials/courses/${courseId}/attendance`, attendanceData);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async getCourseAttendance(courseId, date = null) {
    try {
      const params = date ? { date } : {};
      const response = await api.get(`/api/materials/courses/${courseId}/attendance`, { params });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async getStudentAttendance(courseId, studentId) {
    try {
      const response = await api.get(`/api/materials/courses/${courseId}/students/${studentId}/attendance`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Attachments
  async downloadAttachment(attachmentId) {
    try {
      const response = await api.get(`/api/materials/attachments/${attachmentId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async previewAttachment(attachmentId) {
    try {
      const response = await api.get(`/api/materials/attachments/${attachmentId}/preview`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async deleteAttachment(attachmentId) {
    try {
      const response = await api.delete(`/api/materials/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // General course materials
  async getCourseMaterials(courseId) {
    try {
      const [posts, files, assignments] = await Promise.all([
        this.getCoursePosts(courseId),
        this.getCourseFiles(courseId),
        this.getCourseAssignments(courseId)
      ]);

      return {
        posts,
        files,
        assignments
      };
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }
}

export default new MaterialsService();
