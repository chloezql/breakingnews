import React, { useState, useEffect } from 'react';
import './PlayerLoginPage.scss';
import { fetchPlayerData } from '../services/api';

interface PlayerLoginPageProps {
  onPlayerLogin: (playerId: string) => void;
}

export function PlayerLoginPage({ onPlayerLogin }: PlayerLoginPageProps) {
  const [playerId, setPlayerId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Add WebSocket connection
  useEffect(() => {
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://your-rfid-server.com'
      : 'ws://localhost:4000';
      
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'RFID_AUTH' && data.player) {
        onPlayerLogin(data.player.id);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Please try manual login.');
    };

    return () => {
      ws.close();
    };
  }, [onPlayerLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerId.trim()) {
      setError('Please enter a player ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const player = await fetchPlayerData(playerId);
      
      if (player) {
        onPlayerLogin(playerId);
      } else {
        setError('Player not found. Please check your ID and try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="player-login-page">
      <div className="login-container">
        <h1>Breaking News</h1>
        <h2>Evidence Collection</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="player-id">Enter your Player ID or Scan RFID Card</label>
            <input
              id="player-id"
              type="text"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder="Player ID"
              disabled={loading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
} 