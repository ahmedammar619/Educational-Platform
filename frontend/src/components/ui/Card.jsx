import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'default',
  shadow = 'sm',
  border = true,
  rounded = true 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div 
      className={`
        bg-white 
        ${rounded ? 'rounded-lg' : ''} 
        ${shadowClasses[shadow]} 
        ${border ? 'border' : ''} 
        ${paddingClasses[padding]} 
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
