import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { getSuspect } from '../types/suspects';
import './SuspectRecapPage.scss';

export function SuspectRecapPage() {
  const { gameState, moveToNextStage } = useGame();
  const [isReady, setIsReady] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  
  // Get the selected suspect from the game state
  const selectedSuspectIds = gameState?.selected_suspect || [];
  // Get the first suspect ID if the array has elements
  const suspectId = selectedSuspectIds.length > 0 ? selectedSuspectIds[0] : null;
  const suspect = suspectId !== null ? getSuspect(suspectId) : undefined;
  
  // Set up animation timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setIsReady(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle continue button click
  const handleContinue = () => {
    moveToNextStage();
  };
  
  // If no suspect is selected, show an error message
  if (!suspect) {
    return (
      <div data-component="SuspectRecapPage">
        <div className="window-container">
          <div className="window-title-bar">
            <div className="title-text">Breaking News - Suspect Recap</div>
            <div className="window-controls">
              <button className="minimize-btn">_</button>
              <button className="maximize-btn">[]</button>
              <button className="close-btn">×</button>
            </div>
          </div>
          
          <div className="window-content">
            <div className="error-container">
              <h1>No Suspect Selected</h1>
              <p className="error-message">Sadly you didn't got the time to talk to any suspects. But that's no big deal!</p>
              <button 
                className="continue-button"
                style={{ padding: '20px', fontSize:'20px' }}
                onClick={handleContinue}
              >
                Continue
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
  
  // Helper function to check if a suspect is selected
  const isSuspectSelected = (id: number): boolean => {
    return selectedSuspectIds.includes(id);
  };
  
  return (
    <div data-component="SuspectRecapPage">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Suspect Recap</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="suspect-recap-container">
            <h1> These are the suspects you interrogated earlier...</h1>
            <p className="subtitle"></p>
            
            <div className={`suspects-grid ${isAnimating ? 'animating' : ''}`}>
              {/* Dr. Eleanor Hart */}
              <div className={`suspect-card ${isSuspectSelected(7298) ? 'selected' : 'greyed-out'}`}>
                <div className="suspect-image">
                  <img src="/character-photos/dr.hart.png" alt="Dr. Eleanor Hart" />
                </div>
                <h2 className="suspect-name">Dr. Eleanor Hart</h2>
              </div>
              
              {/* Kevin Sanchez */}
              <div className={`suspect-card ${isSuspectSelected(4692) ? 'selected' : 'greyed-out'}`}>
                <div className="suspect-image">
                  <img src="/character-photos/kevin.png" alt="Kevin Sanchez" />
                </div>
                <h2 className="suspect-name">Kevin Sanchez</h2>
              </div>
              
              {/* Lucy Marlow */}
              <div className={`suspect-card ${isSuspectSelected(5746) ? 'selected' : 'greyed-out'}`}>
                <div className="suspect-image">
                  <img src="/character-photos/lucy.png" alt="Lucy Marlow" />
                </div>
                <h2 className="suspect-name">Lucy Marlow</h2>
              </div>
            </div>
            
            {isReady && (
              <button 
                className="continue-button"
                onClick={handleContinue}
              >
                Continue
              </button>
            )}
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