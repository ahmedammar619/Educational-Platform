/**
 * Timezone conversion utilities for session times
 */

/**
 * Convert a time string from one timezone to another
 * @param {string} timeString - Time in HH:MM format (e.g., "08:00")
 * @param {string} fromTimezone - Source timezone (e.g., "America/Chicago")
 * @param {string} toTimezone - Target timezone (e.g., "Africa/Cairo")
 * @param {string} day - Day of the week (e.g., "Monday")
 * @returns {string} - Converted time in HH:MM format
 */
export const convertSessionTime = (timeString, fromTimezone, toTimezone, day = 'Monday') => {
  if (!timeString || !fromTimezone || !toTimezone) {
    return timeString;
  }

  try {
    // Parse the time string
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a date object for the next occurrence of the specified day
    const now = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = dayOfWeek.indexOf(day);
    const currentDayIndex = now.getDay();
    
    // Calculate days until target day
    let daysUntilTarget = targetDayIndex - currentDayIndex;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Next week
    }
    
    // Create the target date
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysUntilTarget);
    targetDate.setHours(hours, minutes, 0, 0);
    
    // Convert from source timezone to UTC
    const utcDate = new Date(targetDate.toLocaleString('en-US', { timeZone: fromTimezone }));
    const utcOffset = targetDate.getTime() - utcDate.getTime();
    const utcTime = new Date(targetDate.getTime() - utcOffset);
    
    // Convert from UTC to target timezone
    const targetTime = new Date(utcTime.toLocaleString('en-US', { timeZone: toTimezone }));
    const targetOffset = targetTime.getTime() - utcTime.getTime();
    const finalTime = new Date(utcTime.getTime() + targetOffset);
    
    // Format the result
    const convertedHours = finalTime.getHours().toString().padStart(2, '0');
    const convertedMinutes = finalTime.getMinutes().toString().padStart(2, '0');
    
    return `${convertedHours}:${convertedMinutes}`;
  } catch (error) {
    console.error('Error converting session time:', error);
    return timeString;
  }
};

/**
 * Convert session times for display in user's timezone
 * @param {Object} session - Session object with day, startTime, endTime
 * @param {string} creatorTimezone - Timezone where session was created
 * @param {string} viewerTimezone - Timezone of the viewer
 * @returns {Object} - Session object with converted times
 */
export const convertSessionForTimezone = (session, creatorTimezone, viewerTimezone) => {
  if (!session || !creatorTimezone || !viewerTimezone || creatorTimezone === viewerTimezone) {
    return session;
  }

  try {
    const convertedStartTime = convertSessionTime(
      session.startTime, 
      creatorTimezone, 
      viewerTimezone, 
      session.day
    );
    
    const convertedEndTime = convertSessionTime(
      session.endTime, 
      creatorTimezone, 
      viewerTimezone, 
      session.day
    );

    return {
      ...session,
      startTime: convertedStartTime,
      endTime: convertedEndTime,
      originalStartTime: session.startTime,
      originalEndTime: session.endTime,
      isConverted: true
    };
  } catch (error) {
    console.error('Error converting session for timezone:', error);
    return session;
  }
};

/**
 * Get timezone offset in hours
 * @param {string} timezone - Timezone identifier
 * @returns {number} - Offset in hours from UTC
 */
export const getTimezoneOffset = (timezone) => {
  try {
    const now = new Date();
    const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMs = localTime.getTime() - utcTime.getTime();
    return offsetMs / (1000 * 60 * 60); // Convert to hours
  } catch (error) {
    console.error('Error getting timezone offset:', error);
    return 0;
  }
};

/**
 * Format timezone display name with offset
 * @param {string} timezone - Timezone identifier
 * @returns {string} - Formatted timezone name with offset
 */
export const formatTimezoneDisplay = (timezone) => {
  try {
    const offset = getTimezoneOffset(timezone);
    const offsetString = offset >= 0 ? `+${offset.toString().padStart(2, '0')}:00` : `${offset.toString().padStart(3, '0')}:00`;
    return `${timezone} (UTC${offsetString})`;
  } catch (error) {
    console.error('Error formatting timezone display:', error);
    return timezone;
  }
};

/**
 * Simple time conversion using offset difference
 * This is a more reliable method for session time conversion
 * @param {string} timeString - Time in HH:MM format
 * @param {string} fromTimezone - Source timezone
 * @param {string} toTimezone - Target timezone
 * @returns {string} - Converted time in HH:MM format
 */
