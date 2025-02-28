import React, { useState, useRef, useEffect } from 'react';
import { useGame } from './GameContext';
import './EvidenceSelectionPage.scss';
import { Evidence } from '../types/GameTypes';
import { AVAILABLE_EVIDENCE } from '../constants/evidence';

export function EvidenceSelectionPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const introAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Play intro audio when component mounts
    if (introAudioRef.current) {
      introAudioRef.current.play();
    }
  }, []);

  const handlePageInteraction = () => {
    // Stop intro audio on any interaction
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current.currentTime = 0;
    }
  };

  const toggleEvidence = (evidence: Evidence) => {
    handlePageInteraction(); // Stop intro audio when selecting evidence
    
    const currentSelection = gameState.selectedEvidence;
    const isSelected = currentSelection.some(e => e.id === evidence.id);
    
    if (!isSelected && currentSelection.length >= 4) {
      return;
    }
    
    const newSelection = isSelected 
      ? currentSelection.filter(e => e.id !== evidence.id)
      : [...currentSelection, evidence];
    
    updateGameState({ selectedEvidence: newSelection });
  };

  const canProceed = gameState.selectedEvidence.length >= 1;

  return (
    <div className="evidence-page" onClick={handlePageInteraction}>
      <div className="logo-container">
        <img 
          src="./breaking-news-logo.png" 
          alt="Breaking News" 
        />
      </div>

      <h1>Select Evidence (3-4 pieces)</h1>
      
      <div className="evidence-grid">
        {AVAILABLE_EVIDENCE.map(evidence => (
          <div 
            key={evidence.id}
            className={`evidence-item ${
              gameState.selectedEvidence.some(e => e.id === evidence.id) ? 'selected' : ''
            }`}
            onClick={() => toggleEvidence(evidence)}
          >
            <h3>{evidence.name}</h3>
            <p>{evidence.description}</p>
          </div>
        ))}
      </div>

      <button 
        className="next-button"
        onClick={moveToNextStage}
        disabled={!canProceed}
      >
        <div className="next-text">Next</div>
      </button>

      <audio 
        ref={introAudioRef}
        src="./audio/evidence_intro.mp3"
      />
    </div>
  );
} 