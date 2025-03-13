import React, { useState, useEffect, useRef, useCallback } from 'react';
import './EvidenceTutorialPage.scss';
import { findPlayerByCardId } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

interface EvidenceTutorialPageProps {
  onComplete: () => void;
  onLogin: (playerId: string) => void;
}

export function EvidenceTutorialPage({ onComplete, onLogin }: EvidenceTutorialPageProps) {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [idScanned, setIdScanned] = useState(false);
  const [selectedItem, setSelectedItem] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [completedSteps, setCompletedSteps] = useState({
    select: false,
    confirm: false
  });

  // Add ref for cursor spotlight
  const cursorSpotlightRef = useRef<HTMLDivElement>(null);
  
  // Add effect to handle mouse movement for cursor spotlight
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      if (cursorSpotlightRef.current) {
        cursorSpotlightRef.current.style.left = `${e.clientX}px`;
        cursorSpotlightRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Handle WebSocket messages for RFID scan
  const handleWebSocketMessage = useCallback(async (data: any) => {
    if (data.type === 'rfid_scan' && !playerId) {
      console.log('RFID card scanned:', data.cardId);
      setLastCardId(data.cardId);
      setLoginError(null);
      setIsLoading(true);
      
      try {
        const playerData = await findPlayerByCardId(data.cardId);
        console.log('Player data received:', playerData);
        if (playerData && playerData[0]?.id) {
          const newPlayerId = playerData[0].id;
          setPlayerId(newPlayerId);
          setIdScanned(true);
          console.log('Setting player ID:', newPlayerId);
          
          // Call onLogin callback to update parent component
          onLogin(newPlayerId);
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
  }, [playerId, onLogin]);

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

  // Timer to show hint if user doesn't interact
  useEffect(() => {
    if (idScanned && !selectedItem) {
      const timer = setTimeout(() => {
        // Add hint animation if needed
      }, 10000); // Show hint after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [idScanned, selectedItem]);

  // Add a new state to control cop visibility
  const [showCop, setShowCop] = useState(false);

  // Update the useEffect that handles ID scanning to show the cop after a delay
  useEffect(() => {
    if (idScanned) {
      // Show the cop after a short delay to prevent transition issues
      const timer = setTimeout(() => {
        setShowCop(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [idScanned]);

  const handleItemClick = () => {
    // Toggle selection
    const newSelectedState = !selectedItem;
    setSelectedItem(newSelectedState);
    
    // Update completedSteps based on the new selection state
    setCompletedSteps(prev => ({ 
      ...prev, 
      select: newSelectedState,
      // If deselecting, also clear the confirm step
      confirm: newSelectedState ? prev.confirm : false
    }));
  };

  const handleConfirmClick = () => {
    if (selectedItem) {
      setCompletedSteps(prev => ({ ...prev, confirm: true }));
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  // Render login overlay for ID scan
  const renderLoginOverlay = () => (
    <div className="login-overlay">
      <div className="login-card">
        <h2>SCAN YOUR ID CARD TO START</h2>
        {isLoading && <div className="loading">CHECKING CARD...</div>}
        {loginError && <div className="error">{loginError}</div>}
      </div>
    </div>
  );

  return (
    <div className="evidence-tutorial-page">
      {/* Add cursor spotlight div */}
      <div 
        ref={cursorSpotlightRef} 
        className="cursor-spotlight"
        style={{
          left: mousePosition.x,
          top: mousePosition.y
        }}
      />
      
      <div className={`game-content ${!idScanned ? 'blurred' : ''}`}>
        <div className="page-header">
          <h1 className="pixelated-text">EVIDENCE BOARD - TUTORIAL</h1>
        </div>
        
        <div className="game-container">
          <div className="evidence-board">
            <div className="board-content">
              {idScanned && (
                <div 
                  className={`tutorial-item ${selectedItem ? 'selected' : ''}`}
                  onClick={handleItemClick}
                >
                  <img src="/tutorial-evidence.png" alt="Tutorial Evidence" />
                  {selectedItem && <div className="selected-indicator">✓</div>}
                  <div className="evidence-description">
                    This key evidence might help solve the case.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {idScanned && (
          <div className="intro-gif">
            <img src="/speed-up-tutorial.gif" alt="Intro GIF" />
          </div>
        )}

        {/* Only render the cop when showCop is true */}
        {showCop && (
          <div 
            className="cop-container-static" 
            style={{
              position: 'fixed',
              bottom: 0,
              left: '10%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              width: '400px',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <img 
              src="/police-arm-up.png" 
              alt="Police Officer" 
              style={{
                maxHeight: '800px',
                width: 'auto',
                height: 'auto',
                display: 'block',
                filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))'
              }}
            />
            
            {/* Speech bubble with inline styles */}
            <div 
              style={{
                backgroundColor: 'white',
                color: '#333',
                padding: '15px 20px',
                borderRadius: '10px',
                position: 'absolute',
                top: '100px',
                right: '-220px',
                width: '300px',
                boxShadow: '0 3px 15px rgba(0, 0, 0, 0.2)',
                zIndex: 11,
                textAlign: 'left'
              }}
            >
              {/* Speech bubble arrow */}
              <div 
                style={{
                  position: 'absolute',
                  left: '-15px',
                  top: '30px',
                  width: 0,
                  height: 0,
                  borderTop: '15px solid transparent',
                  borderRight: '15px solid white',
                  borderBottom: '15px solid transparent'
                }}
              ></div>
              
              {!completedSteps.select && (
                <>
                  <h3 style={{ marginTop: 0, color: '#dc3545', fontWeight: 'bold' }}>Welcome, Reporter!</h3>
                  <p style={{ marginBottom: 0, lineHeight: 1.5 }}>
                    Get familiar with the evidence board by selecting one piece of evidence. Pick up the camera, hover over an item to see its details, and click to select when ready.
                  </p>
                </>
              )}
              
              {completedSteps.select && !completedSteps.confirm && (
                <>
                  <h3 style={{ marginTop: 0, color: '#dc3545', fontWeight: 'bold' }}>Good job!</h3>
                  <p style={{ marginBottom: 0, lineHeight: 1.5 }}>
                    Now, click the "Confirm Selection" button at the bottom to proceed.
                  </p>
                </>
              )}
              
              {completedSteps.confirm && (
                <>
                  <h3 style={{ marginTop: 0, color: '#dc3545', fontWeight: 'bold' }}>Excellent!</h3>
                  <p style={{ marginBottom: 0, lineHeight: 1.5 }}>
                    Now you're ready to investigate the real evidence. Let's go!
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {idScanned && selectedItem && (
          <button 
            className={`confirm-button ${completedSteps.confirm ? 'clicked' : 'active'}`}
            onClick={handleConfirmClick}
            disabled={completedSteps.confirm}
          >
            Confirm Selection
          </button>
        )}
      </div>
      
      {!idScanned && renderLoginOverlay()}
    </div>
  );
} 