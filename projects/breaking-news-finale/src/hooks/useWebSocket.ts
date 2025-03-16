import { useEffect, useCallback, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: string;
  cardId?: string;
  deviceId?: string;
  timestamp?: string;
}

interface UseWebSocketOptions {
  onMessage?: (data: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket({ onMessage, onConnect, onDisconnect }: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    if (wsRef.current) {
      console.log('Manually disconnecting WebSocket');
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsEnabled(false);
  }, [clearReconnectTimeout]);

  const reconnect = useCallback(() => {
    setIsEnabled(true);
    reconnectAttemptRef.current = 0; // Reset reconnect attempts
    connect();
  }, []);

  const connect = useCallback(() => {
    // Don't connect if WebSocket is disabled
    if (!isEnabled) {
      console.log('WebSocket is disabled, not connecting');
      return;
    }

    clearReconnectTimeout();

    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      return;
    }

    try {
      const ws = new WebSocket('ws://192.168.4.100:8080');

      ws.onopen = () => {
        console.log('WebSocket Connected');
        reconnectAttemptRef.current = 0;

        // Send device info
        ws.send(JSON.stringify({
          type: 'device_connect',
          deviceId: 'react-client-finale',
          deviceType: 'react_client'
        }));

        if (onConnect) {
          onConnect();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);

          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        wsRef.current = null;

        if (onDisconnect) {
          onDisconnect();
        }

        // Only attempt to reconnect if WebSocket is enabled
        if (isEnabled) {
          // Increment reconnection attempt counter
          reconnectAttemptRef.current += 1;
          console.log(`Reconnection attempt ${reconnectAttemptRef.current} of ${MAX_RECONNECT_ATTEMPTS}`);

          // Try to reconnect after 5 seconds
          if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
            clearReconnectTimeout();
            reconnectTimeoutRef.current = setTimeout(connect, 5000);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [onMessage, onConnect, onDisconnect, clearReconnectTimeout, isEnabled]);

  useEffect(() => {
    if (isEnabled) {
      connect();
    }

    return () => {
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, clearReconnectTimeout, isEnabled]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  return { 
    sendMessage, 
    disconnect, 
    reconnect, 
    isConnected: !!wsRef.current && wsRef.current.readyState === WebSocket.OPEN 
  };
} 