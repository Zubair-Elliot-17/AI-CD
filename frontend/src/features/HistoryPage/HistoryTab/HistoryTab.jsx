import React from "react";
import "./HistoryTab.css";

// HistoryTab shows a single analysis result in the history list
// It receives three props: analysis data, click handler, and selection state
const HistoryTab = ({ 
  analysis,  // Object containing analysis results and metadata
  onClick,   // Function to call when this tab is clicked
  isSelected = false  // Whether this tab is currently selected (default false)
}) => {
  // Extract needed properties from the analysis object
  // This is called destructuring. It gets variables from object properties
  const {
    text_preview,  // First part of the analyzed text
    timestamp,     // When the analysis was done
    filename,      // If analyzing a file, this is the filename
    analysis_type, // Type of analysis: 'sentence_level' or 'single_text'
    overall_result,// Results for sentence-level analysis
    result         // Results for single-text analysis
  } = analysis;

  // Convert timestamp to readable date format
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    
    // Format like "Sep 17, 2025, 01:29 PM"
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC' // Use UTC to avoid +2hrs errors
    });
  };

  // Calculate the AI probability as percentage 
  const getAIScore = () => {
    // Different analysis types store results in different places
    if (analysis_type === 'sentence_level') {
      // For sentence-level analysis, use overall_result
      return Math.round((overall_result?.overall_ai_probability || 0) * 100);
    } else {
      // For single-text analysis, use result
      return Math.round((result?.ai_probability || 0) * 100);
    }
  };

  // Get the text to display in the preview area
  const getPreviewText = () => {
    // If it's a file analysis, show the filename
    if (filename) {
      return filename;
    }
    
    // For text analysis, show first 8 words of the preview
    const text = text_preview || "";
    const words = text.split(' ');
    
    // If text is short, show it all
    if (words.length <= 8) {
      return text;
    }
    
    // Otherwise show first 8 words with ellipsis
    return words.slice(0, 8).join(' ') + '...';
  };

  // Determine if content is AI-generated or human-written
  const getClassification = () => {
    const aiScore = getAIScore();
    
    // Simple rule: if AI score > 50%, it's AI-generated
    // Otherwise it's human-written
    return aiScore > 50 ? "AI-generated" : "Human-written";
  };

  // Render the history tab component
  return (
    <div 
      // Apply 'selected' class if this tab is selected
      className={`history-tab ${isSelected ? "selected" : ""}`}
      // When clicked, call onClick function and pass the analysis data
      onClick={() => onClick(analysis)}
    >
      <div className="tab-content">
        {/* Show different title based on analysis type */}
        <h4 className="tab-title">
          {filename ? "File Analysis" : "Text Analysis"}
        </h4>
        
        {/* Show preview text or filename */}
        <p className="tab-preview">
          {getPreviewText()}
        </p>
        
        {/* Show AI score and date in a row */}
        <div className="tab-meta">
          <span className="tab-score">
            AI: {getAIScore()}%
          </span>
          <span className="tab-date">
            {formatDate(timestamp)}
          </span>
        </div>
        
        {/* Show final classification */}
        <div className="tab-classification">
          {getClassification()}
        </div>
      </div>
    </div>
  );
};

export default HistoryTab;