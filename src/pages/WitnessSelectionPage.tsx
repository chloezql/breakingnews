import React, { useState, useRef, useEffect } from 'react';
import { useGame } from './GameContext';
import { AVAILABLE_WITNESSES } from '../constants/evidence';  
import './WitnessSelectionPage.scss';
import { Witness } from '../types/GameTypes';

export function WitnessSelectionPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const introAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Play intro audio when component mounts
    if (introAudioRef.current) {
      introAudioRef.current.play();
    }
  }, []);

  const playTestimony = (witnessId: string) => {
    // Stop intro audio if it's playing
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current.currentTime = 0;
    }

    const witness = AVAILABLE_WITNESSES.find(w => w.id === witnessId);
    if (!witness) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = witness.audio;
      audioRef.current.play();
      setCurrentlyPlaying(witnessId);
    }
  };

  const handlePageInteraction = () => {
    // Stop intro audio on any interaction
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current.currentTime = 0;
    }
  };

  const toggleWitness = (witness: Witness) => {
    const currentSelection = gameState.selectedWitnesses;
    const isSelected = currentSelection.some(w => w.id === witness.id);
    
    // If this witness is already selected, allow deselecting
    // If no witness is selected, allow selecting
    // If another witness is selected, replace it
    const newSelection = isSelected 
      ? [] // Deselect if already selected
      : [witness]; // Select only this witness
    
    updateGameState({ selectedWitnesses: newSelection });
  };

  const canProceed = gameState.selectedWitnesses.length >= 1;

  return (
    <div className="witness-page" onClick={handlePageInteraction}>
      <div className="logo-container">
        <img 
          src="./breaking-news-logo.png" 
          alt="Breaking News" 
        />
      </div>

      <h1>Select one Witness </h1>
      
      <div className="witness-grid">
        {AVAILABLE_WITNESSES.map(witness => (
          <div 
            key={witness.id}
            className={`witness-item ${
              gameState.selectedWitnesses.some(w => w.id === witness.id) ? 'selected' : ''
            } ${currentlyPlaying === witness.id ? 'playing' : ''}`}
          >
            <img 
              src={witness.image} 
              alt={witness.name}
              onClick={() => playTestimony(witness.id)}
            />
            <button
              className="select-button"
              onClick={() => toggleWitness(witness)}
            >
              {gameState.selectedWitnesses.some(w => w.id === witness.id) ? 'Selected' : 'Select'}
            </button>
          </div>
        ))}
      </div>

      <audio 
        ref={audioRef}
        onEnded={() => setCurrentlyPlaying(null)}
      />
      <audio 
        ref={introAudioRef}
        src="./audio/witness_intro.mp3"
      />

      <button 
        className="next-button"
        onClick={moveToNextStage}
        disabled={!canProceed}
      >
        <div className="next-text">Next</div>
      </button>
    </div>
  );
} 