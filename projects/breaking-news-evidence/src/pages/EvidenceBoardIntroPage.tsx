import React, { useState, useEffect, useRef, useCallback } from 'react';
import './EvidenceBoardIntroPage.scss';
import { findPlayerByCardId } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

interface EvidenceBoardIntroPageProps {
  playerId: string | null;
  onComplete: () => void;
  onLogin: (id: string) => void;
}

export function EvidenceBoardIntroPage({ playerId, onComplete, onLogin }: EvidenceBoardIntroPageProps) {
  const [audioEnded, setAudioEnded] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  
  // Login state
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [idScanned, setIdScanned] = useState(!!playerId);

  // Handle WebSocket messages for RFID scan
  const handleWebSocketMessage = useCallback(async (data: any) => {
    if (data.type === 'rfid_scan' && !currentPlayerId) {
      console.log('RFID card scanned:', data.cardId);
      setLastCardId(data.cardId);
      setLoginError(null);
      setIsLoading(true);
      
      try {
        const playerData = await findPlayerByCardId(data.cardId);
        console.log('Player data received:', playerData);
        if (playerData && playerData[0]?.id) {
          const newPlayerId = playerData[0].id;
          setCurrentPlayerId(newPlayerId);
          setIdScanned(true);
          console.log('Setting player ID:', newPlayerId);
          
          // Call onLogin callback to update parent component
          onLogin(newPlayerId);
          
          // Don't auto-play audio - wait for user interaction
          // Instead, prepare the audio element
          playIntroAudio();
        //   prepareAudio();
        } else {
          console.log('No valid player data received');
          setLoginError('No player found for this card');
        }
      } catch (err) {
        setLoginError('Error finding player');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentPlayerId, onLogin]);

  const handleWebSocketConnect = useCallback(() => {
    setWsConnected(true);
  }, []);

  const handleWebSocketDisconnect = useCallback(() => {
    setWsConnected(false);
  }, []);

  useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: handleWebSocketConnect,
    onDisconnect: handleWebSocketDisconnect,
  });

  // Prepare audio element but don't play it yet
  const playIntroAudio = () => {
    // Create audio element
    const audio = new Audio('/Station2_Tony_01.wav');
    audioRef.current = audio;
    
    // // Set up event listener for when audio finishes playing
    // audio.addEventListener('ended', () => {
    //   console.log('Intro audio finished playing');
    //   setAudioEnded(true);
    // });

        
    // Play audio
    audio.play().catch(error => {
        console.error('Error playing intro audio:', error);
        // If audio fails to play, still allow progress
        setAudioEnded(true);
      });
  
  };
  
  // Start playing audio on user interaction
  const startAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setAudioStarted(true);
          console.log('Audio started playing successfully');
        })
        .catch(error => {
          console.error('Error playing intro audio:', error);
          // If audio fails to play, still allow progress
          setAudioEnded(true);
        });
    } else {
      // If no audio element exists yet, create one and play it
      const audio = new Audio('/Station2_Tony_01.wav');
      audioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        console.log('Intro audio finished playing');
        setAudioEnded(true);
      });
      
      audio.play()
        .then(() => {
          setAudioStarted(true);
          console.log('Audio started playing successfully');
        })
        .catch(error => {
          console.error('Error playing intro audio:', error);
          setAudioEnded(true);
        });
    }
  };

  // Cleanup when component unmounts
  useEffect(() => {
    if (playerId) {
      setCurrentPlayerId(playerId);
      setIdScanned(true);
      // Just prepare the audio but don't play
      playIntroAudio();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', () => setAudioEnded(true));
      }
    };
  }, []);

  // Update current player ID when prop changes
  useEffect(() => {
    console.log('playerId', playerId);
    console.log('currentPlayerId', currentPlayerId);
    if (playerId && !currentPlayerId) {
      setCurrentPlayerId(playerId);
      setIdScanned(true);
      // Just prepare the audio but don't play
      playIntroAudio();
    }
  }, [playerId, currentPlayerId]);

  // Auto advance after audio ends
  useEffect(() => {
    if (audioEnded) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000); // Small delay after audio ends
      
      return () => clearTimeout(timer);
    }
  }, [audioEnded, onComplete]);

  // Render login overlay for ID scan
  const renderLoginOverlay = () => (
    <div className="login-overlay">
      <div className="login-card">
        <h2>SCAN YOUR ID CARD</h2>
        {isLoading && <div className="loading">CHECKING CARD...</div>}
        {loginError && <div className="error">{loginError}</div>}
      </div>
    </div>
  );

  return (
    <div className="evidence-board-intro-page">
      <div className={`game-content ${!idScanned ? 'blurred' : ''}`}>
        <div className="page-header">
          <h1>Evidence Board</h1>
        </div>
        
        <div className="game-container">
          <div className="evidence-board">
            {idScanned && (
              <div className="cop-container">
                <img src="/police-officer.png" alt="Police Officer" className="cop-image" />
              </div>
            )}
            
            <div className="board-content">
              <div className="board-message">
                EMPTY BOARD
              </div>
            </div>
          </div>
        </div>
        
        {idScanned && !audioStarted && (
          <button className="start-button" onClick={startAudio}>
            Start Briefing
          </button>
        )}
        
        {audioEnded && idScanned && (
          <button className="continue-button" onClick={onComplete}>
            Continue
          </button>
        )}
      </div>
      
      {!idScanned && renderLoginOverlay()}
    </div>
  );
} 