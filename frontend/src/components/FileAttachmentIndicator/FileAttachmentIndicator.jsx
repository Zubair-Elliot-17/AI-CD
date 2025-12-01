import React from "react";
import Icon from "../Icon/Icon";
import { MdClose, MdInsertDriveFile } from "react-icons/md";

const FileAttachmentIndicator = ({ file, onRemove }) => {
  // Convert file size to human readable format (KB, MB, etc.)
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    
    // Math to convert bytes to appropriate unit
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024)); // 1024 bytes = 1KB
    
    // Round to 2 decimal places and add unit
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem", // Space between items
        padding: "0.5rem",
        marginBottom: "0.5rem",
        backgroundColor: "#f5f5f5", // Light gray background
        border: "1px solid #ddd", // Light border
        borderRadius: "6px",
        fontSize: "0.85rem", // Slightly smaller text
      }}
    >
      {/* File icon on the left */}
      <Icon
        icon={MdInsertDriveFile} // Always use the file icon
        size={20}
        color="#666"
        backgroundColor="transparent" // No background
        isClickable={false} // Icon itself isn't clickable
      />
      
      {/* File info in the middle */}
      <div style={{ flex: 1, minWidth: 0 }}> {/* Takes remaining space */}
        {/* File name. will truncate if too long */}
        <div
          style={{
            fontWeight: "500",
            color: "#333",
            overflow: "hidden", // Hide overflow
            textOverflow: "ellipsis", // Show ... if text too long
            whiteSpace: "nowrap", // Keep on one line
          }}
        >
          {file.name}
        </div>
        
        {/* File size below the name */}
        <div style={{ color: "#666", fontSize: "0.75rem" }}>
          {formatFileSize(file.size)}
        </div>
      </div>
      
      {/* Remove button on the right */}
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px",
          borderRadius: "3px",
          display: "flex",
          alignItems: "center",
        }}
        // Hover effect using inline styles
        onMouseOver={(e) => {
          e.target.style.backgroundColor = "#e0e0e0"; // Light gray on hover
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = "transparent"; // Back to normal
        }}
        title="Remove file" // Tooltip
      >
        {/* X icon for remove button */}
        <Icon
          icon={MdClose}
          size={16}
          color="#666"
          backgroundColor="transparent"
          isClickable={false}
        />
      </button>
    </div>
  );
};

export default FileAttachmentIndicator;