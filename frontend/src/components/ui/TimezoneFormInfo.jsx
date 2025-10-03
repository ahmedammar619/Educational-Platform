import React from 'react';
import { convertTimeByOffset, formatTimezoneDisplay } from '../../utils/timezoneUtils';

const TimezoneFormInfo = ({ 
  action = 'Creating', 
  item = 'item', 
  sessionTimes = null, 
  creatorTimezone = null 
}) => {
  const getTimezoneInfo = () => {
    if (typeof window === 'undefined') return null;
    
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const utcOffset = -now.getTimezoneOffset() / 60; // Convert minutes to hours
    const offsetString = utcOffset >= 0 ? `+${utcOffset.toString().padStart(2, '0')}:00` : `${utcOffset.toString().padStart(3, '0')}:00`;
    
    return { timeZone, offsetString };
  };

  const timezoneInfo = getTimezoneInfo();
  const viewerTimezone = timezoneInfo?.timeZone;

  // Convert session times if provided
  const getConvertedTimes = () => {
    if (!sessionTimes || !creatorTimezone || !viewerTimezone || creatorTimezone === viewerTimezone) {
      return null;
    }

    try {
      return sessionTimes.map(session => ({
        ...session,
        convertedStartTime: convertTimeByOffset(session.startTime, creatorTimezone, viewerTimezone),
        convertedEndTime: convertTimeByOffset(session.endTime, creatorTimezone, viewerTimezone)
      }));
    } catch (error) {
      console.error('Error converting session times:', error);
      return null;
    }
  };

  const convertedSessions = getConvertedTimes();

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-sm text-blue-700">
        <strong>{action} {item} in your timezone:</strong> {timezoneInfo?.timeZone} (UTC{timezoneInfo?.offsetString})
      </div>
      
      {/* Show converted session times if available */}
      {convertedSessions && convertedSessions.length > 0 && (
        <div className="mt-2 p-2 bg-white border border-blue-300 rounded-md">
          <div className="text-xs font-medium text-blue-800 mb-1">Converted Session Times:</div>
          {convertedSessions.map((session, index) => (
            <div key={index} className="text-xs text-blue-700 flex justify-between">
              <span>{session.day}:</span>
              <span>
                {session.convertedStartTime} - {session.convertedEndTime}
                {session.startTime !== session.convertedStartTime && (
                  <span className="text-blue-500 ml-1">
                    (was {session.startTime} - {session.endTime})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-blue-600 mt-1">
        Students will see the time converted to their local timezone
      </div>
    </div>
  );
};

export default TimezoneFormInfo;
