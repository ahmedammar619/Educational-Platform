import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Settings, Trash2, Archive, Filter, MoreHorizontal } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    loadNotifications,
    refreshNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // all, unread, archived
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Don't trigger additional loads - notifications are already loaded once
      console.log('Notification dropdown opened, notifications already loaded');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]); // Removed loadNotifications from dependencies

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'archived':
        return notification.isArchived;
      default:
        return !notification.isArchived;
    }
  });

  // Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    loadNotifications({ 
      limit: 20, 
      unreadOnly: newFilter === 'unread',
      archived: newFilter === 'archived'
    });
  };

  const getFilterCount = (filterType) => {
    switch (filterType) {
      case 'unread':
        return notifications.filter(n => !n.isRead && !n.isArchived).length;
      case 'archived':
        return notifications.filter(n => n.isArchived).length;
      default:
        return notifications.filter(n => !n.isArchived).length;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </h3>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Settings"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-1 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All ({getFilterCount('all')})</option>
                <option value="unread">Unread ({getFilterCount('unread')})</option>
                <option value="archived">Archived ({getFilterCount('archived')})</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Check className="h-3 w-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => loadNotifications()}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Retry
            </button>
          </div>
        ) : sortedNotifications.length === 0 ? (
          <div className="p-4 text-center">
            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {filter === 'unread' ? 'No unread notifications' :
               filter === 'archived' ? 'No archived notifications' :
               'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedNotifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onArchive={archiveNotification}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {sortedNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              // Navigate to full notifications page
              window.location.href = '/notifications';
            }}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
