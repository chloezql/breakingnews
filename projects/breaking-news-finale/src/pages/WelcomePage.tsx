import React from 'react';
import { useGame } from '../context/GameContext';
import './WelcomePage.scss';

export function WelcomePage() {
  const { gameState, moveToNextStage } = useGame();
  const playerName = gameState?.player_name || 'Reporter';

  const handleContinue = () => {
    moveToNextStage();
  };

  return (
    <div data-component="WelcomePage">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Welcome</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="welcome-container">
            <div className="welcome-message">
              <h1>Welcome home {playerName},</h1>
              <h2>Let's first recap the evidences you have collected.</h2>
              
              <button 
                className="continue-button"
                onClick={handleContinue}
              >
                Continue
              </button>
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