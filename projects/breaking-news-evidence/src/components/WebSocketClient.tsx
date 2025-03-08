import React, { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketClientProps {
  onMessage?: (data: any) => void;
}

const WebSocketClient: React.FC<WebSocketClientProps> = ({ onMessage }) => {
  const [status, setStatus] = useState('Waiting for connection...');
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const reconnectAttemptRef = useRef(0);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
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
        console.log('WebSocket Connected');
        setStatus('Connected to server');
        setConnected(true);
        reconnectAttemptRef.current = 0;

        // Send device info on connect
        newWs.send(JSON.stringify({
          type: 'device_connect',
          deviceId: 'react-client-' + Date.now(),
          deviceType: 'react_client'
        }));
      };

      newWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received data:', data);
          setLastMessage(data);

          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newWs.onclose = () => {
        console.log('WebSocket Disconnected');
        setStatus('Disconnected');
        setConnected(false);
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
        console.error('WebSocket Error:', error);
        setStatus('Connection error');
        setConnected(false);
      };

      setWs(newWs);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setStatus('Failed to connect');
    }
  }, [onMessage]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      clearReconnectTimeout();
      if (ws) {
        ws.close();
      }
    };
  }, [connectWebSocket]);

  return (
    <div className="websocket-client">
      <div className="status-indicator">
        <div className={`status-light ${connected ? 'connected' : 'disconnected'}`}></div>
        <span>{status}</span>
      </div>
      {lastMessage && (
        <div className="message-info">
          <h3>Last Message</h3>
          <pre>{JSON.stringify(lastMessage, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default WebSocketClient; 