import React, { useState } from "react";
import Icon from "../Icon/Icon";
import { MdAttachFile, MdArrowUpward } from "react-icons/md"; //Imports the MdAttachFile and MdArrowUpward components from the Material Design icon set
import FileAttachmentIndicator from "../FileAttachmentIndicator/FileAttachmentIndicator";

const TextInput = function({ onSubmit, onFileAttach }) {
  // State to store the text user types and any attached file
  const [text, setText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  
  // Limits for validation
  const maxChars = 100000; // Maximum characters allowed
  const maxFileSize = 500 * 1024; // 500KB in bytes (1024 bytes = 1KB)

  // Update text when user types in the textarea
  function handleChange(event) {
    setText(event.target.value);
  }

  // Handle submit button click
  function handleSubmit() {
    // Check if text is too long (only if there's actual text)
    if (text.trim() && text.length > maxChars) {
      alert("Text is too long! Maximum is " + maxChars + " characters.");
      return;
    }
    
    // Only submit if there's either text or a file
    if (text.trim() || attachedFile) {
      // Call the parent function if it exists
      if (onSubmit) {
        onSubmit(text, attachedFile);
      }
      // Clear everything after submitting
      setText("");
      setAttachedFile(null);
    }
  }

  // Handle file selection from file dialog
  function handleFileChange(event) {
    const file = event.target.files[0]; // Get the first file user selected
    
    if (file && onFileAttach) {
      // Check if file is too big
      if (file.size > maxFileSize) {
        alert("File is too big! Maximum size is 500KB.");
        event.target.value = ''; // Reset file input
        return;
      }
      
      // List of allowed file types (MIME types)
      const allowedTypes = [
        "application/pdf", // PDF files
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // Word documents (.docx)
        "text/plain", // Text files (.txt)
      ];
      
      // Check if the selected file type is allowed
      if (allowedTypes.includes(file.type)) {
        setAttachedFile(file); // Store the file in state
        onFileAttach(file); // Notify parent component
      } else {
        alert("Please choose a PDF, Word document, or text file.");
      }
    }
    
    event.target.value = ''; // Clear file input for next selection
  };

  // Remove the attached file
  function handleRemoveFile() {
    setAttachedFile(null);
  }

  // Disable submit button if there's no content
  const isDisabled = (!text.trim() && !attachedFile);

  return (
    <div
      style={{
        border: "1px solid black",
        borderRadius: "10px",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column", // Stack items vertically
        width: "100%",
        height: "100%",
        padding: "0.5rem",
        boxSizing: "border-box", // Include padding in total size
      }}
    >
      {/* Textarea for user input */}
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Type here..."
        style={{
          flex: 1, // Take up all available space
          border: "none",
          outline: "none", // Remove default focus outline
          resize: "none", // Prevent manual resizing
          fontSize: "1rem",
          fontFamily: "Arial, sans-serif",
        }}
      />

      {/* Show file indicator if a file is attached */}
      {attachedFile && (
        <FileAttachmentIndicator 
          file={attachedFile} 
          onRemove={handleRemoveFile} 
        />
      )}

      {/* Footer with info and buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between", // Left and right sides
          alignItems: "center",
          marginTop: "0.25rem",
        }}
      >
        {/* Left side: Character counter or file info */}
        <div>
          {/* Show character count if no file attached */}
          {!attachedFile && (
            <span style={{ fontSize: "0.85rem", color: text.length > maxChars ? "red" : "black" }}>
              {text.length}/{maxChars} characters
            </span>
          )}
          
          {/* Show file size info */}
          {attachedFile ? (
            <span style={{ fontSize: "0.85rem" }}>
              File: {(attachedFile.size / 1024).toFixed(2)} KB
            </span>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "#666", display: "block", marginTop: "2px" }}>
              Max. File Size: 500KB
            </span>
          )}
        </div>

        {/* Right side: Action buttons */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {/* File attachment button (hidden input trick) */}
          <label style={{ cursor: "pointer" }}>
            <input
              type="file"
              accept=".docx,.pdf,.txt"
              style={{ display: "none" }} // Hide ugly file input
              onChange={handleFileChange}
            />
            <Icon
              icon={MdAttachFile}
              size={36}
              color="black"
              isClickable={true}
            />
          </label>

          {/* Submit button */}
          <Icon
            icon={MdArrowUpward}
            size={36}
            color="white"
            backgroundColor="#8E12D5"
            isClickable={!isDisabled}
            isDisabled={isDisabled}
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default TextInput;