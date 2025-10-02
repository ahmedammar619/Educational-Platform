/**
 * Timezone Detection and Management Service
 * Uses date-fns-tz for robust timezone handling
 */

import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

class TimezoneService {
  constructor() {
    this.userTimezone = null;
    this.isInitialized = false;
  }

  /**
   * Initialize timezone detection
   * This should be called once when the app starts
   */
  async initialize() {
    if (this.isInitialized && this.userTimezone && this.userTimezone !== 'UTC') {
      console.log('Timezone already initialized:', this.userTimezone);
      return this.getTimezoneInfo();
    }

    try {
      // Get browser timezone using Intl API
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Only update if we haven't detected a valid timezone yet or if we're getting a better detection
      if (!this.userTimezone || this.userTimezone === 'UTC' || detectedTimezone !== 'UTC') {
        this.userTimezone = detectedTimezone;
        console.log('Timezone detected and set:', this.userTimezone);
      } else {
        console.log('Keeping existing timezone:', this.userTimezone);
      }
      
      this.isInitialized = true;
      
      console.log('Final timezone info:', this.getTimezoneInfo());
      return this.getTimezoneInfo();
    } catch (error) {
      console.error('Failed to detect timezone:', error);
      // Only fallback to UTC if we don't have a timezone set
      if (!this.userTimezone) {
        this.userTimezone = 'UTC';
      }
      this.isInitialized = true;
      
      return this.getTimezoneInfo();
    }
  }

  /**
   * Get the user's timezone
   */
  getUserTimezone() {
    return this.userTimezone || 'UTC';
  }

  /**
   * Get timezone offset in minutes
   */
  getTimezoneOffset() {
    if (!this.userTimezone) return 0;
    
    try {
      const now = new Date();
      // Get the offset directly from the browser's timezone
      const offsetMinutes = now.getTimezoneOffset();
      return -offsetMinutes; // Convert to positive for UTC+ and negative for UTC-
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get timezone display name with offset
   */
  getTimezoneDisplayName() {
    if (!this.userTimezone) return 'UTC';
    
    try {
      const now = new Date();
      const offsetMinutes = this.getTimezoneOffset();
      const offsetHours = Math.abs(offsetMinutes) / 60;
      const offsetSign = offsetMinutes <= 0 ? '+' : '-';
      const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:00`;
      
      return `${this.userTimezone} (UTC${offsetString})`;
    } catch (error) {
      return this.userTimezone;
    }
  }

  /**
   * Convert a date to user's local timezone
   */
  toLocalTime(date, formatType = 'full') {
    if (!date) return null;
    
    try {
      const dateObj = new Date(date);
      const timezone = this.getUserTimezone();
      
      const formatPatterns = {
        full: 'PPP p zzz',
        date: 'PPP',
        time: 'p',
        dateTime: 'PPp'
      };

      const pattern = formatPatterns[formatType] || formatPatterns.full;
      return format(toZonedTime(dateObj, timezone), pattern);
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date(date).toString();
    }
  }

  /**
   * Convert a date string to user's local timezone and return formatted string
   */
  formatMeetingDateTime(dateString, timeString, period = 'AM') {
    if (!dateString || !timeString) return null;

    try {
      // Parse time with AM/PM period
      const [hours, minutes] = timeString.split(':').map(Number);
      let hour24 = hours;
      
      if (period === 'PM' && hours !== 12) {
        hour24 = hours + 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }
      
      // Create meeting datetime in UTC first, then convert to user's timezone
      const meetingDateTime = new Date(`${dateString}T${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
      
      return this.toLocalTime(meetingDateTime, 'dateTime');
    } catch (error) {
      console.error('Error formatting meeting datetime:', error);
      return `${dateString} ${timeString} ${period}`;
    }
  }

  /**
   * Get relative time (e.g., "in 2 hours", "2 hours ago")
   */
  getRelativeTime(date) {
    if (!date) return null;
    
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = targetDate - now;
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (Math.abs(diffMinutes) < 60) {
      return diffMinutes === 0 ? 'now' : 
             diffMinutes > 0 ? `in ${diffMinutes} minutes` : 
             `${Math.abs(diffMinutes)} minutes ago`;
    } else if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `in ${diffHours} hours` : 
             `${Math.abs(diffHours)} hours ago`;
    } else {
      return diffDays > 0 ? `in ${diffDays} days` : 
             `${Math.abs(diffDays)} days ago`;
    }
  }

  /**
   * Check if a meeting is happening now (within 15 minutes of start time)
   */
  isMeetingNow(dateString, timeString, period = 'AM') {
    if (!dateString || !timeString) return false;
    
    try {
      // Parse time with AM/PM period
      const [hours, minutes] = timeString.split(':').map(Number);
      let hour24 = hours;
      
      if (period === 'PM' && hours !== 12) {
        hour24 = hours + 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }
      
      // Create meeting datetime
      const meetingDateTime = new Date(dateString);
      meetingDateTime.setHours(hour24, minutes, 0, 0);
      
      const now = new Date();
      const timeDiff = Math.abs(now - meetingDateTime);
      const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
      
      return timeDiff <= fifteenMinutes && now >= meetingDateTime;
    } catch (error) {
      console.error('Error checking if meeting is now:', error);
      return false;
    }
  }

  /**
   * Get timezone info for display
   */
  getTimezoneInfo() {
    return {
      timezone: this.userTimezone || 'UTC',
      offset: this.getTimezoneOffset(),
      displayName: this.getTimezoneDisplayName(),
      isInitialized: this.isInitialized
    };
  }

  /**
   * Convert UTC time to user's local time
   */
  utcToLocal(utcDate) {
    if (!utcDate) return null;
    
    try {
      const date = new Date(utcDate);
      const timezone = this.getUserTimezone();
      return format(toZonedTime(date, timezone), 'PPP p zzz');
    } catch (error) {
      console.error('Error converting UTC to local:', error);
      return new Date(utcDate).toString();
    }
  }

  /**
   * Convert local time to UTC
   */
  localToUtc(localDate) {
    if (!localDate) return null;
    
    try {
      const date = new Date(localDate);
      const timezone = this.getUserTimezone();
      return fromZonedTime(date, timezone).toISOString();
    } catch (error) {
      console.error('Error converting local to UTC:', error);
      return new Date(localDate).toISOString();
    }
  }
}

// Create singleton instance
const timezoneService = new TimezoneService();

export default timezoneService;
