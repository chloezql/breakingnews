import React, { useState, useRef, useEffect } from 'react';
import { findPlayerByCardId } from '../services/api';
import { GameState, saveGameState } from '../services/gameState';
import { GameStage } from '../types/GameStages';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';
import './ScanIdPage.scss';

interface ScanIdPageProps {
  onPlayerLoaded: (playerId: string) => void;
}

const ScanIdPage: React.FC<ScanIdPageProps> = ({ onPlayerLoaded }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [playerInfo, setPlayerInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  // WebSocket handler for RFID card scanning
  const handleWebSocketMessage = async (data: WebSocketMessage) => {
    if (data.type === 'rfid_scan' && data.cardId) {
      console.log('RFID card scanned:', data.cardId);
      await handleCardScan(data.cardId);
    }
  };
  
  // Initialize WebSocket connection
  const { isConnected, disconnect } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => setConnectionStatus('connected'),
    onDisconnect: () => setConnectionStatus('disconnected')
  });
  
  useEffect(() => {
    // Update connection status when WebSocket connection changes
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  // Process the scanned card ID
  const handleCardScan = async (id: string) => {
    if (!id) {
      setError('Invalid card ID received');
      return;
    }

    // Prevent multiple simultaneous scans
    if (isLoading || scanSuccess) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching player data for card ID:', id);
      const playersData = await findPlayerByCardId(id);
      
      if (playersData && playersData.length > 0) {
        const playerData = playersData[0];
        console.log('Player found:', playerData);
        setPlayerInfo(playerData);
        
        // Create game state with player data from API
        const newState: GameState = {
          currentStage: GameStage.ALIAS, // Start at ALIAS stage after scanning ID
          id: playerData.id, // Use ID from API
          player_name: playerData.player_name || "",
          id_card_no: playerData.id_card_no || id,
          // Use these properties from API response
          evidence_list: playerData.evidence_list || [],
          tape: playerData.tape || [],
          selected_suspect: playerData.selected_suspect || [],
          // Initialize the rest of the game state properties
          headline: "",
          full_article_generated: "",
          article_death_cause: "",
          article_suspect_ids: [],
          article_method: "",
          article_motive: "",
          article_evidence_ids: [],
          article_witness_quotes: [],
          article_style: "",
          article_interrogation_findings: {},
          view_count: 0,
          hashtags: [] as string[]
        };
        
        saveGameState(newState);
        setScanSuccess(true);
        
        // Disconnect WebSocket after successful scan
        disconnect();
        
        // Notify parent component that player is loaded
        onPlayerLoaded(playerData.id);
      } else {
        console.error('Player not found for card ID:', id);
        setError(`No player found for ID card ${id}. Please try again.`);
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
      setError('Error connecting to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="scan-id-page">
      <div className="scan-id-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Reporter Login</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <h1>Login</h1>
          
          {/* <div className={`connection-status ${connectionStatus}`}>
            <div className="status-indicator"></div>
            <p>WebSocket: {connectionStatus}</p>
          </div> */}
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
          
          {scanSuccess && playerInfo && (
            <div className="success-message">
              <h2>Player Found!</h2>
              <div className="player-info">
                <p><strong>ID:</strong> {playerInfo.id}</p>
                <p><strong>Card Number:</strong> {playerInfo.id_card_no}</p>
                {playerInfo.player_name && <p><strong>Name:</strong> {playerInfo.player_name}</p>}
                {playerInfo.selected_suspect && playerInfo.selected_suspect.length > 0 && (
                  <p><strong>Selected Suspect:</strong> {playerInfo.selected_suspect.join(', ')}</p>
                )}
              </div>
              <p className="proceed-message">Proceeding to next screen...</p>
            </div>
          )}
          
          {!scanSuccess && (
            <div className="scan-instructions">
              <div className="card-icon">
                <img src="/id-card-icon.svg" alt="ID Card" onError={(e) => {
                  // Use a data URI as fallback instead of external placeholder service
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3QgeD0iNSIgeT0iMjAiIHdpZHRoPSI5MCIgaGVpZ2h0PSI2MCIgcng9IjUiIHJ5PSI1IiBmaWxsPSIjZjBmMGYwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMzMzIj5JRCBDYXJkPC90ZXh0Pjwvc3ZnPg==';
                }} />
              </div>
              <h2>Please scan your ID card</h2>
              <p>Hold your reporter ID card near the scanner</p>
              {isLoading && <div className="loading-indicator">Processing...</div>}
            </div>
          )}
        </div>
        
        <div className="window-status-bar">
          <div className="status-text">Breaking News - 2025</div>
          <div className="windows-logo"></div>
        </div>
      </div>
    </div>
  );
};

export default ScanIdPage; 