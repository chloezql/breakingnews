import React, { useState, useEffect, useCallback, useRef } from 'react';
import './RFIDSimulator.scss';

const RFIDSimulator: React.FC = () => {
  const [status, setStatus] = useState('Disconnected');
  const [connected, setConnected] = useState(false);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Generate a random card ID similar to real RFID
  const generateRandomCardId = () => {
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += Math.floor(Math.random() * 16).toString(16).toUpperCase();
    }
    return id;
  };

  const connectWebSocket = useCallback(() => {
    clearReconnectTimeout();

    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatus('Max reconnection attempts reached. Please refresh the page.');
      return;
    }

    try {
      const newWs = new WebSocket('ws://localhost:8080');

      newWs.onopen = () => {
        console.log('Simulator connected to WebSocket server');
        setStatus('Connected');
        setConnected(true);
        reconnectAttemptRef.current = 0;

        // Register as an RFID device
        newWs.send(JSON.stringify({
          type: 'device_connect',
          deviceId: 'simulator-device',
          deviceType: 'rfid_reader'
        }));
      };

      newWs.onclose = () => {
        console.log('Simulator disconnected from server');
        setStatus('Disconnected');
        setConnected(false);
        setIsSimulating(false);
        setWs(null);

        // Increment reconnection attempt counter
        reconnectAttemptRef.current += 1;
        console.log(`Reconnection attempt ${reconnectAttemptRef.current} of ${MAX_RECONNECT_ATTEMPTS}`);

        // Try to reconnect after 5 seconds
        if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
          setStatus(`Attempting to reconnect... (${reconnectAttemptRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          clearReconnectTimeout();
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        } else {
          setStatus('Max reconnection attempts reached. Please refresh the page.');
        }
      };

      newWs.onerror = (error) => {
        console.error('Simulator WebSocket error:', error);
        setStatus('Connection error');
        setConnected(false);
      };

      setWs(newWs);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setStatus('Failed to connect');
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      clearReconnectTimeout();
      if (ws) {
        ws.close();
      }
    };
  }, [connectWebSocket]);

  const toggleSimulation = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    setIsSimulating(prev => !prev);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isSimulating && ws && ws.readyState === WebSocket.OPEN) {
      interval = setInterval(() => {
        const cardId = generateRandomCardId();
        ws.send(JSON.stringify({
          type: 'rfid_scan',
          cardId: cardId,
          deviceId: 'simulator-device'
        }));
        setLastCardId(cardId);
        console.log(`Simulated card scan: ${cardId}`);
      }, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isSimulating, ws]);

  const simulateOneCard = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const cardId = generateRandomCardId();
    ws.send(JSON.stringify({
      type: 'rfid_scan',
      cardId: cardId,
      deviceId: 'simulator-device'
    }));
    setLastCardId(cardId);
  };

  return (
    <div className="rfid-simulator">
      <h3>RFID Simulator</h3>
      <div className="status-indicator">
        <div className={`status-light ${connected ? 'connected' : 'disconnected'}`}></div>
        <span>{status}</span>
      </div>
      <div className="controls">
        <button 
          onClick={toggleSimulation}
          className={isSimulating ? 'active' : ''}
          disabled={!connected}
        >
          {isSimulating ? 'Stop Auto Simulation' : 'Start Auto Simulation'}
        </button>
        <button 
          onClick={simulateOneCard}
          disabled={!connected || isSimulating}
        >
          Simulate Single Card
        </button>
      </div>
      {lastCardId && (
        <div className="last-scan">
          <p>Last Card ID: <code>{lastCardId}</code></p>
        </div>
      )}
    </div>
  );
};

export default RFIDSimulator; 