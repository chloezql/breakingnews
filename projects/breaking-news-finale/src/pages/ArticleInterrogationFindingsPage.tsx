import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { getSuspect } from '../types/suspects';
import { GameStage } from '../types/GameStages';
import './ArticleInterrogationFindingsPage.scss';

export function ArticleInterrogationFindingsPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  
  // Get the selected suspects from the game state
  const selectedSuspectIds = gameState?.selected_suspect || [];
  
  // Initialize findings state from game state or with empty values
  const [findings, setFindings] = useState<{[suspectId: string]: string}>(() => {
    return gameState?.article_interrogation_findings || {};
  });
  
  const [errors, setErrors] = useState<{[suspectId: string]: string}>({});
  const textareaRefs = useRef<{[suspectId: string]: HTMLTextAreaElement | null}>({});
  
  // Focus the first textarea when the component mounts
  useEffect(() => {
    if (selectedSuspectIds.length > 0) {
      const firstSuspectId = selectedSuspectIds[0].toString();
      if (textareaRefs.current[firstSuspectId]) {
        textareaRefs.current[firstSuspectId]?.focus();
      }
    }
  }, [selectedSuspectIds]);
  
  // Adjust textarea height based on content
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  
  // Handle input change for a specific suspect
  const handleInputChange = (suspectId: number, value: string) => {
    const suspectIdStr = suspectId.toString();
    
    // Update findings
    setFindings(prev => ({
      ...prev,
      [suspectIdStr]: value
    }));
    
    // Clear error when user types
    if (errors[suspectIdStr]) {
      setErrors(prev => ({
        ...prev,
        [suspectIdStr]: ''
      }));
    }
    
    // Adjust textarea height
    if (textareaRefs.current[suspectIdStr]) {
      adjustTextareaHeight(textareaRefs.current[suspectIdStr]!);
    }
    
    // Validate word count
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 30) {
      setErrors(prev => ({
        ...prev,
        [suspectIdStr]: 'Please keep your findings under 30 words'
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for errors
    const hasErrors = Object.values(errors).some(error => error);
    if (hasErrors) {
      return;
    }
    
    // Save to game state and move to next stage
    updateGameState({ 
      article_interrogation_findings: findings,
      currentStage: GameStage.REPORTER_INFO
    });
  };
  
  // Get word count for a specific suspect
  const getWordCount = (suspectId: number) => {
    const suspectIdStr = suspectId.toString();
    const text = findings[suspectIdStr] || '';
    return text.trim().split(/\s+/).filter(Boolean).length;
  };
  
  // If no suspects were interviewed, show a message and continue button
  if (selectedSuspectIds.length === 0) {
    return (
      <div data-component="ArticleInterrogationFindingsPage">
        <div className="window-container">
          <div className="window-title-bar">
            <div className="title-text">Breaking News - Article Creation (7/7)</div>
            <div className="window-controls">
              <button className="minimize-btn">_</button>
              <button className="maximize-btn">[]</button>
              <button className="close-btn">×</button>
            </div>
          </div>
          
          <div className="window-content">
            <div className="article-step-container">
              <h1>Interrogation Findings</h1>
              
              <div className="no-suspects-container">
                <p className="no-suspects-message">
                  You didn't interview any suspects, so there are no interrogation findings to report.
                </p>
                <button 
                  className="continue-button"
                  onClick={() => updateGameState({ currentStage: GameStage.REPORTER_INFO })}
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
  
  return (
    <div data-component="ArticleInterrogationFindingsPage">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Article Creation (7/7)</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="article-step-container">
            <h1>Notes from Suspect Interrogations</h1>
            
            <p className="instruction-text">
              During your interrogation with the suspects, what important findings did you discover?
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="suspects-findings-container">
                {selectedSuspectIds.map(suspectId => {
                  const suspect = getSuspect(suspectId);
                  if (!suspect) return null;
                  
                  const suspectIdStr = suspectId.toString();
                  
                  return (
                    <div key={suspectId} className="suspect-finding-item">
                      <div className="suspect-info">
                        <h3 className="suspect-name">{suspect.name}</h3>
                        <div className="suspect-image">
                          <img 
                            src={`/character-photos/${suspectId === 7298 ? 'dr.hart' : suspectId === 4692 ? 'kevin' : 'lucy'}.png`} 
                            alt={suspect.name} 
                          />
                        </div>
                      </div>
                      
                      <div className="finding-input-container">
                        <textarea
                          ref={el => textareaRefs.current[suspectIdStr] = el}
                          value={findings[suspectIdStr] || ''}
                          onChange={e => handleInputChange(suspectId, e.target.value)}
                          placeholder={`What did you learn from ${suspect.name}?`}
                          rows={2}
                          className={`finding-textarea ${errors[suspectIdStr] ? 'error' : ''}`}
                        />
                        
                        {errors[suspectIdStr] && (
                          <p className="error-message">{errors[suspectIdStr]}</p>
                        )}
                        
                        <div className="word-count">
                          {getWordCount(suspectId)}/30 words
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button 
                type="submit"
                className="continue-button"
                disabled={Object.values(errors).some(error => error)}
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