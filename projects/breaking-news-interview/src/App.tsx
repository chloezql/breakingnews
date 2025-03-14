import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.scss';
import InterviewPageWithRFID from './pages/InterviewPageWithRFID';

// This application now uses React Router for navigation
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* For now, we only have one main page but we're set up for future expansion */}
          <Route path="/interview" element={<InterviewPageWithRFID />} />
          
          {/* Redirect root to the interview page */}
          <Route path="/" element={<Navigate replace to="/interview" />} />
          
          {/* Catch-all route for any undefined paths */}
          <Route path="*" element={<Navigate replace to="/interview" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App; 