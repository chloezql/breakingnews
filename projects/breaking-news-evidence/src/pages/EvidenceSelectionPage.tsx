import React, { useState, useEffect, useRef, useCallback } from 'react';
import './EvidenceSelectionPage.scss';
import { EVIDENCE_ITEMS } from '../types/evidence';
import { updatePlayerEvidence } from '../services/api';

interface EvidencePosition {
  top: string;
  left: string;
  rotation: number;
  scale: number;
}

interface EvidenceSelectionPageProps {
  initialPlayerId?: string | null;
}

export function EvidenceSelectionPage({ initialPlayerId }: EvidenceSelectionPageProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [evidencePositions, setEvidencePositions] = useState<Map<number, EvidencePosition>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add timer state - 5 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState(50 * 60);
  const [timerStarted, setTimerStarted] = useState(false);
  
  // Player ID state - we now expect this to be passed from parent
  const [playerId, setPlayerId] = useState<string | null>(initialPlayerId || null);

  // Update playerId when initialPlayerId changes
  useEffect(() => {
    if (initialPlayerId) {
      setPlayerId(initialPlayerId);
      setTimerStarted(true);
    }
  }, [initialPlayerId]);
  
  // Timer countdown effect
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    
    if (timerStarted && timeRemaining > 0) {
      timerInterval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerStarted, timeRemaining]);
  
  // TODO: Implement what happens when timer reaches zero
  
  const resetAllState = () => {
    setSelectedEvidence([]);
    setIsCompleted(false);
    setError(null);
    setTimeRemaining(5 * 60);
    initializePositions();
  };

  const initializePositions = () => {
    const newPositions = new Map<number, EvidencePosition>();
    const centerX = 50;
    const centerY = 50;
    const radius = 40;
    
    // Create fixed positions in a circular pattern
    EVIDENCE_ITEMS.forEach((item, index) => {
      const angle = (index / EVIDENCE_ITEMS.length) * 2 * Math.PI;
      const adjustedRadius = radius * (0.8 + Math.random() * 0.4); // Slight randomness in radius
      
      // Calculate position using a mix of circular layout and some randomness
      const left = `${centerX + Math.cos(angle) * adjustedRadius * (0.8 + Math.random() * 0.4)}%`;
      const top = `${centerY + Math.sin(angle) * adjustedRadius * (0.8 + Math.random() * 0.4)}%`;
      
      const rotation = Math.random() * 40 - 20;
      const scale = 0.85 + Math.random() * 0.3;

      newPositions.set(item.id, {
        left,
        top,
        rotation,
        scale
      });
    });

    setEvidencePositions(newPositions);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    initializePositions();
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const handleContinue = async () => {
    if (selectedEvidence.length > 0 && playerId) {
      setIsSubmitting(true);
      setError(null);
      console.log('Submitting evidence for player:', playerId);
      
      try {
        await updatePlayerEvidence(playerId, selectedEvidence);
        console.log('Evidence submitted successfully for player:', playerId);
        setIsCompleted(true);
        setTimeout(resetAllState, 5000);
      } catch (err) {
        console.error('Failed to submit evidence for player:', playerId, err);
        setError('Failed to save your evidence selection. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const toggleEvidence = (id: number) => {
    if (selectedEvidence.includes(id)) {
      setSelectedEvidence(selectedEvidence.filter(item => item !== id));
    } else {
      if (selectedEvidence.length < 6) {
        setSelectedEvidence([...selectedEvidence, id]);
      }
    }
  };

  const renderCompletionOverlay = () => (
    <div className="overlay completion-overlay">
      <div className="overlay-content">
        <h2>Evidence Collected!</h2>
        <div className="evidence-summary">
          <h3>Selected Evidence:</h3>
          <ul>
            {EVIDENCE_ITEMS.filter(item => selectedEvidence.includes(item.id)).map(item => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </div>
        <p>Returning to selection in a few seconds...</p>
      </div>
    </div>
  );
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage for the timer bar
  const calculateProgress = () => {
    const totalTime = 5 * 60;
    return (timeRemaining / totalTime) * 100;
  };

  // Render evidence slots
  const renderSlots = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => {
      const slotNumber = start + i;
      const evidenceId = selectedEvidence[slotNumber - 1];
      const evidence = evidenceId ? EVIDENCE_ITEMS.find(item => item.id === evidenceId) : null;
      
      return (
        <div 
          key={slotNumber} 
          className={`selection-slot ${evidence ? 'filled' : 'empty'}`}
        >
          <div className="slot-number">{slotNumber}</div>
          {evidence && (
            <img 
              src={`${process.env.PUBLIC_URL}/${evidence.image}`}
              alt={evidence.name}
            />
          )}
        </div>
      );
    });
  };
  
  return (
    <div className="evidence-page">
      <div className="game-content">
        {/* Timer bar replaces the logo */}
        <div className="timer-container">
          <div className="timer-bar">
            <div 
              className="timer-progress" 
              style={{width: `${calculateProgress()}%`}}
            ></div>
          </div>
          <div className="timer-text">{formatTime(timeRemaining)}</div>
        </div>

        <div className="game-container">
          <div className="slots-container left-slots">
            {renderSlots(1, 3)}
          </div>

          <div className="evidence-board">
            <div 
              className="spotlight"
              style={{
                left: mousePosition.x,
                top: mousePosition.y,
              }}
            />
            
            <div className="evidence-container" ref={containerRef}>
              {EVIDENCE_ITEMS.map(item => {
                const position = evidencePositions.get(item.id);
                return position ? (
                  <div
                    key={item.id}
                    className={`evidence-item ${selectedEvidence.includes(item.id) ? 'selected' : ''}`}
                    onClick={() => toggleEvidence(item.id)}
                    style={{
                      position: 'absolute',
                      left: position.left,
                      top: position.top,
                    }}
                  >
                    <div 
                      className="evidence-wrapper"
                      style={{
                        transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
                      }}
                    >
                      <img
                        src={`${process.env.PUBLIC_URL}/${item.image}`}
                        alt={item.name}
                      />
                      {selectedEvidence.includes(item.id) && 
                        <div className="selected-indicator">✓</div>
                      }
                    </div>
                    <div className="evidence-description">
                      {item.hint}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <div className="slots-container right-slots">
            {renderSlots(4, 6)}
          </div>
        </div>
        
        {/* Confirmation button at the bottom */}
        <div className="confirm-button-container">
          <button 
            className="confirm-button"
            disabled={selectedEvidence.length === 0 || isSubmitting}
            onClick={handleContinue}
          >
            {selectedEvidence.length === 0 ? 'Select at least 1 evidence' : isSubmitting ? 'Collecting...' : 'Confirm Selection'} 
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {isCompleted && renderCompletionOverlay()}
      </div>
    </div>
  );
} 