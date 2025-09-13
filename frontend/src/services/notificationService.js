import { io } from 'socket.io-client';
import api from './api';

class NotificationService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.token = localStorage.getItem('token');
    this.lastRequestTime = 0;
    this.requestThrottle = 1000; // Minimum 1 second between requests
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket && this.isConnected) {
      return;
    }

    this.token = token || this.token;
    if (!this.token) {
      console.warn('No token available for socket connection');
      return;
    }

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    console.log('🔌 Connecting to Socket.IO with token:', this.token ? `${this.token.substring(0, 20)}...` : 'No token');
    
    this.socket = io(`${backendUrl}/notifications`, {
      auth: {
        token: this.token,
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to notification socket');
      this.isConnected = true;
      this.emit('connect');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification socket');
      this.isConnected = false;
      this.emit('disconnect');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('error', { message: 'Connection failed' });
    });

    this.socket.on('new_notification', (notification) => {
      console.log('New notification received:', notification);
      this.emit('new_notification', notification);
    });

    this.socket.on('unread_count', (data) => {
      console.log('Unread count update:', data.count);
      this.emit('unread_count', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  // Event emitter functionality
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // API methods
  async getNotifications(options = {}, retryCount = 0) {
    // Throttle requests to prevent excessive API calls
    const now = Date.now();
    if (now - this.lastRequestTime < this.requestThrottle) {
      const waitTime = this.requestThrottle - (now - this.lastRequestTime);
      console.log(`Throttling request, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();

    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.unreadOnly) params.append('unreadOnly', options.unreadOnly);
    if (options.type) params.append('type', options.type);
    // Always include archived parameter to ensure consistency with backend default
    params.append('archived', options.archived === true);

    console.log(`Making API request to /api/notifications with params: ${params.toString()}`);

    try {
      const response = await api.get(`/api/notifications?${params.toString()}`);
      return response.data;
    } catch (error) {
      // Handle rate limiting with exponential backoff
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getNotifications(options, retryCount + 1);
      }
      throw error;
    }
  }

  async getUnreadCount(retryCount = 0) {
    try {
      const response = await api.get('/api/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      // Handle rate limiting with exponential backoff
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getUnreadCount(retryCount + 1);
      }
      throw error;
    }
  }

  async getNotification(id) {
    const response = await api.get(`/api/notifications/${id}`);
    return response.data;
  }

  async markAsRead(id) {
    const response = await api.patch(`/api/notifications/${id}`, { isRead: true });
    
    // Emit socket event to update real-time
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_notification_read', { notificationId: id });
    }
    
    return response.data;
  }

  async markAllAsRead(type = null) {
    const response = await api.post('/api/notifications/mark-all-read', { type });
    return response.data;
  }

  async deleteNotification(id) {
    const response = await api.delete(`/api/notifications/${id}`);
    return response.data;
  }

  async archiveNotification(id) {
    const response = await api.post(`/api/notifications/${id}/archive`);
    return response.data;
  }

  // Socket methods
  joinRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', room);
    }
  }

  leaveRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', room);
    }
  }

  // Utility methods
  getConnectionStatus() {
    return this.isConnected;
  }

  // Update token and reconnect if needed
  updateToken(newToken) {
    this.token = newToken;
    if (this.socket) {
      this.disconnect();
      this.connect(newToken);
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Auto-connect when token is available
const token = localStorage.getItem('token');
if (token) {
  notificationService.connect(token);
}

export default notificationService;
