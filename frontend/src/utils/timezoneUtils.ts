/**
 * Timezone utilities for handling post timestamps
 */

/**
 * Convert a UTC date string to the creator's timezone
 */
export function convertToCreatorTimezone(utcDateString: string, creatorTimezone: string): Date {
  const date = new Date(utcDateString); 
  const creatorDate = new Date(date.toLocaleString('en-US', { timeZone: creatorTimezone }));
  return creatorDate;
}

/**
 * Convert a UTC date string to the viewer's (local) timezone 
 */
export function convertToViewerTimezone(utcDateString: string): Date {
  const date = new Date(utcDateString);
  return date; // Browser will automatically convert to local timezone
}

/**
 * Format a date for display
 */
export function formatPostDate(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZoneName: 'short'
  });
}