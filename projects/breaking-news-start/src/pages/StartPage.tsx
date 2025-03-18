import React, { useState, useEffect, useRef } from 'react';
import './StartPage.scss';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';
import { findPlayerByCardId, updatePlayerCardId, createNewPlayer } from '../services/api';
import { useGame, GameStage } from '../context/GameContext';

// Start page with Play button
export function StartPage() {
  const { gameState, setStage, setPlayer, setCardId } = useGame();
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('Scan your ID card to begin');
  const [isProcessing, setIsProcessing] = useState(false);
  const lastProcessedCardRef = useRef<string | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle WebSocket messages (card scans)
  const handleWebSocketMessage = async (data: WebSocketMessage) => {
    console.log('@@@ data:', data);
    if (data.type === 'rfid_scan' && data.deviceId === 'esp32-001' && data.cardId && !isProcessing) {
      // Prevent duplicate processing of the same card within 5 seconds
      if (data.cardId === lastProcessedCardRef.current) {
        console.log('Ignoring duplicate card scan:', data.cardId);
        return;
      }

      try {
        setIsProcessing(true);
        lastProcessedCardRef.current = data.cardId;
        setScanMessage(`Card detected: ${data.cardId}. Processing...`);
        
        // Store the card ID
        setCardId(data.cardId);
        
        // Step 1: Find if a player exists with this card ID
        const existingPlayer = await findPlayerByCardId(data.cardId);
        console.log('@@@ existingPlayer:', existingPlayer);
        if (existingPlayer) {
          // Step 2: Update the existing player's card ID to empty
          await updatePlayerCardId(existingPlayer.id);
        }
        
        // Step 3: Create a new player with this card ID
        const newPlayer = await createNewPlayer(data.cardId);
        
        if (newPlayer) {
          // Store the player in the game state
          setPlayer(newPlayer);
          
          // Move to the video stage
          setScanMessage('Success! Moving to video...');
          setTimeout(() => {
            setStage(GameStage.VIDEO);
          }, 1500);
        } else {
          setScanMessage('Error creating player. Please try again.');
          resetProcessingState();
        }
      } catch (error) {
        console.error('Error processing card scan:', error);
        setScanMessage('An error occurred. Please try again.');
        resetProcessingState();
      }
    }
  };

  // Reset processing state and clear the last processed card after delay
  const resetProcessingState = () => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    processingTimeoutRef.current = setTimeout(() => {
      setIsProcessing(false);
      lastProcessedCardRef.current = null;
      setScanMessage('Scan your ID card to begin');
    }, 3000);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Initialize WebSocket connection
  const { sendMessage } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected')
  });

  // Start scanning when the button is clicked
  const startScanning = () => {
    setIsScanning(true);
    setScanMessage(`Scan your ID card to begin.`);
  };
  
  return (
    <div className="start-page">
      <div className="logo-container">
        <img 
          src="/breaking-news-logo.png" 
          alt="Breaking News" 
        />
      </div>
      
      {!isScanning ? (
        <>
          <button 
            className="play-button"
            onClick={startScanning}
            disabled={isProcessing}
          >
            <div className="play-text">PLAY</div>
          </button>
          
          <div className="newspaper-container">
            <img 
              src="/GDC_newspaper_images.png" 
              alt="Newspaper" 
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                maxWidth: '100%',
                width: 'auto',
                height: 'auto',
                zIndex: 1
              }}
            />
          </div>
        </>
      ) : (
        <div className="scan-container">
          <div className="scan-message">
            <h3>Welcome to Breaking News!</h3>
            <p>Scan your ID card to begin.</p>
            </div>
          {isProcessing && <div className="loading-spinner"></div>}
        </div>
      )}
    </div>
  );
} 