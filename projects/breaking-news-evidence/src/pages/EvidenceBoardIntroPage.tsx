import React, { useState, useEffect, useRef, useCallback } from 'react';
import './EvidenceBoardIntroPage.scss';

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
    }, 1000);
    
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
        onComplete();
      }, 1000); // Small delay after audio ends
      
      return () => clearTimeout(timer);
    }
  }, [audioEnded, onComplete]);

  if (!playerId) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="evidence-board-intro-page">
      <div className="game-content">
        <div className="game-container">
          <div className="evidence-board">
            <div className="cop-container">
              <img 
                src={isTalking ? "/police-arm-up.png" : "/police-arm-down.png"} 
                alt="Police Officer" 
                className="cop-image" 
              />
            </div>
            
            <div className="board-content">
              <div className="board-message">
                EMPTY BOARD
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EvidenceBoardIntroPage; 