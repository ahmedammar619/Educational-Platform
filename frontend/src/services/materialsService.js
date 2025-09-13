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

      console.log('📤 Uploading file with FormData:', {
        courseId,
        fileName: file.name,
        fileSize: file.size,
        folderId,
        formDataKeys: Array.from(formData.keys())
      });

      const response = await api.post(`/api/materials/courses/${courseId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('📥 Upload response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Upload error:', error);
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async getCourseFiles(courseId, folderId = null) {
    try {
      // Always send folderId parameter - null for root, specific ID for subfolders
      const params = { folderId };
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

  async updateFolder(folderId, updateData) {
    try {
      const response = await api.patch(`/api/materials/folders/${folderId}`, updateData);
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
      // Transform frontend data to match backend DTO
      const backendData = {
        name: assignmentData.title, // Frontend uses 'title', backend expects 'name'
        description: assignmentData.description,
        dueDate: assignmentData.dueDate,
        dueTime: assignmentData.dueTime,
        marks: assignmentData.maxPoints // Frontend uses 'maxPoints', backend expects 'marks'
      };
      
      const response = await api.post(`/api/materials/courses/${courseId}/assignments`, backendData);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }
  
  async updateAssignment(assignmentId, assignmentData) {
    try {
      // Transform frontend data to match backend DTO
      const backendData = {
        name: assignmentData.title, // Frontend uses 'title', backend expects 'name'
        description: assignmentData.description,
        dueDate: assignmentData.dueDate,
        dueTime: assignmentData.dueTime,
        marks: assignmentData.maxPoints // Frontend uses 'maxPoints', backend expects 'marks'
      };
      
      const response = await api.patch(`/api/materials/courses/assignments/${assignmentId}`, backendData);
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async deleteAssignment(assignmentId) {
    try {
      const response = await api.delete(`/api/materials/courses/assignments/${assignmentId}`);
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

  async downloadSubmission(submissionId) {
    try {
      const response = await api.get(`/api/materials/submissions/${submissionId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Attendance
  async markAttendance(courseId, attendanceData) {
    try {
      const url = `/api/materials/courses/${courseId}/attendance/bulk`;
      console.log('Calling attendance endpoint:', url);
      console.log('With data:', attendanceData);
      const response = await api.post(url, attendanceData);
      return response.data;
    } catch (error) {
      console.error('Attendance API error:', error);
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async getCourseAttendance(courseId, date = null) {
    try {
      const params = date ? { date } : {};
      const response = await api.get(`/api/materials/courses/${courseId}/attendance/bulk`, { params });
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

  // File operations
  async downloadFile(fileId) {
    try {
      const response = await api.get(`/api/materials/files/${fileId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  async previewFile(fileId) {
    try {
      const response = await api.get(`/api/materials/files/${fileId}/download?view=true`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get students enrolled in a course
  async getCourseStudents(courseId) {
    try {
      // Get attendance data to extract unique students
      const attendanceData = await this.getCourseAttendance(courseId);
      
      // Extract all unique students from attendance records
      const allStudents = new Map();
      
      attendanceData.forEach(record => {
        if (record.students) {
          record.students.forEach(student => {
            if (!allStudents.has(student.id)) {
              allStudents.set(student.id, {
                id: student.id,
                firstName: student.name.split(' ')[0] || '',
                lastName: student.name.split(' ').slice(1).join(' ') || ''
              });
            }
          });
        }
      });
      
      return Array.from(allStudents.values());
    } catch (error) {
      console.error('Error getting course students:', error);
      return [];
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
