import React, { useState } from 'react';
import './Button.css';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  borderRadius = '100px',
  color,
  backgroundColor,
  disabled = false,
  ...props // For html elements
}) => {
  // Track if button was just clicked for animation
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (e) => {
    if (disabled) return; // Don't do anything if disabled
    // Show click animation
    setIsClicked(true);
    // Remove animation after 150ms
    setTimeout(() => setIsClicked(false), 150);
    
    // Call the onClick function if provided
    if (onClick) onClick(e);
  };

  // Combine all CSS classes needed
  const buttonClasses = [
    'custom-button',
    variant,
    size,
    isClicked ? 'clicked' : '', // Add 'clicked' class if button was just pressed
    disabled ? 'disabled' : ''   // Add 'disabled' class if button is disabled
  ].filter(Boolean).join(' '); // Remove any empty strings

  // Custom styles that can change via props
  const customStyles = {
    borderRadius: borderRadius,
    ...(color && { color }), // Only add color if provided
    ...(backgroundColor && { backgroundColor }) // Only add background color if provided
  };

  return (
    <button
      className={buttonClasses}
      style={customStyles}
      onClick={handleClick}
      disabled={disabled}
      {...props} // Pass any other props through...
    >
      {children}
    </button>
  );
};

export default Button;