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
  onEvidenceConfirm?: (timedOut?: boolean, hadEvidence?: boolean) => void;
}

// Categories for evidence by suspect
interface SuspectEvidence {
  id: string;
  name: string;
  image: string;
  evidenceIds: number[];
}

export function EvidenceSelectionPage({ initialPlayerId, onEvidenceConfirm }: EvidenceSelectionPageProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [evidencePositions, setEvidencePositions] = useState<Map<number, EvidencePosition>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add timer state - 5 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState(5 * 60);
  const [timerStarted, setTimerStarted] = useState(false);
  
  // Player ID state - we now expect this to be passed from parent
  const [playerId, setPlayerId] = useState<string | null>(initialPlayerId || null);

  const [isTimedOut, setIsTimedOut] = useState(false);
  const [guardAudioPlayed, setGuardAudioPlayed] = useState(false);

  // Add BGM audio ref
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Define suspects with their related evidence
  const suspects: SuspectEvidence[] = [
    {
      id: 'kevin',
      name: 'Kevin Sanchez: the boyfriend',
      image: '/character-photos/kevin.png',
      evidenceIds: [12, 13, 14, 15]  // IDs that correspond to Kevin's evidence
    },
    {
      id: 'dr-hart',
      name: 'Dr. Hart: the mentor',
      image: '/character-photos/dr.hart.png',
      evidenceIds: [8, 9, 10, 11]  // IDs that correspond to Dr. Hart's evidence
    },
    {
      id: 'lucy',
      name: 'Lucy Marlow: the roommate',
      image: '/character-photos/lucy.png',
      evidenceIds: [16, 17, 18, 19]  // IDs that correspond to Lucy's evidence
    }
  ];

  // Timeline events
  const timelineEvents = [
    {
      date: 'June 5',
      events: [
        { time: 'early afternoon', description: 'Meet with Dr. Hart @Café' },
        { time: 'evening', description: 'Fight with Lucy @Erin\'s dorm' },
        { time: 'late night', description: 'Stayed with Kevin @Kevin\'s House' }
      ]
    },
    {
      date: 'June 6',
      events: [
        { time: '8am', description: 'Report Death' },
        { time: '10am', description: 'Exhibition Grand Opening @ MiamiMuseum' }
      ]
    }
  ];

  // Update playerId when initialPlayerId changes
  useEffect(() => {
    if (initialPlayerId) {
      setPlayerId(initialPlayerId);
      setTimerStarted(true);
      
      // Start playing BGM
      if (!bgmRef.current) {
        bgmRef.current = new Audio(`${process.env.PUBLIC_URL}/evidence-selection-bgm.wav`);
        bgmRef.current.loop = true; // Loop the BGM
        bgmRef.current.volume = 0.3; // Set volume to 30%
        bgmRef.current.play().catch(error => {
          console.error('Error playing BGM:', error);
        });
      }
    }
  }, [initialPlayerId]);
  
  // Timer countdown effect
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    
    if (timerStarted && timeRemaining > 0) {
      timerInterval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0 && !isTimedOut) {
            setIsTimedOut(true);
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerStarted, timeRemaining, isTimedOut]);

  // Clean up BGM when component unmounts or timer ends
  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  // Stop BGM when timer runs out
  useEffect(() => {
    if (isTimedOut && bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current = null;
    }
  }, [isTimedOut]);

  // Add helper function to get random evidence
  const getRandomEvidence = () => {
    // Get all available evidence IDs
    const allEvidenceIds = EVIDENCE_ITEMS.map(item => item.id);
    // Shuffle array
    const shuffled = [...allEvidenceIds].sort(() => Math.random() - 0.5);
    // Take first 6 items
    return shuffled.slice(0, 6);
  };

  // Handle timeout effect
  useEffect(() => {
    if (isTimedOut && !guardAudioPlayed) {
      const audio = new Audio(`${process.env.PUBLIC_URL}/Station2_Guard_01.wav`);
      
      const handleAudioEnd = async () => {
        setGuardAudioPlayed(true);
        
        if (playerId) {
          try {
            // If no evidence selected, randomly pick 6
            const evidenceToSubmit = selectedEvidence.length > 0 
              ? selectedEvidence 
              : getRandomEvidence();
            
            console.log('Submitting evidence on timeout for player:', playerId, 
                      selectedEvidence.length === 0 ? '(randomly selected)' : '(player selected)');
            
            await updatePlayerEvidence(playerId, evidenceToSubmit);
            console.log('Evidence submitted successfully on timeout');
          } catch (err) {
            console.error('Failed to submit evidence on timeout:', err);
          }
        }

        if (onEvidenceConfirm) {
          // Pass both timeout status and whether player had selected any evidence
          onEvidenceConfirm(true, selectedEvidence.length > 0);
        }
      };

      audio.addEventListener('ended', handleAudioEnd);
      
      audio.play().catch(error => {
        console.error('Error playing guard audio:', error);
        handleAudioEnd(); // Still proceed if audio fails
      });

      return () => {
        audio.removeEventListener('ended', handleAudioEnd);
        audio.pause();
      };
    }
  }, [isTimedOut, guardAudioPlayed, onEvidenceConfirm, selectedEvidence, playerId]);

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
        
        if (onEvidenceConfirm) {
          onEvidenceConfirm(false, true); // Not timed out, had evidence
        } else {
          setIsCompleted(true);
          setTimeout(resetAllState, 5000);
        }
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
            <div className="event-time">2PM: Meet with Dr. Hart</div>
          </div>
          <div className="event-item">
            <div className="event-time">7PM: Stayed in Dorm with Lucy</div>
          </div>
          <div className="event-item">
            <div className="event-time">9PM: At Kevin's House</div>
          </div>
          <div className="event-item">
            <div className="event-time">8AM: Report Death</div>
          </div>
          <div className="event-item">
            <div className="event-time">10AM: Exhibition Opening</div>
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
                onClick={() => toggleEvidence(evidence.id)}
              >
                <div className="evidence-wrapper">
                  <img
                    src={`${process.env.PUBLIC_URL}/${evidence.image}`}
                    alt={evidence.name}
                  />
                  {selectedEvidence.includes(evidence.id) && 
                    <div className="selected-indicator">✓</div>
                  }
                  <div className="evidence-description">
                    {evidence.description}
                  </div>
                </div>
              </div>
            ) : null;
          })}
      </div>
    </div>
  );

  // Updated render general evidence function
  const renderGeneralEvidence = () => (
    <div className="general-evidence-section">
      <div className="general-evidence">
        <div className="section-label">Public Evidence</div>
        {EVIDENCE_ITEMS
          .filter(item => item.id <= 7) // First 7 items are general evidence
          .map(evidence => {
            const position = evidencePositions.get(evidence.id);
            
            return position ? (
              <div
                key={evidence.id}
                className={`evidence-item ${selectedEvidence.includes(evidence.id) ? 'selected' : ''}`}
                onClick={() => toggleEvidence(evidence.id)}
              >
                <div className="evidence-wrapper">
                  <img
                    src={`${process.env.PUBLIC_URL}/${evidence.image}`}
                    alt={evidence.name}
                  />
                  {selectedEvidence.includes(evidence.id) && 
                    <div className="selected-indicator">✓</div>
                  }
                  <div className="evidence-description">
                    {evidence.description}
                  </div>
                </div>
              </div>
            ) : null;
          })}
      </div>
    </div>
  );

  // Render timeout overlay
  const renderTimeoutOverlay = () => (
    <div className="timeout-overlay">
      <div className="guard-container">
        <img 
          src={`/placeholder-guard.png`}
          alt="Security Guard"
          className="guard-image"
        />
      </div>
    </div>
  );

  return (
    <div className="evidence-page">
      <div className="game-content">
        {/* Timer bar */}
        <div className="timer-container">
          <div className="timer-bar">
            <div 
              className={`timer-progress ${timeRemaining < 30 ? 'warning' : ''}`}
              style={{width: `${calculateProgress()}%`}}
            ></div>
          </div>
          <div className="timer-text">{formatTime(timeRemaining)}</div>
        </div>

        <div className={`game-container ${isTimedOut ? 'disabled' : ''}`}>
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
            disabled={selectedEvidence.length === 0 || isSubmitting || isTimedOut}
            onClick={handleContinue}
          >
            {selectedEvidence.length === 0 ? 'Select at least 1 evidence' : 
             isSubmitting ? 'Collecting...' : 
             isTimedOut ? 'Time\'s up!' : 'Confirm Selection'} 
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {isCompleted && renderCompletionOverlay()}
      {isTimedOut && renderTimeoutOverlay()}
    </div>
  );
} 