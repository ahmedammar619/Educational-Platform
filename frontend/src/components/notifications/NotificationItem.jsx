import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, Bell, Check, Trash2 } from 'lucide-react';

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onArchive,
  isCompact = false 
}) => {
  const { id, title, message, type, isRead, createdAt } = notification;

  // Get icon and color based on type
  const getNotificationStyle = (type) => {
    switch (type) {
      // Green - Good things
      case 'assignment_graded':
      case 'assignment_submitted':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bgColor: 'bg-green-500',
          textColor: 'text-green-600'
        };
      
      // Blue - Normal things
      case 'assignment_published':
      case 'zoom_session_published':
      case 'zoom_session_started':
      case 'new_user_joined':
      case 'new_post':
      case 'added_to_class':
      case 'child_added_to_class':
      case 'added_to_course':
        return {
          icon: <Info className="h-5 w-5" />,
          bgColor: 'bg-blue-500',
          textColor: 'text-blue-600'
        };
      
      // Orange - Urgent things
      case 'marked_absent':
      case 'child_absent':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          bgColor: 'bg-orange-500',
          textColor: 'text-orange-600'
        };
      
      // Red - Warnings
      default:
        return {
          icon: <Bell className="h-5 w-5" />,
          bgColor: 'bg-red-500',
          textColor: 'text-red-600'
        };
    }
  };

  // Format time - simplified
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const notificationStyle = getNotificationStyle(type);
  const timeAgo = formatTime(createdAt);

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    onMarkAsRead(id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div 
      className={`flex items-start space-x-3 p-4 transition-colors hover:bg-gray-50 ${
        isRead ? 'opacity-60' : ''
      }`}
    >
      {/*Notification Style Icon */}
      <div className="relative flex-shrink-0">
        <div className={`w-10 h-10 rounded-full ${notificationStyle.bgColor} flex items-center justify-center text-white`}>
          {notificationStyle.icon}
        </div>
        
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-start font-medium text-gray-900 leading-tight">{title}</p>
            <p className="text-sm text-start text-gray-600 mt-1 leading-relaxed">{message}</p>
          </div>
          
          {/* Time and actions */}
          <div className="flex items-center space-x-2 ml-3">
            {/* Actions */}
            <div className="flex items-center space-x-1">
              {!isRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="p-1 text-blue-600 fw-bold rounded-full bg-blue-100 hover:text-blue-800 hover:bg-blue-200 transition-colors"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
