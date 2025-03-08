import React, { useState, useEffect, useRef } from 'react';
import './EvidenceSelectionPage.scss';
import { EVIDENCE_ITEMS } from '../types/evidence';
import { updatePlayerEvidence } from '../services/api';

interface EvidenceSelectionPageProps {
  playerId: string;
}

interface EvidencePosition {
  offsetX: string;
  offsetY: string;
  rotation: number;
  scale: number;
}

export function EvidenceSelectionPage({ playerId }: EvidenceSelectionPageProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [evidencePositions, setEvidencePositions] = useState<Map<number, EvidencePosition>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  
  const resetState = () => {
    setSelectedEvidence([]);
    setIsCompleted(false);
    setError(null);
    initializePositions();
  };

  const initializePositions = () => {
    const newPositions = new Map<number, EvidencePosition>();

    EVIDENCE_ITEMS.forEach(item => {
      const offsetX = `${Math.random() * 40 - 20}px`;
      const offsetY = `${Math.random() * 40 - 20}px`;
      const rotation = Math.random() * 40 - 20;
      const scale = 0.85 + Math.random() * 0.3;

      newPositions.set(item.id, {
        offsetX,
        offsetY,
        rotation,
        scale
      });
    });

    setEvidencePositions(newPositions);
  };

  useEffect(() => {
    console.log('EvidenceSelectionPage received playerId:', playerId);
  }, [playerId]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    initializePositions();
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const handleContinue = async () => {
    if (selectedEvidence.length > 0) {
      setIsSubmitting(true);
      setError(null);
      console.log('Submitting evidence for player:', playerId);
      
      try {
        await updatePlayerEvidence(playerId, selectedEvidence);
        console.log('Evidence submitted successfully for player:', playerId);
        setIsCompleted(true);
        // Auto-reset after 5 seconds
        setTimeout(resetState, 5000);
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
  
  const renderSlots = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => {
      const slotNumber = start + i;
      const selectedItem = selectedEvidence[slotNumber - 1];
      const evidence = EVIDENCE_ITEMS.find(item => item.id === selectedItem);

      return (
        <div 
          key={slotNumber} 
          className={`evidence-slot ${evidence ? 'filled' : 'empty'}`}
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
      <div className="page-title">
        <img src={`${process.env.PUBLIC_URL}/breaking-news-logo.png`} alt="Breaking News" />
      </div>

      <div className="game-container">
        <div className="slots-container">
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
                >
                  <div 
                    className="evidence-wrapper"
                    style={{
                      '--offsetX': position.offsetX,
                      '--offsetY': position.offsetY,
                      '--rotation': `${position.rotation}deg`,
                      '--scale': position.scale
                    } as React.CSSProperties}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}/${item.image}`}
                      alt={item.name}
                    />
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>

        <div className="slots-container">
          {renderSlots(4, 6)}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button 
        className="continue-button"
        disabled={selectedEvidence.length === 0 || isSubmitting}
        onClick={handleContinue}
      >
        {isSubmitting ? 'Saving...' : 'Submit Evidence'}
      </button>

      {isCompleted && renderCompletionOverlay()}
    </div>
  );
} 