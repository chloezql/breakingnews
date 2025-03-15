import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { EVIDENCE_ITEMS } from '../constants/evidence';
import './ArticleEvidencePage.scss';

export function ArticleEvidencePage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  
  // Get the collected evidence from the game state
  const collectedEvidenceIds = gameState?.evidence_list || [];
  
  // Get the initially selected evidence from the game state or use an empty array
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<number[]>(
    gameState?.article_evidence_ids || []
  );
  
  const [error, setError] = useState('');
  
  // Filter the evidence items to only show collected evidence
  const availableEvidence = EVIDENCE_ITEMS.filter(item => 
    collectedEvidenceIds.includes(item.id)
  );
  
  // Handle evidence selection
  const toggleEvidence = (evidenceId: number) => {
    setSelectedEvidenceIds(prev => {
      // If the evidence is already selected, remove it
      if (prev.includes(evidenceId)) {
        return prev.filter(id => id !== evidenceId);
      }
      // Otherwise, add it to the selection
      return [...prev, evidenceId];
    });
    
    // Clear any error when a selection is made
    if (error) setError('');
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one piece of evidence is selected
    if (selectedEvidenceIds.length === 0) {
      setError('Please select at least one piece of evidence');
      return;
    }
    
    // Save to game state and move to next stage
    updateGameState({ article_evidence_ids: selectedEvidenceIds });
    moveToNextStage();
  };
  
  return (
    <div data-component="ArticleEvidencePage">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Article Creation (5/7)</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="article-step-container">
            <h1>Supporting Evidence</h1>
            
            <form onSubmit={handleSubmit}>
              <div className="prompt-container">
                <p className="prompt-text">
                  To make my story more convincing, I will include the following photos:
                </p>
                
                <div className="evidence-container">
                  {availableEvidence.map(evidence => (
                    <div 
                      key={evidence.id}
                      className={`evidence-card ${selectedEvidenceIds.includes(evidence.id) ? 'selected' : ''}`}
                      onClick={() => toggleEvidence(evidence.id)}
                      title={evidence.description}
                    >
                      <div className="evidence-image">
                        <img src={`/images/evidence/${evidence.image}`} alt={evidence.name} />
                        {selectedEvidenceIds.includes(evidence.id) && (
                          <div className="selected-overlay">
                            <span className="checkmark">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="evidence-details">
                        <h3 className="evidence-name">{evidence.name}</h3>
                        <p className="evidence-type">{evidence.type}</p>
                        <div className="evidence-description">{evidence.description.substring(0, 60)}{evidence.description.length > 60 ? '...' : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {error && <p className="error-message">{error}</p>}
                
                <p className="selection-hint">
                  {selectedEvidenceIds.length === 0 
                    ? 'Click on evidence to select it' 
                    : `Selected: ${selectedEvidenceIds.length} piece${selectedEvidenceIds.length > 1 ? 's' : ''} of evidence`}
                </p>
              </div>
              
              <button 
                type="submit"
                className="continue-button"
                disabled={selectedEvidenceIds.length === 0}
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