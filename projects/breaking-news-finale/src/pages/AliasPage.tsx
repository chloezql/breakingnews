import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import './AliasPage.scss';

export function AliasPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const [alias, setAlias] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAlias(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && alias.trim()) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (alias.trim()) {
      // Update the game state with the player's alias
      updateGameState({ player_name: alias.trim() });
      moveToNextStage();
    }
  };

  return (
    <div data-component="AliasPage">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Reporter Alias</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="alias-container">
            <div className="alias-prompt">
              <h2>What alias do you want to use for this article?</h2>
              <div className="alias-input-container">
                <input
                  ref={inputRef}
                  type="text"
                  value={alias}
                  onChange={handleAliasChange}
                  onKeyDown={handleKeyDown}
                  className="alias-input"
                  placeholder="Enter your alias here..."
                  maxLength={30}
                />
              </div>
              {/* <p className="alias-instruction">Press Enter when done</p> */}
              
              <button 
                className="continue-button"
                onClick={handleSubmit}
                disabled={!alias.trim()}
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