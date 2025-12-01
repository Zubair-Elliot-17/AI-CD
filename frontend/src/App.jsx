// Main application component that serves as the root container
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './features/HomePage/HomePage';
import AITextDetectorPage from './features/AITextDetectorPage/AITextDetectorPage';
import HistoryPage from './features/HistoryPage/HistoryPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/AITextDetectorPage" element={<AITextDetectorPage />} />
        <Route path="/HistoryPage" element={<HistoryPage />} /> 
      </Routes>
    </div>
  );
}

export default App;