export const convertTimeByOffset = (timeString, fromTimezone, toTimezone) => {
  if (!timeString || !fromTimezone || !toTimezone || fromTimezone === toTimezone) {
    return timeString;
  }

  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Get timezone offsets
    const fromOffset = getTimezoneOffset(fromTimezone);
    const toOffset = getTimezoneOffset(toTimezone);
    
    // Calculate the difference
    const offsetDiff = toOffset - fromOffset;
    
    // Convert to minutes for easier calculation
    const totalMinutes = hours * 60 + minutes;
    const convertedMinutes = totalMinutes + (offsetDiff * 60);
    
    // Handle day boundaries
    let finalMinutes = convertedMinutes;
    if (finalMinutes < 0) {
      finalMinutes += 24 * 60; // Add a day
    } else if (finalMinutes >= 24 * 60) {
      finalMinutes -= 24 * 60; // Subtract a day
    }
    
    // Convert back to hours and minutes
    const finalHours = Math.floor(finalMinutes / 60);
    const finalMins = finalMinutes % 60;
    
    return `${finalHours.toString().padStart(2, '0')}:${finalMins.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error converting time by offset:', error);
    return timeString;
  }
};

/**
 * Convert a full datetime string between timezones
 * @param {string} dateTimeString - ISO datetime string
 * @param {string} fromTimezone - Source timezone
 * @param {string} toTimezone - Target timezone
 * @returns {string} - Converted datetime string
 */
export const convertDateTime = (dateTimeString, fromTimezone, toTimezone) => {
  if (!dateTimeString || !fromTimezone || !toTimezone || fromTimezone === toTimezone) {
    return dateTimeString;
  }

  try {
    const date = new Date(dateTimeString);
    const fromOffset = getTimezoneOffset(fromTimezone);
    const toOffset = getTimezoneOffset(toTimezone);
    const offsetDiff = toOffset - fromOffset;
    
    // Convert by adding the offset difference in milliseconds
    const convertedDate = new Date(date.getTime() + (offsetDiff * 60 * 60 * 1000));
    
    return convertedDate.toISOString();
  } catch (error) {
    console.error('Error converting datetime:', error);
    return dateTimeString;
  }
};

/**
 * Convert a date and time separately (for assignments and meetings)
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @param {string} timeString - Time string (HH:MM)
 * @param {string} fromTimezone - Source timezone
 * @param {string} toTimezone - Target timezone
 * @returns {Object} - Object with converted date and time
 */
export const convertDateAndTime = (dateString, timeString, fromTimezone, toTimezone) => {
  if (!dateString || !timeString || !fromTimezone || !toTimezone || fromTimezone === toTimezone) {
    return { date: dateString, time: timeString };
  }

  try {
    console.log('🕐 Converting date/time:', { dateString, timeString, fromTimezone, toTimezone });
    
    // Create a datetime string and parse it as if it's in the creator's timezone
    const dateTimeString = `${dateString}T${timeString}:00`;
    
    // Parse the date components
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a date object representing the time in the creator's timezone
    const creatorDateTime = new Date();
    creatorDateTime.setFullYear(year, month - 1, day);
    creatorDateTime.setHours(hours, minutes, 0, 0);
    
    // Convert to UTC by getting the offset difference
    const creatorOffset = getTimezoneOffset(fromTimezone);
    const utcDateTime = new Date(creatorDateTime.getTime() - (creatorOffset * 60 * 60 * 1000));
    
    console.log('🕐 UTC equivalent:', utcDateTime.toISOString());
    
    // Convert from UTC to the viewer's timezone
    const viewerOffset = getTimezoneOffset(toTimezone);
    const viewerDateTime = new Date(utcDateTime.getTime() + (viewerOffset * 60 * 60 * 1000));
    
    const convertedDateString = viewerDateTime.toISOString().split('T')[0];
    const convertedTimeString = viewerDateTime.toTimeString().slice(0, 5);
    
    console.log('🕐 Conversion result:', { 
      original: `${dateString} ${timeString} (${fromTimezone})`,
      converted: `${convertedDateString} ${convertedTimeString} (${toTimezone})`
    });
    
    return {
      date: convertedDateString,
      time: convertedTimeString
    };
  } catch (error) {
    console.error('Error converting date and time:', error);
    return { date: dateString, time: timeString };
  }
};

/**
 * Format a datetime for display with timezone conversion
 * @param {string} dateTimeString - ISO datetime string
 * @param {string} creatorTimezone - Timezone where the content was created
 * @param {string} format - Format type ('full', 'date', 'time', 'dateTime')
 * @returns {string} - Formatted datetime string
 */
export const formatDateTimeForTimezone = (dateTimeString, creatorTimezone, format = 'dateTime') => {
  if (!dateTimeString) return '';
  
  const viewerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  try {
    const date = new Date(dateTimeString);
    
    // For original time, always use creator's timezone
    if (format === 'original') {
      return date.toLocaleString('en-US', {
        timeZone: creatorTimezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      });
    }
    
    // For converted time or if no conversion needed
    return date.toLocaleString('en-US', {
      timeZone: viewerTimezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting datetime for timezone:', error);
    return new Date(dateTimeString).toLocaleString();
  }
};

/**
 * Helper function to format date by type
 * @param {Date} date - Date object
 * @param {string} format - Format type
 * @returns {string} - Formatted date string
 */
const formatDateByType = (date, format) => {
  switch (format) {
    case 'full':
      return date.toLocaleString();
    case 'date':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString();
    case 'dateTime':
      return date.toLocaleString();
    default:
      return date.toLocaleString();
  }
};