import React, { useState, useRef, useEffect } from 'react';
import { useGame } from './GameContext';
import './EvidenceSelectionPage.scss';
import { Evidence } from '../types/GameTypes';
import { AVAILABLE_EVIDENCE } from '../constants/evidence';

// Define a type for the evidence items from constants
interface AvailableEvidence {
  id: string;
  name: string;
  description: string;
}

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

  const toggleEvidence = (evidence: AvailableEvidence) => {
    handlePageInteraction(); // Stop intro audio when selecting evidence
    
    const currentSelection = gameState?.selectedEvidence || [];
    
    // Convert the evidence to match the Evidence type
    const evidenceItem: Evidence = {
      id: Number(evidence.id),
      name: evidence.name,
      description: evidence.description,
      image: '', // Default empty string since it's not in AVAILABLE_EVIDENCE
      type: 'document' // Default type since it's not in AVAILABLE_EVIDENCE
    };
    
    const isSelected = currentSelection.some(e => e.id === Number(evidence.id));
    
    if (!isSelected && currentSelection.length >= 4) {
      return;
    }
    
    const newSelection = isSelected 
      ? currentSelection.filter(e => e.id !== Number(evidence.id))
      : [...currentSelection, evidenceItem];
    
    updateGameState({ selectedEvidence: newSelection });
  };

  const canProceed = (gameState?.selectedEvidence?.length || 0) >= 1;

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
              gameState?.selectedEvidence?.some(e => e.id === Number(evidence.id)) ? 'selected' : ''
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