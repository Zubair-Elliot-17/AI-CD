import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Panel from "../../components/Panel";
import TextInput from "../../components/TextInput";
import Metric from "../../components/Metric";
import HighlightedText from "../../components/HighlightedText";
import { apiService, handleApiError } from "../../services/api_caller";
import { useNavigate } from "react-router-dom";
import "./AITextDetectorPage.css";

const AITextDetectorPage = function() {
  // State variables to store different pieces of data
  const [selectedPanel, setSelectedPanel] = useState("AI Text Detector");
  const [aiScore, setAiScore] = useState(0); // AI probability percentage
  const [confidenceScore, setConfidenceScore] = useState(0); // How confident the AI is
  const [isProcessing, setIsProcessing] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error messages
  const [analysisResult, setAnalysisResult] = useState(null); // API response data
  const [attachedFile, setAttachedFile] = useState(null); // Uploaded file
  const [inputText, setInputText] = useState(""); // Text user submitted
  
  const navigate = useNavigate(); // For changing pages
  const panelButtons = ["AI Text Detector", "History"]; // Navigation buttons

  // Check if user has an active session when page loads
  useEffect(function() {
    async function checkSession() {
      try {
        const response = await apiService.getSessionInfo();
        console.log("Session info:", response.data);
      } catch (err) {
        console.log("No active session");
      }
    }

    checkSession();
  }, []); // Empty array means run only once when page loads

  // Handle when user clicks panel buttons
  function handlePanelSelect(button) {
    if (button === "History") {
      navigate("/HistoryPage"); // Go to history page
    } else {
      // Reset everything if switching back to AI detector
      setAiScore(0);
      setConfidenceScore(0);
      setError(null);
      setAnalysisResult(null);
      setAttachedFile(null);
      setInputText("");
    }
  }

  // Refresh the history data (called after analysis)
  async function refreshHistory() {
    try {
      await apiService.getHistory();
      console.log("History refreshed");
    } catch (err) {
      console.log("History refresh failed");
    }
  }

  // Main function that handles text/file submission
  async function handleTextSubmit(text, file) {
    setIsProcessing(true); // Show loading spinner
    setError(null); // Clear any previous errors
    setInputText(text); // Store the text user submitted

    const maxChars = 100000; // Character limit
    const maxFileSize = 500 * 1024; // 500KB file size limit

    // Check if text is too long
    if (text && text.length > maxChars) {
      setError("Text is too long! Maximum is " + maxChars + " characters.");
      setIsProcessing(false);
      return;
    }

    // Check if file is too big
    if (file && file.size > maxFileSize) {
      setError("File is too big! Maximum size is 500KB.");
      setIsProcessing(false);
      return;
    }

    console.log("Submitting text:", text);
    console.log("Submitting file:", file);

    try {
      // If user uploaded a file, use file detection API
      if (file) {
        const response = await apiService.detectAIFile(file);
        const result = response.data;
        setAnalysisResult(result);

        console.log("Analysis result:", result);

        // Calculate scores from API response
        let aiProbability = 0;
        let confidence = 0;

        if (result.analysis_type === 'sentence_level') {
          aiProbability = result.result.overall_ai_probability * 100;
          confidence = result.result.overall_confidence * 100;
        } else {
          aiProbability = result.result.ai_probability * 100;
          confidence = result.result.confidence * 100;
        }

        setAiScore(Math.round(aiProbability));
        setConfidenceScore(Math.round(confidence));
      }
      // If user typed text, use text detection API
      else if (text && text.trim()) {
        const response = await apiService.detectAI(text);
        const result = response.data;
        setAnalysisResult(result);

        console.log("Analysis result:", result);

        // Calculate scores from API response
        let aiProbability = 0;
        let confidence = 0;

        if (result.analysis_type === 'sentence_level') {
          aiProbability = result.result.overall_ai_probability * 100;
          confidence = result.result.overall_confidence * 100;
        } else {
          aiProbability = result.result.ai_probability * 100;
          confidence = result.result.confidence * 100;
        }

        setAiScore(Math.round(aiProbability));
        setConfidenceScore(Math.round(confidence));
      }

      await refreshHistory(); // Update history after analysis

    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error("API Error:", err);
    } finally {
      setIsProcessing(false); // Hide loading spinner
    }
  };

  // Handle file attachment
  function handleFileAttach(file) {
    setAttachedFile(file);
    setError(null); // Clear errors when file is attached
  }

  // Handle logo click (go back to homepage)
  function handleLogoClick() {
    setSelectedPanel("AI Text Detector");
    setAiScore(0);
    setConfidenceScore(0);
    setIsProcessing(false);
    setError(null);
    setAnalysisResult(null);
    setAttachedFile(null);
    setInputText("");
    navigate("/"); // Go to homepage
  }

  // Get description based on AI probability score
  function getConfidenceDescription() {
    if (!analysisResult) return "Submit text to analyze";

    if (aiScore >= 80) {
      return "High probability of AI-generated content";
    } else if (aiScore >= 60) {
      return "Moderate probability of AI-generated content";
    } else if (aiScore >= 40) {
      return "Mixed indicators. Could be either AI or human";
    } else {
      return "High probability of human-written content";
    }
  }

  // Get confidence level description
  function getConfidenceLevel() {
    if (!analysisResult) return "N/A";

    if (confidenceScore >= 90) {
      return "Very High";
    } else if (confidenceScore >= 75) {
      return "High";
    } else if (confidenceScore >= 60) {
      return "Moderate";
    } else {
      return "Low";
    }
  }

  // Prepare sentence data for highlighting
  function getSentencesForHighlighting() {
    if (!analysisResult) return [];

    console.log("Analysis result:", analysisResult);

    // Check if we have sentence-level analysis results
    if (analysisResult.sentence_results) {
      return analysisResult.sentence_results.map(function(sentenceResult) {
        return {
          sentence: sentenceResult.sentence || "No text available",
          result: sentenceResult.result || {
            classification: 'Unknown',
            ai_probability: 0.5,
            human_probability: 0.5,
            confidence: 0
          }
        };
      });
    }

    return [];
  }

  // Get text to display (either user input or from API)
  function getTextForDisplay() {
    return inputText || (analysisResult && analysisResult.text_preview) || "";
  }

  return (
    <div className="ai-text-detector-page">
      <Header onLogoClick={handleLogoClick} />

      <div className="main-content">
        <div className="panel-container">
          <Panel
            buttons={panelButtons}
            onSelect={handlePanelSelect}
          />
        </div>

        <div className="content-area">
          <div className="text-input-container">
            <h2 className="panel-title">{selectedPanel}</h2>
            <TextInput
              onSubmit={handleTextSubmit}
              onFileAttach={handleFileAttach}
            />
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Show highlighted text analysis results if available */}
            {analysisResult && (
              <div>
                <HighlightedText
                  text={getTextForDisplay()}
                  sentences={getSentencesForHighlighting()}
                  showLegend={true}
                />
              </div>
            )}
          </div>

          <div className="metric-container">
            <h3>Analysis Results</h3>
            {isProcessing ? (
              <div className="processing-indicator">
                <div className="spinner"></div>
                <p>Analyzing content...</p>
              </div>
            ) : (
              <div className="metrics-stack">
                <div className="metric-item">
                  <h4>AI Probability</h4>
                  <Metric percentage={aiScore} />
                  <p className="metric-description">
                    {getConfidenceDescription()}
                  </p>
                </div>

                <div className="metric-item">
                  <h4>Confidence</h4>
                  <Metric
                    percentage={confidenceScore}
                    strokeColor="#28a745" // Green color for confidence meter
                  />
                  <p className="metric-description">
                    {getConfidenceLevel()} confidence
                  </p>
                </div>

                {/* Show analysis details if we have results */}
                {analysisResult && (
                  <div className="analysis-details">
                    <p><strong>Analysis ID:</strong> {analysisResult.analysis_id}</p>
                    <p><strong>Type:</strong> {analysisResult.analysis_type}</p>
                    <p><strong>Session:</strong> {analysisResult.session_id?.substring(0, 8)}...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITextDetectorPage;