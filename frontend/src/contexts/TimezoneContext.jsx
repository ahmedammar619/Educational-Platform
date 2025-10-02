import React, { createContext, useContext, useState, useEffect } from 'react';
import timezoneService from '../services/timezoneService';

const TimezoneContext = createContext();

/**
 * Timezone Context Provider
 * Provides timezone detection and utilities to all components
 */
export const TimezoneProvider = ({ children }) => {
  const [timezoneInfo, setTimezoneInfo] = useState({
    timezone: null,
    offset: null,
    displayName: null,
    isInitialized: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize timezone detection
  const initializeTimezone = async () => {
    try {
      setIsLoading(true);
      const info = await timezoneService.initialize();
      
      // Only update if we don't have a valid timezone or if the new one is better
      if (!timezoneInfo.timezone || timezoneInfo.timezone === 'UTC' || info.timezone !== 'UTC') {
        console.log('Updating timezone info:', info);
        setTimezoneInfo(info);
      } else {
        console.log('Keeping existing timezone info:', timezoneInfo);
      }
    } catch (error) {
      console.error('Failed to initialize timezone:', error);
      // Only set UTC fallback if we don't have a timezone
      if (!timezoneInfo.timezone) {
        setTimezoneInfo({
          timezone: 'UTC',
          offset: 0,
          displayName: 'UTC',
          isInitialized: true
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeTimezone();
  }, []);

  // Format meeting datetime for display
  const formatMeetingDateTime = (dateString, timeString, period = 'AM') => {
    return timezoneService.formatMeetingDateTime(dateString, timeString, period);
  };

  // Get relative time
  const getRelativeTime = (date) => {
    return timezoneService.getRelativeTime(date);
  };

  // Check if meeting is happening now
  const isMeetingNow = (dateString, timeString, period = 'AM') => {
    return timezoneService.isMeetingNow(dateString, timeString, period);
  };

  // Convert to local time
  const toLocalTime = (date, format = 'full') => {
    return timezoneService.toLocalTime(date, format);
  };

  // Convert UTC to local
  const utcToLocal = (utcDate) => {
    return timezoneService.utcToLocal(utcDate);
  };

  // Convert local to UTC
  const localToUtc = (localDate) => {
    return timezoneService.localToUtc(localDate);
  };

  // Get timezone info
  const getTimezoneInfo = () => {
    return timezoneService.getTimezoneInfo();
  };

  const value = {
    // State - ensure timezoneInfo is always defined
    timezoneInfo: timezoneInfo || {
      timezone: null,
      offset: null,
      displayName: null,
      isInitialized: false
    },
    isLoading,
    
    // Actions
    initializeTimezone,
    
    // Utilities
    formatMeetingDateTime,
    getRelativeTime,
    isMeetingNow,
    toLocalTime,
    utcToLocal,
    localToUtc,
    getTimezoneInfo,
    
    // Direct access to service properties
    getUserTimezone: () => timezoneService.getUserTimezone(),
    getTimezoneOffset: () => timezoneService.getTimezoneOffset(),
    getTimezoneDisplayName: () => timezoneService.getTimezoneDisplayName()
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};

/**
 * Hook to use timezone context
 */
export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};

export default TimezoneContext;
