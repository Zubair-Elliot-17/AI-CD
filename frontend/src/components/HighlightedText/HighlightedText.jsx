import React from 'react';
import './HighlightedText.css';

const HighlightedText = function({ 
  text, 
  sentences = [], 
  showLegend = true,
  className = '' 
}) {
  // Check if we have sentence analysis data from the AI
  const hasSentenceData = sentences && sentences.length > 0;
  
  // Figure out what text to display
  let displayText = text;
  // If no text provided but we have sentences, combine them
  if (!displayText && hasSentenceData) {
    displayText = sentences.map(function(item) {
      return item.sentence || ""; // Get each sentence or empty string if missing
    }).join(' '); // Join with spaces between sentences
  }

  // Create the legend that shows what colors mean
  function renderLegend() {
    if (!showLegend) return null; // Don't show legend if disabled
    
    return (
      <div className="text-legend">
        <div className="legend-item">
          <span className="legend-color ai-generated"></span>
          <span>AI-generated text</span>
        </div>
        <div className="legend-item">
          <span className="legend-color human-written"></span>
          <span>Human-written text</span>
        </div>
      </div>
    );
  }

  // Create the actual text with highlighting
  function renderText() {
    // If no sentence data, just show plain text
    if (!hasSentenceData) {
      return <div className="highlighted-text-content">{displayText}</div>;
    }

    // Create highlighted spans for each sentence
    const textParts = sentences.map(function(item, index) {
      const sentence = item.sentence || "";
      let textType = "unknown"; // Default type
      
      // Figure out if this sentence is AI or human
      if (item.result) {
        if (item.result.classification) {
          // Use the classification if provided (like "AI-Generated" or "Human-Written")
          textType = item.result.classification.toLowerCase();
        } else if (item.result.ai_probability > 0.5) {
          // If AI probability > 50%, mark as AI-generated
          textType = "ai-generated";
        } else {
          // Otherwise mark as human-written
          textType = "human-written";
        }
      }
      
      // Choose CSS class based on text type
      const highlightClass = textType === "ai-generated" ? "ai-generated" : "human-written";
      
      return (
        <span key={index} className={`sentence-highlight ${highlightClass}`}>
          {sentence}{' '} {/* Add space after each sentence */}
        </span>
      );
    });

    return <div className="highlighted-text-content">{textParts}</div>;
  }

  // Main component render
  return (
    <div className={`highlighted-text ${className}`}>
      <div className="highlighted-text-container">
        {renderLegend()}
        {renderText()}
      </div>
    </div>
  );
};

export default HighlightedText;