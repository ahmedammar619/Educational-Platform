import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

// Notification types
export const NotificationType = {
  ASSIGNMENT_PUBLISHED: 'assignment_published',
  ASSIGNMENT_GRADED: 'assignment_graded',
  ZOOM_SESSION_PUBLISHED: 'zoom_session_published',
  ZOOM_SESSION_STARTED: 'zoom_session_started',
  NEW_POST: 'new_post',
  ADDED_TO_CLASS: 'added_to_class',
  MARKED_ABSENT: 'marked_absent',
  CHILD_ABSENT: 'child_absent',
  CHILD_ADDED_TO_CLASS: 'child_added_to_class',
  ASSIGNMENT_SUBMITTED: 'assignment_submitted',
  ADDED_TO_COURSE: 'added_to_course',
  NEW_USER_JOINED: 'new_user_joined',
};

// Priority levels
export const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  isConnected: false,
  isRequestInProgress: false,
  lastFetchTime: null,
  cacheExpiry: 30000, // 30 seconds cache
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  MARK_ALL_READ: 'MARK_ALL_READ',
  SET_REQUEST_IN_PROGRESS: 'SET_REQUEST_IN_PROGRESS',
  SET_LAST_FETCH_TIME: 'SET_LAST_FETCH_TIME',
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false, isRequestInProgress: false };
    
    case ActionTypes.SET_REQUEST_IN_PROGRESS:
      return { ...state, isRequestInProgress: action.payload };
    
    case ActionTypes.SET_LAST_FETCH_TIME:
      return { ...state, lastFetchTime: action.payload };
    
    case ActionTypes.SET_NOTIFICATIONS:
      return { 
        ...state, 
        notifications: action.payload.notifications,
        unreadCount: action.payload.total,
        isLoading: false,
        error: null,
        isRequestInProgress: false,
        lastFetchTime: Date.now()
      };
    
    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    
    case ActionTypes.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, ...action.payload }
            : notification
        ),
        unreadCount: action.payload.isRead && !state.notifications.find(n => n.id === action.payload.id)?.isRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    
    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: state.notifications.find(n => n.id === action.payload && !n.isRead)
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    
    case ActionTypes.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };
    
    case ActionTypes.SET_CONNECTION_STATUS:
      return { ...state, isConnected: action.payload };
    
    case ActionTypes.MARK_ALL_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      };
    
    default:
      return state;
  }
};

// Context
const NotificationContext = createContext();

// Global loading state to prevent multiple requests across instances
let globalLoadingState = {
  isRequestInProgress: false,
  lastRequestTime: 0,
  requestPromise: null,
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Load notifications on mount - only once
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      notificationService.connect(token);
      setupSocketConnection();
      
      // Load notifications only once on mount
      loadNotifications({ limit: 20 }, true);
      
      return () => {
        notificationService.disconnect();
      };
    }
  }, []); // Empty dependency array ensures this only runs once

  const setupSocketConnection = () => {
    notificationService.on('connect', () => {
      dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: true });
    });

    notificationService.on('disconnect', () => {
      dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: false });
    });

    notificationService.on('new_notification', (notification) => {
      dispatch({ type: ActionTypes.ADD_NOTIFICATION, payload: notification });
    });

    notificationService.on('unread_count', (data) => {
      dispatch({ type: ActionTypes.SET_UNREAD_COUNT, payload: data.count });
    });

    notificationService.on('error', (error) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    });
  };

  const loadNotifications = async (options = {}, forceRefresh = false) => {
    const now = Date.now();
    
    // Check global loading state first
    if (globalLoadingState.isRequestInProgress) {
      console.log('Global request already in progress, waiting...');
      if (globalLoadingState.requestPromise) {
        try {
          await globalLoadingState.requestPromise;
          return;
        } catch (error) {
          console.log('Previous request failed, continuing with new request');
        }
      }
    }

    // Check if we already have notifications and this is not a force refresh
    if (!forceRefresh && state.notifications.length >= 0 && state.lastFetchTime) {
      const timeSinceLastFetch = now - state.lastFetchTime;
      if (timeSinceLastFetch < state.cacheExpiry) {
        console.log(`Using cached notifications (${Math.round(timeSinceLastFetch / 1000)}s ago)`);
        return;
      }
    }

    // Set global loading state
    globalLoadingState.isRequestInProgress = true;
    globalLoadingState.lastRequestTime = now;
    
    // Create a promise that other instances can wait for
    const requestPromise = (async () => {
      try {
        console.log('Loading notifications...');
        dispatch({ type: ActionTypes.SET_REQUEST_IN_PROGRESS, payload: true });
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        
        const response = await notificationService.getNotifications(options);
        
        // Always update the state with the response
        dispatch({ 
          type: ActionTypes.SET_NOTIFICATIONS, 
          payload: { 
            notifications: response.notifications || [], 
            total: response.total || 0 
          }
        });
        console.log(`Loaded ${response.notifications?.length || 0} notifications`);
        
      } catch (error) {
        console.error('Error loading notifications:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        // Clear global loading state
        globalLoadingState.isRequestInProgress = false;
        globalLoadingState.requestPromise = null;
      }
    })();

    globalLoadingState.requestPromise = requestPromise;
    
    try {
      await requestPromise;
    } catch (error) {
      // Error already handled in the promise
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      dispatch({ 
        type: ActionTypes.UPDATE_NOTIFICATION, 
        payload: { id: notificationId, isRead: true, readAt: new Date() }
      });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  const markAllAsRead = async (type = null) => {
    try {
      await notificationService.markAllAsRead(type);
      dispatch({ type: ActionTypes.MARK_ALL_READ });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: notificationId });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      await notificationService.archiveNotification(notificationId);
      dispatch({ 
        type: ActionTypes.UPDATE_NOTIFICATION, 
        payload: { id: notificationId, isArchived: true }
      });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  const refreshNotifications = () => {
    loadNotifications({ limit: 20 }, true); // Force refresh
  };

  const value = {
    ...state,
    loadNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
