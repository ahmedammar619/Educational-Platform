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
    
    // Connection management
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.reconnectTimer = null;
    this.connectionHealthCheckInterval = null;
    this.isReconnecting = false;
    
    // Fallback to HTTP polling
    this.fallbackMode = false;
    this.pollingInterval = null;
    this.pollingDelay = 10000; // 10 seconds
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket && this.isConnected && !this.isReconnecting) {
      return;
    }

    this.token = token || this.token;
    if (!this.token) {
      console.warn('No token available for socket connection');
      return;
    }

    // Clear any existing connection
    this.disconnect();

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    console.log('🔌 NotificationService: Connecting to backend at:', backendUrl);
    
    console.log('🔌 Connecting to Socket.IO with token:', this.token ? `${this.token.substring(0, 20)}...` : 'No token');
    
    this.socket = io(`${backendUrl}/notifications`, {
      auth: {
        token: this.token,
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true,
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5,
    });

    this.setupEventListeners();
    this.startConnectionHealthCheck();
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to notification socket');
      this.isConnected = true;
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      this.fallbackMode = false;
      
      // Stop fallback polling if it was running
      this.stopFallbackPolling();
      
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from notification socket:', reason);
      this.isConnected = false;
      this.emit('disconnect', { reason });
      
      // Start fallback polling if not already running
      if (!this.fallbackMode) {
        this.startFallbackPolling();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
      this.isReconnecting = true;
      
      // Start fallback polling
      this.startFallbackPolling();
      
      this.emit('error', { message: 'Connection failed', error });
      
      // Attempt reconnection with exponential backoff
      this.scheduleReconnection();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to notification socket after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      this.fallbackMode = false;
      this.stopFallbackPolling();
      this.emit('reconnect', { attemptNumber });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
      this.isReconnecting = true;
      this.emit('error', { message: 'Reconnection failed', error });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after maximum attempts');
      this.isReconnecting = false;
      this.fallbackMode = true;
      this.startFallbackPolling();
      this.emit('error', { message: 'Reconnection failed after maximum attempts' });
    });

    this.socket.on('new_notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      this.emit('new_notification', notification);
    });

    this.socket.on('unread_count', (data) => {
      console.log('📊 Unread count update:', data.count);
      this.emit('unread_count', data);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
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
    
    // Clear all timers and intervals
    this.clearReconnectionTimer();
    this.stopConnectionHealthCheck();
    this.stopFallbackPolling();
    
    this.isReconnecting = false;
    this.fallbackMode = false;
    this.reconnectAttempts = 0;
  }

  // Schedule reconnection with exponential backoff
  scheduleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Maximum reconnection attempts reached, switching to fallback mode');
      this.fallbackMode = true;
      this.startFallbackPolling();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected && !this.isReconnecting) {
        console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.isReconnecting = true;
        this.connect(this.token);
      }
    }, delay);
  }

  // Clear reconnection timer
  clearReconnectionTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Start connection health check
  startConnectionHealthCheck() {
    this.stopConnectionHealthCheck(); // Clear any existing interval
    
    this.connectionHealthCheckInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        // Ping the server to check connection health
        this.socket.emit('ping');
      } else if (!this.fallbackMode && !this.isReconnecting) {
        console.log('🔍 Connection health check failed, attempting reconnection');
        this.scheduleReconnection();
      }
    }, 30000); // Check every 30 seconds
  }

  // Stop connection health check
  stopConnectionHealthCheck() {
    if (this.connectionHealthCheckInterval) {
      clearInterval(this.connectionHealthCheckInterval);
      this.connectionHealthCheckInterval = null;
    }
  }

  // Start fallback HTTP polling
  startFallbackPolling() {
    if (this.fallbackMode && this.pollingInterval) {
      return; // Already polling
    }

    console.log('🔄 Starting fallback HTTP polling for notifications');
    this.fallbackMode = true;
    
    // Poll for notifications immediately
    this.pollForNotifications();
    
    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.pollForNotifications();
    }, this.pollingDelay);
  }

  // Stop fallback polling
  stopFallbackPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.fallbackMode = false;
  }

  // Poll for notifications via HTTP
  async pollForNotifications() {
    try {
      if (!this.token) {
        console.warn('No token available for polling');
        return;
      }

      // Get unread count
      const unreadCount = await this.getUnreadCount();
      this.emit('unread_count', { count: unreadCount });
      
      // Get recent notifications (last 5 minutes)
      const recentNotifications = await this.getNotifications({ 
        limit: 10, 
        offset: 0,
        unreadOnly: true 
      });
      
      // Emit new notifications if any
      if (recentNotifications.notifications && recentNotifications.notifications.length > 0) {
        recentNotifications.notifications.forEach(notification => {
          this.emit('new_notification', notification);
        });
      }
      
    } catch (error) {
      console.error('❌ Error polling for notifications:', error);
      this.emit('error', { message: 'Polling failed', error });
    }
  }

  // API methods with enhanced error handling
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
    // Include archived parameter only if explicitly set
    if (options.archived !== undefined) {
      params.append('archived', options.archived);
    }

    console.log(`Making API request to /api/notifications with params: ${params.toString()}`);

    try {
      const response = await api.get(`/api/notifications?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      
      // Handle different error types with retry logic
      if (this.shouldRetry(error, retryCount)) {
        const delay = this.calculateRetryDelay(retryCount);
        console.log(`🔄 Retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getNotifications(options, retryCount + 1);
      }
      
      // Emit error for context to handle
      this.emit('error', { 
        message: 'Failed to fetch notifications', 
        error: error.message,
        retryCount 
      });
      
      throw error;
    }
  }

  async getUnreadCount(retryCount = 0) {
    try {
      const response = await api.get('/api/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      
      if (this.shouldRetry(error, retryCount)) {
        const delay = this.calculateRetryDelay(retryCount);
        console.log(`🔄 Retrying unread count in ${delay}ms (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getUnreadCount(retryCount + 1);
      }
      
      this.emit('error', { 
        message: 'Failed to fetch unread count', 
        error: error.message,
        retryCount 
      });
      
      throw error;
    }
  }

  async getNotification(id) {
    const response = await api.get(`/api/notifications/${id}`);
    return response.data;
  }

  async markAsRead(id) {
    // Now we just delete directly instead of marking as read
    return this.deleteNotification(id);
  }

  async markAllAsRead(type = null) {
    const response = await api.post('/api/notifications/mark-all-read', { type });
    return response.data;
  }

  async deleteNotification(id, retryCount = 0) {
    try {
      const response = await api.delete(`/api/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      
      if (this.shouldRetry(error, retryCount)) {
        const delay = this.calculateRetryDelay(retryCount);
        console.log(`🔄 Retrying delete in ${delay}ms (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.deleteNotification(id, retryCount + 1);
      }
      
      this.emit('error', { 
        message: 'Failed to delete notification', 
        error: error.message,
        retryCount 
      });
      
      throw error;
    }
  }

  // Helper methods for retry logic
  shouldRetry(error, retryCount) {
    if (retryCount >= 3) return false;
    
    // Retry on network errors, timeouts, and rate limiting
    if (error.code === 'NETWORK_ERROR' || 
        error.code === 'ECONNABORTED' || 
        error.response?.status === 429 ||
        error.response?.status >= 500 ||
        !error.response) {
      return true;
    }
    
    // Don't retry on client errors (4xx except 429)
    if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
      return false;
    }
    
    return true;
  }

  calculateRetryDelay(retryCount) {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, retryCount), 10000);
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
    return {
      isConnected: this.isConnected,
      isReconnecting: this.isReconnecting,
      fallbackMode: this.fallbackMode,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // Get connection health status
  getConnectionHealth() {
    return {
      isConnected: this.isConnected,
      isReconnecting: this.isReconnecting,
      fallbackMode: this.fallbackMode,
      reconnectAttempts: this.reconnectAttempts,
      hasSocket: !!this.socket,
      hasPolling: !!this.pollingInterval,
      hasHealthCheck: !!this.connectionHealthCheckInterval
    };
  }

  // Force reconnection
  forceReconnect() {
    console.log('🔄 Force reconnecting notification service...');
    this.disconnect();
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    this.fallbackMode = false;
    
    if (this.token) {
      this.connect(this.token);
    }
  }

  // Update token and reconnect if needed
  updateToken(newToken) {
    console.log('🔄 Updating notification service token...');
    this.token = newToken;
    localStorage.setItem('token', newToken);
    
    if (this.socket || this.fallbackMode) {
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
