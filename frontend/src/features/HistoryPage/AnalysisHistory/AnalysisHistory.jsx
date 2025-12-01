// This component displays the full details when you click on a history item
import React from "react";
import Metric from "../../../components/Metric";        // Circular progress indicator
import Button from "../../../components/Button";        // Back button component
import HighlightedText from "../../../components/HighlightedText";  // Colors sentences based on AI/human detection
import "./AnalysisHistory.css";

// This component receives two props:
// - analysis: the complete analysis data object
// - onBack: function to call when user clicks back button
const AnalysisHistory = ({ analysis, onBack }) => {
  // First check if we actually have analysis data to display
  // This handles the case where someone navigates directly to this page without selecting an analysis
  if (!analysis) {
    return (
      <div className="analysis-history">
        <div className="no-analysis-selected">
          <p>No analysis selected</p>
          {/* Back button to return to the history list */}
          <Button onClick={onBack} variant="primary" className="back-button">
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  // Extract all the properties we need from the analysis object
  // Using destructuring to avoid writing "analysis." before every property
  const {
    text_preview,       // Short preview of the analyzed text
    timestamp,          // When the analysis was performed
    filename,           // Name of file if analysis was on a file upload
    analysis_type,      // Either 'sentence_level' or 'single_text'
    source_type,        // Either 'file' or 'text' (where the content came from)
    text_length,        // Total characters in the analyzed text
    overall_result,     // Overall results for sentence-level analysis
    result,             // Results for single-text analysis
    sentence_analysis   // Array of individual sentence results (for sentence-level analysis)
  } = analysis;

  // Calculate the AI probability score as a percentage
  // Different analysis types store their results in different places
  const getAIScore = () => {
    if (analysis_type === 'sentence_level') {
      // For sentence-level analysis, use the overall_result object
      // The ?. is optional chaining ... if overall_result is null, it won't crash
      return Math.round((overall_result?.overall_ai_probability || 0) * 100);
    } else {
      // For single-text analysis, use the result object
      return Math.round((result?.ai_probability || 0) * 100);
    }
  };

  // Calculate the confidence level as a percentage (0-100)
  // Confidence tells us how sure the model is about its prediction
  const getConfidenceScore = () => {
    if (analysis_type === 'sentence_level') {
      return Math.round((overall_result?.overall_confidence || 0) * 100);
    } else {
      return Math.round((result?.confidence || 0) * 100);
    }
  };

  // Format the timestamp into a readable date string
  // Example: Sep 17, 2025, 01:23 PM
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',        // Use UTC to avoid timezone confusion
      year: 'numeric',        // Full year (2025)
      month: 'short',         // Short month name (Sep)
      day: 'numeric',         // Day of month (17)
      hour: '2-digit',        // 2 digit hour (01)
      minute: '2-digit',      // 2 digit minute (29)
      hour12: true            // Use 12hr clock with am pm
    });
  };

  // Get the full text to display in the highlighted text component
  // For sentence-level analysis, we reconstruct the text from individual sentences
  // For single-text analysis, we just use the preview
  const getFullText = () => {
    if (sentence_analysis) {
      // If we have sentence analysis data, join all the sentences together
      // map() gets just the sentence text from each object, join() combines them with spaces
      return sentence_analysis.map(item => item.sentence).join(' ');
    }
    // Fallback to text preview if no sentence analysis available
    return text_preview || "Full text not available";
  };

  // Render the component UI
  return (
    <div className="analysis-history">
      {/* Header section with back button and page title */}
      <div className="analysis-header">
        <Button 
          onClick={onBack}     // Call the onBack function when clicked
          variant="primary"    // Use the primary button style
        >
          Back to History
        </Button>
        <h2>Analysis Details</h2>
      </div>

      {/* Main content area. Split into two columns */}
      <div className="analysis-content">
        {/* Left column: The actual text content with highlighting */}
        <div className="analysis-text-section">
          <h3>Full Text Content</h3>
          {/* HighlightedText component colors sentences based on AI/human classification */}
          <HighlightedText 
            // Only pass sentence analysis if this is a sentence-level analysis
            // For single-text analysis, sentences will be null and it will show as one block
            sentences={analysis_type === 'sentence_level' ? sentence_analysis : null}
            text={getFullText()}      // The actual text to display
            showLegend={true}         // Show the color legend (AI = red, Human = green)
          />
        </div>

        {/* Right column: Metrics and analysis details */}
        <div className="analysis-metrics-section">
          <div className="metric-card">
            <h3 className="metric-title">AI Probability Score</h3>
            
            {/* Big circular metric showing the main AI probability score */}
            <div className="metric-container">
              <Metric percentage={getAIScore()} />
            </div>
            
            {/* Only show confidence metric for sentence-level analysis */}
            {/* This is a conditional render. Only shows if analysis_type is 'sentence_level' */}
            {analysis_type === 'sentence_level' && (
              <div className="confidence-metric">
                <h4 className="metric-title">Confidence Level</h4>
                {/* Confidence metric now uses same styling as first metric */}
                <div className="metric-container">
                  <Metric percentage={getConfidenceScore()} />
                </div>
              </div>
            )}
            
            {/* Detailed information about the analysis */}
            <div className="metric-details">
              <p><strong>Type:</strong> {source_type}</p>
              
              {/* Only show filename if this was a file analysis */}
              {/* Conditional render. Only shows if filename exists */}
              {filename && <p><strong>File:</strong> {filename}</p>}
              
              <p><strong>Date:</strong> {formatDate(timestamp)}</p>
              <p><strong>Text Length:</strong> {text_length} characters</p>
              <p><strong>Analysis Type:</strong> {analysis_type}</p>
              
              {/* Only show sentence-level details if this was a sentence-level analysis */}
              {analysis_type === 'sentence_level' && overall_result && (
                // Using React fragment (<> </>) to group multiple elements without adding extra DOM nodes
                <>
                  <p><strong>AI Sentences:</strong> {overall_result.ai_sentence_count}</p>
                  <p><strong>Human Sentences:</strong> {overall_result.human_sentence_count}</p>
                  {/* <p><strong>AI Percentage:</strong> {overall_result.ai_percentage}%</p> */}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisHistory;