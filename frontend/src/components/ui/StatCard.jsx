import React from 'react';
import Card from './Card';

const StatCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  iconColor = 'blue',
  trend,
  trendDirection
}) => {
  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    indigo: 'text-indigo-600',
    gray: 'text-gray-600'
  };

  const trendColorClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <Card>
      <div className="flex items-center">
        {Icon && (
          <Icon className={`h-8 w-8 ${iconColorClasses[iconColor]}`} />
        )}
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`text-sm font-medium ${trendColorClasses[trendDirection]}`}>
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
