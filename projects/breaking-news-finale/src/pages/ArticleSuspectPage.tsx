import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { suspects } from '../types/suspects';
import './ArticleSuspectPage.scss';

// Define the suspect interface
interface Suspect {
  id: string;
  name: string;
  image: string;
}

export function ArticleSuspectPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  
  // Define the suspects using data from suspects.ts
  const suspectsList: Suspect[] = [
    { id: "7298", name: 'Dr. Eleanor Hart', image: '/character-photos/dr.hart.png' },
    { id: "4692", name: 'Kevin Sanchez', image: '/character-photos/kevin.png' },
    { id: "5746", name: 'Lucy Marlow', image: '/character-photos/lucy.png' }
  ];
  
  // Get the initial selected suspects from the game state or use an empty array
  const [selectedSuspects, setSelectedSuspects] = useState<string[]>(
    gameState?.article_suspect_ids?.map(id => String(id)) || []
  );
  
  const [error, setError] = useState('');
  
  // Handle suspect selection
  const toggleSuspect = (suspectId: string) => {
    setSelectedSuspects(prev => {
      // If the suspect is already selected, remove them
      if (prev.includes(suspectId)) {
        return prev.filter(id => id !== suspectId);
      }
      // Otherwise, add them to the selection
      return [...prev, suspectId];
    });
    
    // Clear any error when a selection is made
    if (error) setError('');
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one suspect is selected
    if (selectedSuspects.length === 0) {
      setError('Please select at least one suspect');
      return;
    }
    
    // Save to game state and move to next stage
    // Convert string IDs to numbers for compatibility with existing code
    updateGameState({ article_suspect_ids: selectedSuspects.map(id => Number(id)) });
    moveToNextStage();
  };
  
  return (
    <div data-component="ArticleSuspectPage">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Article Creation (2/7)</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="article-step-container">
            <h1>Suspicious Characters</h1>
            
            <form onSubmit={handleSubmit}>
              <div className="prompt-container">
                <p className="prompt-text">
                  I think the following people look suspicious:
                </p>
                
                <div className="suspects-container">
                  {suspectsList.map(suspect => (
                    <div 
                      key={suspect.id}
                      className={`suspect-card ${selectedSuspects.includes(suspect.id) ? 'selected' : ''}`}
                      onClick={() => toggleSuspect(suspect.id)}
                    >
                      <div className="suspect-image">
                        <img src={suspect.image} alt={suspect.name} />
                        {selectedSuspects.includes(suspect.id) && (
                          <div className="selected-overlay">
                            <span className="checkmark">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="suspect-name">{suspect.name}</div>
                    </div>
                  ))}
                </div>
                
                {error && <p className="error-message">{error}</p>}
                
                <p className="selection-hint">
                  {selectedSuspects.length === 0 
                    ? 'Click on a suspect to select them' 
                    : `Selected: ${selectedSuspects.length} suspect${selectedSuspects.length > 1 ? 's' : ''}`}
                </p>
              </div>
              
              <button 
                type="submit"
                className="continue-button"
                disabled={selectedSuspects.length === 0}
              >
                Continue
              </button>
            </form>
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