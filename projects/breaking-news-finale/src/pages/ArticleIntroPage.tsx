import React from 'react';
import { useGame } from '../context/GameContext';
import './ArticleIntroPage.scss';

export function ArticleIntroPage() {
  const { gameState, moveToNextStage } = useGame();
  
  // Get the player's name from the game state
  const playerName = gameState?.player_name || 'reporter';
  
  // Handle continue button click
  const handleContinue = () => {
    moveToNextStage();
  };
  
  return (
    <div data-component="ArticleIntroPage" className="page-container">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Article Creation</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="intro-container">
            <h1>Time to Write Your Story</h1>
            
            <div className="message-box">
              <p className="intro-message">
                Very well, <span className="player-name">{playerName}</span>, let's begin the article creation and sort our thoughts together.
              </p>
            </div>
            
            <button 
              className="continue-button"
              onClick={handleContinue}
            >
              Continue to Article Creation
            </button>
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