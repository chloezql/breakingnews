import React, { useState, useEffect, useRef, useCallback } from 'react';
import './EvidenceBoardIntroPage.scss';
import { EVIDENCE_ITEMS } from '../types/evidence';

interface EvidenceBoardIntroPageProps {
  onComplete: () => void;
  playerId: string | null;
}

function EvidenceBoardIntroPage({ onComplete, playerId }: EvidenceBoardIntroPageProps) {
  const [audioEnded, setAudioEnded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const talkingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation for the talking cop
  const startTalkingAnimation = useCallback(() => {
    if (talkingIntervalRef.current) return;
    
    // Toggle between arm up and arm down every 300ms to create talking effect
    let isArmUp = false;
    talkingIntervalRef.current = setInterval(() => {
      isArmUp = !isArmUp;
      setIsTalking(isArmUp);
    }, 500);
    
    // Initially set to talking state
    setIsTalking(true);
  }, []);
  
  const stopTalkingAnimation = useCallback(() => {
    if (talkingIntervalRef.current) {
      clearInterval(talkingIntervalRef.current);
      talkingIntervalRef.current = null;
    }
  }, []);
  
  // Handle audio ended event correctly
  const handleAudioEnded = useCallback(() => {
    console.log('Intro audio finished playing');
    setAudioEnded(true);
    stopTalkingAnimation();
  }, [stopTalkingAnimation]);
  
  // Use the autoplay approach since we've already had user interaction from the tutorial page
  useEffect(() => {
    let mounted = true;
    let audio: HTMLAudioElement | null = null;
    
    const setupAudio = () => {
      if (playerId && mounted) {
        // Create audio element
        audio = new Audio('/Station2_Tony_01.wav');
        audioRef.current = audio;
        
        // Set up event listener for when audio finishes playing
        const onEnded = () => {
          if (mounted) {
            handleAudioEnded();
          }
        };
        
        audio.addEventListener('ended', onEnded);
        
        // Start the talking animation when audio starts
        startTalkingAnimation();
        
        // Try to play the audio automatically
        audio.play()
          .then(() => {
            if (mounted) {
              console.log('Audio started playing successfully');
            }
          })
          .catch(error => {
            console.error('Error playing intro audio:', error);
            // If auto-play still fails, still allow progress
            if (mounted) {
              handleAudioEnded();
            }
          });
      }
    };
    
    // Small delay to ensure component is fully mounted before playing audio
    const timerId = setTimeout(setupAudio, 100);

    return () => {
      mounted = false;
      
      // Clean up audio
      if (audioRef.current) {
        const currentAudio = audioRef.current;
        currentAudio.pause();
        currentAudio.src = ''; // Empty source to fully unload
        currentAudio.load(); // Force reload to clear any resources
        audioRef.current = null;
      }
      
      // Clear any interval for the talking animation
      stopTalkingAnimation();
      
      // Clear the delayed setup
      clearTimeout(timerId);
    };
  }, [playerId, handleAudioEnded, startTalkingAnimation, stopTalkingAnimation]);

  // Auto advance after audio ends
  useEffect(() => {
    if (audioEnded) {
      const timer = setTimeout(() => {
        // Automatically go to the next stage after delay
        onComplete();
      }, 1000); // 5 second delay after audio ends
      
      return () => clearTimeout(timer);
    }
  }, [audioEnded, onComplete]);

  // Define suspects with their related evidence
  const suspects = [
    {
      id: 'kevin',
      name: 'Kevin Sanchez',
      image: '/character-photos/kevin.png',
      evidenceIds: [12, 13, 14, 15]
    },
    {
      id: 'dr-hart',
      name: 'Dr. Hart',
      image: '/character-photos/dr.hart.png',
      evidenceIds: [8, 9, 10, 11]
    },
    {
      id: 'lucy',
      name: 'Lucy Marlow',
      image: '/character-photos/lucy.png',
      evidenceIds: [16, 17, 18, 19]
    }
  ];

  // Render timeline
  const renderTimeline = () => (
    <div className="timeline-container">
      <div className="timeline-dates">
        <div className="timeline-date left">June 5</div>
        <div className="timeline-date right">June 6</div>
      </div>
      
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

  // Render victim connections
  const renderVictimConnections = () => (
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
            src="/character-photos/erin.png" 
            alt="Erin Carter" 
            className="victim-image"
          />
        </div>
      </div>
    </div>
  );

  // Render suspects
  const renderSuspects = () => (
    <div className="suspects-container">
      {suspects.map(suspect => (
        <div key={suspect.id} className="suspect-section">
          <div className="suspect-header">
            <img 
              src={suspect.image} 
              alt={suspect.name} 
              className="suspect-image"
            />
            <div className="suspect-name">{suspect.name}</div>
          </div>
          <div className="suspect-evidence">
            {EVIDENCE_ITEMS
              .filter(item => suspect.evidenceIds.includes(item.id))
              .map(evidence => (
                <div
                  key={evidence.id}
                  className="evidence-item"
                >
                  <img
                    src={`/${evidence.image}`}
                    alt={evidence.name}
                  />
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Render general evidence
  const renderGeneralEvidence = () => (
    <div className="general-evidence">
      {EVIDENCE_ITEMS
        .filter(item => item.id <= 7)
        .map(evidence => (
          <div
            key={evidence.id}
            className="evidence-item"
          >
            <img
              src={`/${evidence.image}`}
              alt={evidence.name}
            />
          </div>
        ))}
    </div>
  );

  if (!playerId) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="evidence-board-intro-page">
      {/* Breaking News Logo at the top */}
      <div 
        className="breaking-news-logo"
        style={{
          position: 'absolute',
          alignItems: 'center',
          width: 'auto',
          zIndex: 5,
          margin: 0
        }}
      >
        <img 
          src="/breaking-news-logo.png" 
          alt="Breaking News" 
          style={{
            maxWidth: '200px',
            height: 'auto'
          }}
        />
      </div>
      
      <div className="game-content">
        <div className="game-container">
          <div className="evidence-board">
            <div className="board-content">
              {/* Timeline */}
              {renderTimeline()}
              
              {/* Victim connections */}
              {renderVictimConnections()}
              
              {/* Suspects */}
              {renderSuspects()}
              
              {/* General evidence */}
              {renderGeneralEvidence()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Cop positioned at the bottom of the screen */}
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          width: '400px'
        }}
      >
        <img 
          src={isTalking ? "/police-arm-up.png" : "/police-arm-down.png"} 
          alt="Police Officer" 
          style={{
            maxHeight: '800px',
            width: 'auto',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))'
          }}
        />
      </div>

    </div>
  );
}

export default EvidenceBoardIntroPage; 