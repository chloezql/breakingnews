import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './ReporterInfoPage.scss';

export function ReporterInfoPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const [headline, setHeadline] = useState('');
  const [error, setError] = useState('');
  
  // Handle headline input change
  const handleHeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHeadline(value);
    
    // Clear error when user types
    if (error) setError('');
    
    // Validate headline length
    if (value.length > 80) {
      setError('Headline should be 80 characters or less');
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate headline
    if (!headline.trim()) {
      setError('Please enter a headline for your story');
      return;
    }
    
    // Save to game state and move to next stage
    updateGameState({ headline });
    moveToNextStage();
  };
  
  // Get current date for display
  const getCurrentDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options).toUpperCase();
  };
  
  return (
    <div data-component="ReporterInfoPage">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Headline</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="reporter-info-container">
            <h1>Create Your Front Page Headline</h1>
            
            <div className="newspaper-preview">
              <div className="newspaper-header">
                <div className="newspaper-name">GLOBAL DAILY COURIER</div>
                <div className="newspaper-date">{getCurrentDate()}</div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="headline-input-container">
                  <label htmlFor="headline">BREAKING NEWS HEADLINE:</label>
                  <input
                    id="headline"
                    type="text"
                    value={headline}
                    onChange={handleHeadlineChange}
                    placeholder="Write your headline here..."
                    maxLength={80}
                    className={error ? 'error' : ''}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                  />
                  
                  {error && <p className="error-message">{error}</p>}
                  
                  <div className="character-count">
                    {headline.length}/80 characters
                  </div>
                </div>
                
                <div className="reporter-byline">
                  <span>By: {gameState.player_name || 'Anonymous Reporter'}</span>
                </div>
                
                <button 
                  type="submit"
                  className="continue-button"
                  disabled={!headline.trim() || !!error}
                >
                  PUBLISH STORY
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="window-status-bar">
          <div className="status-text">Breaking News - 2025</div>
          <div className="windows-logo"></div>
        </div>
      </div>
    </div>
  );
} 