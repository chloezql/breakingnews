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

// Categories for evidence by suspect
interface SuspectEvidence {
  id: string;
  name: string;
  image: string;
  evidenceIds: number[];
}

export function EvidenceSelectionPage({ initialPlayerId }: EvidenceSelectionPageProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [evidencePositions, setEvidencePositions] = useState<Map<number, EvidencePosition>>(new Map());
  const [zoomedEvidence, setZoomedEvidence] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add timer state - 5 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState(5 * 60);
  const [timerStarted, setTimerStarted] = useState(false);
  
  // Player ID state - we now expect this to be passed from parent
  const [playerId, setPlayerId] = useState<string | null>(initialPlayerId || null);

  // Define suspects with their related evidence
  const suspects: SuspectEvidence[] = [
    {
      id: 'kevin',
      name: 'Kevin Sanchez',
      image: '/character-photos/kevin.png',
      evidenceIds: [12, 13, 14, 15]  // IDs that correspond to Kevin's evidence
    },
    {
      id: 'dr-hart',
      name: 'Dr. Hart',
      image: '/character-photos/dr.hart.png',
      evidenceIds: [8, 9, 10, 11]  // IDs that correspond to Dr. Hart's evidence
    },
    {
      id: 'lucy',
      name: 'Lucy Marlow',
      image: '/character-photos/lucy.png',
      evidenceIds: [16, 17, 18, 19]  // IDs that correspond to Lucy's evidence
    }
  ];

  // Timeline events
  const timelineEvents = [
    {
      date: 'June 5',
      events: [
        { time: '3:30pm', description: 'Meet with Dr. Hart @Café' },
        { time: '7:10pm', description: 'Fight with Lucy @Erin\'s dorm' },
        { time: '9pm', description: 'Stayed with Kevin @Kevin\'s House' }
      ]
    },
    {
      date: 'June 6',
      events: [
        { time: '8am', description: 'Report Death' },
        { time: '10am', description: 'Exhibition Grand Opening @Museum' }
      ]
    }
  ];

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
  
  const resetAllState = () => {
    setSelectedEvidence([]);
    setIsCompleted(false);
    setError(null);
    setTimeRemaining(5 * 60);
    initializeEvidencePositions();
  };

  const initializeEvidencePositions = () => {
    const newPositions = new Map<number, EvidencePosition>();
    
    // Initialize positions without rotation
    EVIDENCE_ITEMS.forEach((item) => {
      newPositions.set(item.id, {
        left: '0',
        top: '0',
        rotation: 0, // No rotation
        scale: 1 // Consistent scale
      });
    });

    setEvidencePositions(newPositions);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    initializeEvidencePositions();
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

  // Render the timeline
  const renderTimeline = () => (
    <div className="timeline-container">
      {/* Date headers */}
      <div className="timeline-dates">
        <div className="timeline-date left">June 5</div>
        <div className="timeline-date right">June 6</div>
      </div>
      
      {/* Events list */}
      <div className="timeline-events-container">
        <div className="timeline-events">
          <div className="event-item">
            <div className="event-time">3:30pm Meet with Dr. Hart</div>
          </div>
          <div className="event-item">
            <div className="event-time">7:10pm Fight with Lucy</div>
          </div>
          <div className="event-item">
            <div className="event-time">9pm At Kevin's House</div>
          </div>
          <div className="event-item">
                <div className="event-time">8am Report Death</div>
          </div>
          <div className="event-item">
            <div className="event-time">10am Exhibition Opening</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render victim with connections to suspects
  const renderVictimWithConnections = () => (
    <div className="victim-connections">
      <svg className="connection-lines" width="100%" height="100%" viewBox="0 0 1400 300" preserveAspectRatio="none">
        <line className="connection-line" x1="700" y1="70" x2="250" y2="250" />
        <line className="connection-line" x1="700" y1="70" x2="700" y2="250" />
        <line className="connection-line" x1="700" y1="70" x2="1150" y2="250" />
      </svg>
      <div className="victims-section">
        <div className="victim-info">
          <div className="victim-name">Erin Carter</div>
          <div className="victim-tod">Time of Death: Between 12 AM - 1 AM on June 6th</div>
        </div>
        <div className="victim-center">
          <img 
            src={`${process.env.PUBLIC_URL}/character-photos/erin.png`} 
            alt="Erin Carter" 
            className="victim-image"
          />
          {/* <div className="victim-label">Erin Carter</div> */}
        </div>
      </div>
    </div>
  );

  // Handle evidence click for zoom
  const handleEvidenceZoom = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setZoomedEvidence(id === zoomedEvidence ? null : id);
  };

  // New function to render zoomed evidence view
  const renderZoomedEvidence = () => {
    if (zoomedEvidence === null) return null;
    
    const evidence = EVIDENCE_ITEMS.find(item => item.id === zoomedEvidence);
    if (!evidence) return null;
    
    return (
      <div className="zoomed-evidence-container">
        <div className="zoomed-evidence-content">
          <div className="zoomed-image-container">
            <img 
              src={`${process.env.PUBLIC_URL}/${evidence.image}`} 
              alt={evidence.name} 
              className="zoomed-image"
            />
            {selectedEvidence.includes(evidence.id) && 
              <div className="selected-indicator large">✓</div>
            }
          </div>
          <div className="zoomed-description">
            {evidence.hint}
          </div>
          <div className="zoomed-actions">
            <button 
              className={`select-btn ${selectedEvidence.includes(evidence.id) ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleEvidence(evidence.id);
              }}
            >
              {selectedEvidence.includes(evidence.id) ? 'Deselect' : 'Select Evidence'}
            </button>
            <button 
              className="close-btn"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedEvidence(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Updated render suspect evidence function
  const renderSuspect = (suspect: SuspectEvidence) => (
    <div key={suspect.id} className="suspect-section">
      <div className="suspect-header">
        <img 
          src={`${process.env.PUBLIC_URL}${suspect.image}`} 
          alt={suspect.name} 
          className="suspect-image"
        />
        <div className="suspect-name">{suspect.name}</div>
      </div>
      <div className="suspect-evidence">
        {EVIDENCE_ITEMS
          .filter(item => suspect.evidenceIds.includes(item.id))
          .map(evidence => {
            const position = evidencePositions.get(evidence.id);
            
            return position ? (
              <div
                key={evidence.id}
                className={`evidence-item ${selectedEvidence.includes(evidence.id) ? 'selected' : ''}`}
                onClick={(e) => handleEvidenceZoom(evidence.id, e)}
              >
                <div className="evidence-wrapper">
                  <img
                    src={`${process.env.PUBLIC_URL}/${evidence.image}`}
                    alt={evidence.name}
                  />
                  {selectedEvidence.includes(evidence.id) && 
                    <div className="selected-indicator">✓</div>
                  }
                </div>
                <div className="evidence-description">
                  {evidence.hint}
                </div>
              </div>
            ) : null;
          })}
      </div>
    </div>
  );

  // Updated render general evidence function
  const renderGeneralEvidence = () => (
    <div className="general-evidence">
      {EVIDENCE_ITEMS
        .filter(item => item.id <= 7) // First 7 items are general evidence
        .map(evidence => {
          const position = evidencePositions.get(evidence.id);
          
          return position ? (
            <div
              key={evidence.id}
              className={`evidence-item ${selectedEvidence.includes(evidence.id) ? 'selected' : ''}`}
              onClick={(e) => handleEvidenceZoom(evidence.id, e)}
            >
              <div className="evidence-wrapper">
                <img
                  src={`${process.env.PUBLIC_URL}/${evidence.image}`}
                  alt={evidence.name}
                />
                {selectedEvidence.includes(evidence.id) && 
                  <div className="selected-indicator">✓</div>
                }
              </div>
              <div className="evidence-description">
                {evidence.hint}
              </div>
            </div>
          ) : null;
        })}
    </div>
  );
  
  // Close zoomed view when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (zoomedEvidence !== null) {
        setZoomedEvidence(null);
      }
    };
    
    // Add event listener to document
    document.addEventListener('click', handleClickOutside);
    
    // Remove event listener on cleanup
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [zoomedEvidence]);
  
  return (
    <div className="evidence-page">
      <div className={`game-content ${zoomedEvidence ? 'blurred' : ''}`}>
        {/* Timer bar */}
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
              {/* Timeline */}
              {renderTimeline()}
              
              {/* Victim with connections to suspects (includes victim info) */}
              {renderVictimWithConnections()}
              
              {/* Suspect sections */}
              <div className="suspects-container">
                {suspects.map(suspect => renderSuspect(suspect))}
              </div>
              
              {/* General evidence */}
              {renderGeneralEvidence()}
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
      </div>
      
      {/* Semi-transparent overlay for when evidence is being viewed */}
      <div className={`evidence-overlay ${zoomedEvidence ? 'visible' : ''}`}></div>
      
      {/* Render zoomed evidence view */}
      {zoomedEvidence && renderZoomedEvidence()}
      
      {error && <div className="error-message">{error}</div>}
      {isCompleted && renderCompletionOverlay()}
    </div>
  );
} 