import React from 'react';
import { Bell, Check, Trash2, Archive, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { NotificationPriority } from '../../contexts/NotificationContext';

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onArchive,
  isCompact = false 
}) => {
  const { id, title, message, type, priority, isRead, createdAt, metadata } = notification;

  // Get priority styling
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          dot: 'bg-red-500'
        };
      case NotificationPriority.HIGH:
        return {
          bg: 'bg-orange-50 border-orange-200',
          icon: 'text-orange-600',
          dot: 'bg-orange-500'
        };
      case NotificationPriority.MEDIUM:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          dot: 'bg-blue-500'
        };
      case NotificationPriority.LOW:
        return {
          bg: 'bg-gray-50 border-gray-200',
          icon: 'text-gray-600',
          dot: 'bg-gray-500'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          dot: 'bg-blue-500'
        };
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'assignment_published':
      case 'assignment_graded':
      case 'assignment_submitted':
        return <CheckCircle className="h-4 w-4" />;
      case 'zoom_session_published':
      case 'zoom_session_started':
        return <AlertCircle className="h-4 w-4" />;
      case 'marked_absent':
      case 'child_absent':
        return <AlertTriangle className="h-4 w-4" />;
      case 'new_user_joined':
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const priorityStyles = getPriorityStyles(priority);
  const timeAgo = formatTime(createdAt);

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    onMarkAsRead(id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(id);
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    onArchive(id);
  };

  if (isCompact) {
    return (
      <div 
        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
          isRead ? 'opacity-60' : ''
        }`}
      >
        <div className={`flex-shrink-0 w-2 h-2 rounded-full ${priorityStyles.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          <p className="text-xs text-gray-500 truncate">{message}</p>
        </div>
        <div className="flex-shrink-0 text-xs text-gray-400">{timeAgo}</div>
      </div>
    );
  }

  return (
    <div 
      className={`relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
        isRead ? 'opacity-60 bg-gray-50' : `${priorityStyles.bg} shadow-sm`
      }`}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${priorityStyles.dot}`} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`${priorityStyles.icon}`}>
            {getTypeIcon(type)}
          </div>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        </div>
        <span className="text-xs text-gray-500">{timeAgo}</span>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-700 mb-3 leading-relaxed">{message}</p>

      {/* Metadata */}
      {metadata && (
        <div className="mb-3 p-2 bg-gray-100 rounded text-xs text-gray-600">
          {metadata.assignmentTitle && (
            <div>Assignment: {metadata.assignmentTitle}</div>
          )}
          {metadata.courseName && (
            <div>Course: {metadata.courseName}</div>
          )}
          {metadata.grade && (
            <div>Grade: {metadata.grade}</div>
          )}
          {metadata.sessionTitle && (
            <div>Session: {metadata.sessionTitle}</div>
          )}
          {metadata.studentName && (
            <div>Student: {metadata.studentName}</div>
          )}
          {metadata.childName && (
            <div>Child: {metadata.childName}</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {!isRead && (
            <button
              onClick={handleMarkAsRead}
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Check className="h-3 w-3" />
              <span>Mark as read</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleArchive}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Archive"
          >
            <Archive className="h-3 w-3" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
