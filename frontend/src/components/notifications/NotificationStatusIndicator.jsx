import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationStatusIndicator = ({ showDetails = false }) => {
  const { 
    isConnected, 
    error, 
    getConnectionStatus, 
    getConnectionHealth, 
    forceReconnect, 
    recoverFromError 
  } = useNotifications();
  
  const [status, setStatus] = useState({});
  const [health, setHealth] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const connectionStatus = getConnectionStatus();
      const connectionHealth = getConnectionHealth();
      setStatus(connectionStatus);
      setHealth(connectionHealth);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getConnectionStatus, getConnectionHealth]);

  const handleReconnect = async () => {
    setIsRefreshing(true);
    try {
      if (error) {
        recoverFromError();
      } else {
        forceReconnect();
      }
    } catch (err) {
      console.error('Failed to reconnect:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 2000);
    }
  };

  const getStatusIcon = () => {
    if (status.isReconnecting) {
      return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
    if (status.fallbackMode) {
      return <Wifi className="h-4 w-4 text-blue-500" />;
    }
    return <WifiOff className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (status.isReconnecting) {
      return 'Reconnecting...';
    }
    if (status.fallbackMode) {
      return 'Polling Mode';
    }
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (status.isReconnecting) return 'text-yellow-500';
    if (status.fallbackMode) return 'text-blue-500';
    return 'text-gray-400';
  };

  if (!showDetails) {
    // Only show when disconnected (not connected and not reconnecting)
    if (isConnected && !status.isReconnecting) {
      return null; // Don't show anything when connected
    }
    
    return (
      <div className="flex items-center space-x-1">
        {getStatusIcon()}
        {!isConnected && !status.isReconnecting && (
          <button
            onClick={handleReconnect}
            disabled={isRefreshing}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Reconnect notifications"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Notification Status</h3>
        <button
          onClick={handleReconnect}
          disabled={isRefreshing}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">WebSocket:</span>
          <span className={`text-sm ${health.hasSocket ? 'text-green-600' : 'text-red-600'}`}>
            {health.hasSocket ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Polling:</span>
          <span className={`text-sm ${health.hasPolling ? 'text-blue-600' : 'text-gray-400'}`}>
            {health.hasPolling ? 'Active' : 'Inactive'}
          </span>
        </div>

        {status.reconnectAttempts > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Reconnect Attempts:</span>
            <span className="text-sm text-yellow-600">
              {status.reconnectAttempts}/{status.maxReconnectAttempts}
            </span>
          </div>
        )}

        {status.fallbackMode && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <p className="text-xs text-blue-800">
              Using HTTP polling as fallback. Notifications may be delayed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationStatusIndicator;
