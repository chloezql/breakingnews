import React, { useState, useEffect, useRef } from 'react';
import './EvidenceSelectionPage.scss';
import { Evidence, EVIDENCE_ITEMS } from '../types/evidence';
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
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useEffect(() => {
    const positionEvidence = () => {
      const newPositions = new Map<number, EvidencePosition>();

      EVIDENCE_ITEMS.forEach(item => {
        // Random offset within grid cell (-20px to 20px)
        const offsetX = `${Math.random() * 40 - 20}px`;
        const offsetY = `${Math.random() * 40 - 20}px`;
        // Random rotation -20 to 20 degrees
        const rotation = Math.random() * 40 - 20;
        // Random scale 0.85 to 1.15
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

    positionEvidence();
    window.addEventListener('resize', positionEvidence);
    return () => window.removeEventListener('resize', positionEvidence);
  }, []);
  
  const toggleEvidence = (id: number) => {
    if (selectedEvidence.includes(id)) {
      setSelectedEvidence(selectedEvidence.filter(item => item !== id));
    } else {
      if (selectedEvidence.length < 6) {
        setSelectedEvidence([...selectedEvidence, id]);
      }
    }
  };
  
  const handleContinue = async () => {
    if (selectedEvidence.length > 0) {
      setIsSubmitting(true);
      setError(null);
      
      try {
        await updatePlayerEvidence(playerId, selectedEvidence);
        setIsCompleted(true);
      } catch (err) {
        setError('Failed to save your evidence selection. Please try again.');
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
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
  
  // Render completion screen if done
  if (isCompleted) {
    return (
      <div className="evidence-page">
        <div className="completion-container">
          <h1>Evidence Collection Complete!</h1>
          <p>Your evidence has been recorded for the investigation.</p>
          <div className="evidence-summary">
            <h3>You selected:</h3>
            <ul>
              {EVIDENCE_ITEMS.filter(item => selectedEvidence.includes(item.id)).map(item => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </div>
          <p className="next-steps">
            The next phase of the investigation will be available soon.
          </p>
        </div>
      </div>
    );
  }
  
  // Render evidence selection screen
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
        {isSubmitting ? 'Saving...' : 'Continue to Witness Selection'}
      </button>
    </div>
  );
} 