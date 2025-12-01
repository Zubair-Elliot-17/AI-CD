import React from "react";

// Circular progress indicator component showing a percentage
const Metric = ({ 
  percentage = 0, 
  size = 120, 
  strokeWidth = 12,
  strokeColor = "#8E12D5" // Default purple
}) => {
  // Calculate circle geometry based on props
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Calculate stroke offset to represent progress
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative", // For absolute positioning of text
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <svg width={size} height={size}>
        {/* Background circle. Shows the full track */}
        <circle
          stroke="#F0F7FB" // Light blue background track
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle. Shows the actual percentage */}
        <circle
          stroke={strokeColor} // Customizable stroke color
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round" // Rounded line ends
          strokeDasharray={circumference} // Total circle length
          strokeDashoffset={offset} // Hide portion based on percentage
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            transition: "stroke-dashoffset 0.3s ease" // Smooth animation
          }}
        />
      </svg>
      {/* Centered percentage text overlay */}
      <span
        style={{
          position: "absolute",
          color: "#3D2D4C", // Dark purple to match progress circle
          fontWeight: "bold",
          fontSize: "1.2rem"
        }}
      >
        {percentage}%
      </span>
    </div>
  );
};

export default Metric;