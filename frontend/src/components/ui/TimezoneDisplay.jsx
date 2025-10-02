import React from 'react';
import { Globe, Clock } from 'lucide-react';
import { useTimezone } from '../../hooks/useTimezone';

/**
 * TimezoneDisplay Component
 * Displays current user timezone information
 */
const TimezoneDisplay = ({ 
  variant = 'default', // 'default', 'compact', 'inline'
  showIcon = true,
  showOffset = false,
  className = ''
}) => {
  const { timezoneInfo, isLoading } = useTimezone();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <Globe className="w-4 h-4 text-gray-400 animate-pulse" />}
        <span className="text-sm text-gray-500">Detecting timezone...</span>
      </div>
    );
  }

  if (!timezoneInfo.isInitialized) {
    return null;
  }

  const renderContent = () => {
    const baseClasses = "flex items-center gap-2";
    const iconSize = variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4';
    
    let displayText;
    let iconColor = 'text-gray-400';
    
    switch (variant) {
      case 'compact':
        displayText = timezoneInfo.timezone;
        break;
      case 'inline':
        displayText = timezoneInfo.displayName;
        break;
      default:
        displayText = timezoneInfo.displayName;
        iconColor = 'text-blue-500';
    }

    return (
      <div className={`${baseClasses} ${className}`}>
        {showIcon && (
          <Globe className={`${iconSize} ${iconColor}`} />
        )}
        <span className={`${variant === 'compact' ? 'text-xs' : 'text-sm'} text-gray-600`}>
          {showOffset ? `${displayText} (UTC${timezoneInfo.offset >= 0 ? '-' : '+'}${Math.abs(timezoneInfo.offset) / 60}:00)` : displayText}
        </span>
      </div>
    );
  };

  return renderContent();
};

/**
 * TimezoneBadge Component
 * A badge-style timezone display
 */
export const TimezoneBadge = ({ className = '' }) => {
  const { timezoneInfo, isLoading } = useTimezone();

  if (isLoading || !timezoneInfo.isInitialized) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full ${className}`}>
      <Globe className="w-3 h-3 text-blue-500" />
      <span className="text-xs font-medium text-blue-700">
        {timezoneInfo.timezone}
      </span>
    </div>
  );
};

/**
 * TimezoneIndicator Component
 * A prominent timezone indicator for important sections
 */
export const TimezoneIndicator = ({ className = '' }) => {
  const { timezoneInfo, isLoading } = useTimezone();

  if (isLoading || !timezoneInfo.isInitialized) {
    return null;
  }

  return (
    <div className={`p-3 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Globe className="w-4 h-4 text-gray-400" />
          <span>Your timezone: <strong>{timezoneInfo.displayName}</strong></span>
        </div>
        <div className="text-xs text-gray-500">
          All times shown in local timezone
        </div>
      </div>
    </div>
  );
};

/**
 * DateTimeDisplay Component
 * Displays a date/time with timezone information
 */
export const DateTimeDisplay = ({ 
  date, 
  format = 'full',
  showTimezone = true,
  className = ''
}) => {
  const { toLocalTime, timezoneInfo } = useTimezone();

  if (!date) return null;

  const formattedDate = toLocalTime(date, format);
  const timezoneText = showTimezone ? ` (${timezoneInfo.timezone})` : '';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-600">
        {formattedDate}{timezoneText}
      </span>
    </div>
  );
};

export default TimezoneDisplay;
