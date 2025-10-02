import React from 'react';

const TimezoneFormInfo = ({ action = 'Creating', item = 'item' }) => {
  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-sm text-blue-700">
        <strong>{action} {item} in your timezone:</strong> {typeof window !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone}
      </div>
      <div className="text-xs text-blue-600 mt-1">
        Students will see the time converted to their local timezone
      </div>
    </div>
  );
};

export default TimezoneFormInfo;
