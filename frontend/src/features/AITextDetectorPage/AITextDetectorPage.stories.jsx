import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AITextDetectorPage from "./AITextDetectorPage";
import "../../index.css";


export default {
  title: "Pages/AITextDetectorPage",
  component: AITextDetectorPage,
  // Wrap with router for navigation to work
  decorators: [
    function(Story) {
      return (
        <Router>
          <Story />
        </Router>
      );
    },
  ],
};

// Basic page story
export const Default = function() {
  return <AITextDetectorPage />;
};