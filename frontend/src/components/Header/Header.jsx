import React from "react";
import "./Header.css";

// Simple header with clickable logo
const Header = ({ onLogoClick }) => {
  return (
    <header className="header">
      <h1
        onClick={onLogoClick} // When logo is clicked, call the function from parent
        className="app-name"
      >
        AICD {/* App name that acts as logo */}
      </h1>
    </header>
  );
};

export default Header;