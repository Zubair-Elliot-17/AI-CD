// Application entry point that mounts React to the DOM
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Creates React root and renders the application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Provides routing context to the entire app */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)