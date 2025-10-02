import { useContext } from 'react';
import TimezoneContext from '../contexts/TimezoneContext';

/**
 * Custom hook for timezone detection and management
 * Uses the global timezone context
 */
export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) {
    // Return a fallback context if TimezoneProvider is not available
    console.warn('useTimezone hook used outside of TimezoneProvider, using fallback');
    return {
      timezoneInfo: {
        timezone: 'UTC',
        offset: 0,
        displayName: 'UTC',
        isInitialized: true
      },
      isLoading: false,
      formatMeetingDateTime: (date, time, period) => `${date} ${time} ${period}`,
      getRelativeTime: (date) => 'Unknown',
      isMeetingNow: () => false,
      toLocalTime: (date, format) => date?.toString() || 'Unknown',
      utcToLocal: (utcDate) => utcDate,
      localToUtc: (localDate) => localDate,
      getTimezoneInfo: () => ({
        timezone: 'UTC',
        offset: 0,
        displayName: 'UTC',
        isInitialized: true
      }),
      getUserTimezone: () => 'UTC',
      getTimezoneOffset: () => 0,
      getTimezoneDisplayName: () => 'UTC'
    };
  }
  return context;
};

export default useTimezone;
