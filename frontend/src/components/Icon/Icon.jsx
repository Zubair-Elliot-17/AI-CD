import React from 'react';
import './Icon.css';

// Simple icon wrapper component
const Icon = ({
  icon: IconComponent, // The actual icon component from react-icons
  color = '#8E12D5', 
  backgroundColor = 'white',
  size = 40,
  isClickable = true,
  isDisabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  // Handle clicks only if allowed
  const handleClick = (e) => {
    if (!isDisabled && isClickable && onClick) {
      onClick(e);
    }
  };

  // Style object for the icon container
  const iconStyles = {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: backgroundColor,
    borderRadius: '10px',
    cursor: isClickable && !isDisabled ? 'pointer' : 'default',
    opacity: isDisabled ? 0.5 : 1,
  };

  return (
    <div
      className={`icon-container ${className}`}
      style={iconStyles}
      onClick={handleClick}
      role={isClickable ? 'button' : 'presentation'} // For screen readers
      aria-disabled={isDisabled}
      tabIndex={isClickable && !isDisabled ? 0 : -1} // Keyboard navigation
      {...props}
    >
      {/* Render the icon if provided */}
      {IconComponent && (
        <IconComponent
          size={size * 0.6} // Make icon smaller than container
          color={color}
        />
      )}
    </div>
  );
};

export default Icon;