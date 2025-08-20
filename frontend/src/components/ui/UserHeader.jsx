import React from 'react';
import Card from './Card';

const UserHeader = ({ 
  user, 
  title, 
  subtitle, 
  roleColor = 'blue',
  children,
  stats 
}) => {
  const roleColorClasses = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700', 
    red: 'from-red-600 to-red-700',
    purple: 'from-purple-600 to-purple-700',
    orange: 'from-orange-600 to-orange-700'
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.name || title;
  };

  // Get user initial
  const getUserInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0);
    }
    if (user?.name) {
      return user.name.charAt(0);
    }
    if (title) {
      return title.charAt(0);
    }
    return 'U';
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className={`bg-gradient-to-r ${roleColorClasses[roleColor]} p-6`}>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {getUserInitial()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              {getUserDisplayName()}
            </h1>
            <p className="text-white text-opacity-90">
              {subtitle || `${user?.role?.charAt(0).toUpperCase()}${user?.role?.slice(1)}` || 'User'}
            </p>
          </div>
          {children && (
            <div className="flex-shrink-0">
              {children}
            </div>
          )}
        </div>
      </div>
      
      {stats && (
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="font-medium text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default UserHeader;
