import React, { useState, useCallback } from 'react';
import { EvidenceSelectionPage } from './pages/EvidenceSelectionPage';
import { useWebSocket } from './hooks/useWebSocket';
import { findPlayerByCardId, Player } from './services/api';
import './App.scss';

function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWebSocketMessage = useCallback(async (data: any) => {
    if (data.type === 'rfid_scan') {
      console.log('RFID card scanned:', data.cardId);
      setLastCardId(data.cardId);
      setError(null);
      setIsLoading(true);
      
      try {
        const playerData = await findPlayerByCardId(data.cardId);
        console.log('Player data received in App:', playerData);
        console.log('Player data type:', typeof playerData);
        if (playerData && playerData[0].id) {
          setPlayer(playerData[0]);
          console.log('Setting player state with ID:', playerData[0].id);
        } else {
          console.log('No valid player data received');
          setError('No player found for this card');
        }
      } catch (err) {
        setError('Error finding player');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

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

  console.log('Current player state:', player);

  return (
    <div className="App">
      <div className="connection-status">
        WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
        {lastCardId && <div>Last Card: {lastCardId}</div>}
      </div>

      {player ? (
        <>
          <div className="player-info">
            Player ID: {player.id}
            {player.player_name && <div>Name: {player.player_name}</div>}
          </div>
          <EvidenceSelectionPage playerId={player.id} />
        </>
      ) : (
        <div className="login-overlay">
          <div className="login-card">
            <h2>Scan your ID card!</h2>
            {isLoading && <div className="loading">Checking card...</div>}
            {error && <div className="error">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 