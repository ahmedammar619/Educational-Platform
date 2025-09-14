import React from 'react';

const ComponentLoader = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const textSizes = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className="flex items-center justify-center min-h-32">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-purple-600 mx-auto mb-2 ${sizeClasses[size]}`}></div>
        <p className={`text-gray-600 ${textSizes[size]}`}>{text}</p>
      </div>
    </div>
  );
};

export default ComponentLoader;
