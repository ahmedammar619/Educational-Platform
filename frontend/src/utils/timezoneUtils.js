/**
 * Timezone Utility Functions
 * Provides common timezone-related utility functions
 */

/**
 * Get all available timezones
 */
export const getAvailableTimezones = () => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch (error) {
    console.error('Error getting available timezones:', error);
    return ['UTC'];
  }
};

/**
 * Get timezone offset in hours and minutes
 */
export const getTimezoneOffset = (date = new Date()) => {
  const offsetMinutes = date.getTimezoneOffset();
  const offsetHours = Math.abs(offsetMinutes) / 60;
  const offsetSign = offsetMinutes <= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${(Math.abs(offsetMinutes) % 60).toString().padStart(2, '0')}`;
  
  return {
    minutes: offsetMinutes,
    hours: offsetHours,
    sign: offsetSign,
    string: offsetString
  };
};

/**
 * Format timezone name with offset
 */
export const formatTimezoneName = (timezone, date = new Date()) => {
  try {
    const offset = getTimezoneOffset(date);
    return `${timezone} (UTC${offset.string})`;
  } catch (error) {
    console.error('Error formatting timezone name:', error);
    return timezone;
  }
};

/**
 * Check if a timezone supports daylight saving time
 */
export const hasDaylightSavingTime = (timezone) => {
  try {
    const jan = new Date(2024, 0, 1); // January 1st
    const jul = new Date(2024, 6, 1); // July 1st
    
    const janOffset = new Date(jan.toLocaleString('en-US', { timeZone: timezone })).getTimezoneOffset();
    const julOffset = new Date(jul.toLocaleString('en-US', { timeZone: timezone })).getTimezoneOffset();
    
    return janOffset !== julOffset;
  } catch (error) {
    console.error('Error checking daylight saving time:', error);
    return false;
  }
};

/**
 * Get current time in a specific timezone
 */
export const getCurrentTimeInTimezone = (timezone, format = 'full') => {
  try {
    const now = new Date();
    
    const formatOptions = {
      full: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      },
      time: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      },
      date: {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    };

    return now.toLocaleString('en-US', {
      ...formatOptions[format],
      timeZone: timezone
    });
  } catch (error) {
    console.error('Error getting current time in timezone:', error);
    return new Date().toString();
  }
};

/**
 * Convert a date from one timezone to another
 */
export const convertTimezone = (date, fromTimezone, toTimezone) => {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: fromTimezone }));
    return new Date(utcDate.toLocaleString('en-US', { timeZone: toTimezone }));
  } catch (error) {
    console.error('Error converting timezone:', error);
    return date;
  }
};

/**
 * Get timezone abbreviation
 */
export const getTimezoneAbbreviation = (timezone, date = new Date()) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(date);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName');
    
    return timeZoneName ? timeZoneName.value : timezone;
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error);
    return timezone;
  }
};

/**
 * Check if two dates are in the same day (considering timezone)
 */
export const isSameDay = (date1, date2, timezone) => {
  try {
    const d1 = new Date(date1.toLocaleString('en-US', { timeZone: timezone }));
    const d2 = new Date(date2.toLocaleString('en-US', { timeZone: timezone }));
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  } catch (error) {
    console.error('Error checking if same day:', error);
    return false;
  }
};

/**
 * Get the start and end of day for a given date in a specific timezone
 */
export const getDayBounds = (date, timezone) => {
  try {
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const startOfDay = new Date(localDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(localDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    return {
      start: startOfDay,
      end: endOfDay
    };
  } catch (error) {
    console.error('Error getting day bounds:', error);
    return {
      start: date,
      end: date
    };
  }
};

/**
 * Format a duration in a human-readable format
 */
export const formatDuration = (startDate, endDate) => {
  const diffMs = endDate - startDate;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours % 24} hour${(diffHours % 24) > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes % 60} minute${(diffMinutes % 60) > 1 ? 's' : ''}`;
  } else {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  }
};

/**
 * Get timezone information for display
 */
export const getTimezoneInfo = (timezone = null) => {
  const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  try {
    const now = new Date();
    const offset = getTimezoneOffset(now);
    const abbreviation = getTimezoneAbbreviation(userTimezone, now);
    const hasDST = hasDaylightSavingTime(userTimezone);
    const currentTime = getCurrentTimeInTimezone(userTimezone, 'time');
    
    return {
      timezone: userTimezone,
      offset: offset,
      abbreviation: abbreviation,
      hasDST: hasDST,
      currentTime: currentTime,
      displayName: formatTimezoneName(userTimezone, now)
    };
  } catch (error) {
    console.error('Error getting timezone info:', error);
    return {
      timezone: userTimezone,
      offset: { minutes: 0, hours: 0, sign: '+', string: '+00:00' },
      abbreviation: userTimezone,
      hasDST: false,
      currentTime: new Date().toString(),
      displayName: userTimezone
    };
  }
};

export default {
  getAvailableTimezones,
  getTimezoneOffset,
  formatTimezoneName,
  hasDaylightSavingTime,
  getCurrentTimeInTimezone,
  convertTimezone,
  getTimezoneAbbreviation,
  isSameDay,
  getDayBounds,
  formatDuration,
  getTimezoneInfo
};
