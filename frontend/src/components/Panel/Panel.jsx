import React, { useState } from "react";

// Side panel with navigation buttons
const Panel = function({ buttons = [], onSelect }) {
  // Keep track of which button is currently selected
  const [selected, setSelected] = useState(null);

  // Handle when a button is clicked
  function handleClick(button) {
    setSelected(button); // Remember which button was clicked
    
    // Tell the parent component which button was selected
    if (onSelect) {
      onSelect(button);
    }
  }

  return (
    <aside
      style={{
        backgroundColor: "#F0F7FB", // Light blue background
        width: "200px", // Fixed width for sidebar
        height: "100vh", // Full screen height (vh = viewport height)
        display: "flex",
        flexDirection: "column", // Stack buttons vertically
        padding: "1rem",
        boxShadow: "2px 0 4px rgba(0,0,0,0.05)" // Shadow on right side
      }}
    >
      {/* Create a button for each item in the buttons array */}
      {buttons.map(function(btn) {
        return (
          <button
            key={btn} // Required by React for list items
            onClick={function() { handleClick(btn); }}
            style={{
              // Darker purple if selected, normal purple if not
              backgroundColor: selected === btn ? "#6A0BA8" : "#8E12D5",
              color: "white",
              border: "none",
              borderRadius: "4px", // Rounded corners
              padding: "0.75rem 1rem", // Space inside button
              marginBottom: "0.5rem", // Space between buttons
              cursor: "pointer", // Hand cursor on hover
              textAlign: "left", // Text starts from left
              fontSize: "1rem",
            }}
          >
            {btn} {/* Display the button text */}
          </button>
        );
      })}
    </aside>
  );
};

export default Panel;