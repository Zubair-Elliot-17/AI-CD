import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Panel from "../../components/Panel";
import Metric from "../../components/Metric";
import HistoryTab from "./HistoryTab/HistoryTab";
import { apiService, handleApiError } from "../../services/api_caller";
import { useNavigate } from "react-router-dom";
import AnalysisHistory from "./AnalysisHistory/AnalysisHistory";
import Button from "../../components/Button";
import "./HistoryPage.css";

const HistoryPage = function() {
  // State variables to manage the page
  const [analyses, setAnalyses] = useState([]); // List of past analyses
  const [loading, setLoading] = useState(true); // Loading spinner state
  const [error, setError] = useState(null); // Error messages
  const [selectedAnalysis, setSelectedAnalysis] = useState(null); // Which analysis is clicked
  const [showAnalysisDetail, setShowAnalysisDetail] = useState(false); // Show details view

  const navigate = useNavigate(); // For changing pages
  const panelButtons = ["AI Text Detector", "History"]; // Navigation buttons

  // Handle panel button clicks
  function handlePanelSelect(button) {
    if (button === "AI Text Detector") {
      navigate("/AITextDetectorPage"); // Go to AI detector page
    }
  };

  // Go back to homepage
  function handleLogoClick() {
    navigate("/");
  };

  // Load the analysis history from the API
  async function loadHistory() {
    setLoading(true); // Show loading spinner
    setError(null); // Clear any errors

    try {
      const response = await apiService.getHistory();
      console.log("History loaded:", response.data);
      
      // Sort analyses from newest to oldest
      const sortedAnalyses = (response.data.analyses || []).sort(function(a, b) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      setAnalyses(sortedAnalyses);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error("Error loading history:", err);
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  // Clear all history (with confirmation)
  async function clearHistory() {
    if (window.confirm("Are you sure you want to clear all history?")) {
      try {
        await apiService.clearHistory();
        setAnalyses([]); // Empty the list
        setSelectedAnalysis(null); // Clear selection
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        console.error("Error clearing history:", err);
      }
    }
  };

  // Handle when a history tab is clicked
  function handleTabClick(analysis) {
    setSelectedAnalysis(analysis);
    setShowAnalysisDetail(true); // Show the detailed view
  };

  // Load history when page first loads
  useEffect(function() {
    loadHistory();
  }, []); // Empty array means run only once

  return (
    <div className="history-page">
      <Header onLogoClick={handleLogoClick} />
      
      <div className="main-content">
        <Panel buttons={panelButtons} onSelect={handlePanelSelect} />
        
        <div className="content-area">
          {showAnalysisDetail ? (
            // Show detailed analysis view
            <AnalysisHistory 
              analysis={selectedAnalysis}
              onBack={function() {
                setShowAnalysisDetail(false);
                setSelectedAnalysis(null);
              }}
            />
          ) : (
            // Show list of history items
            <div className="history-container-full">
              <h2 className="panel-title">Analysis History</h2>
              
              {/* Show error message if something went wrong */}
              {error && (
                <div className="error-message">
                  {error}
                  <Button 
                    onClick={loadHistory}
                    variant="primary"
                    size="small"
                    style={{ marginLeft: '10px' }}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Show loading spinner */}
              {loading ? (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <p>Loading history...</p>
                </div>
              ) : analyses.length === 0 ? (
                // Show empty state if no analyses
                <div className="empty-state">
                  <p>No analysis history yet.</p>
                  <p>Go to AI Text Detector to analyze some text!</p>
                </div>
              ) : (
                // Show list of analyses
                <>
                  <div className="history-controls">
                    <Button 
                      onClick={clearHistory} 
                      variant="danger"
                      size="small"
                    >
                      Clear All History
                    </Button>
                  </div>

                  <div className="history-list">
                    {analyses.map(function(analysis, index) {
                      return (
                        <HistoryTab
                          key={analysis.id || index} // Use ID or index as unique key
                          analysis={analysis}
                          onClick={handleTabClick}
                          isSelected={selectedAnalysis?.id === analysis.id}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;