import React from 'react';
import { Box } from '@mui/material';

interface DebugInfoProps {
  appState: string;
  scanMode: string;
  sessionStarted: boolean;
  suspectId: string;
  calledSuspects: string[];
  audioPlaying: boolean;
  playerId: string;
  isSessionActive: boolean;
}

/**
 * DebugInfo Component
 * 
 * Displays current application state values for debugging purposes.
 * Can be toggled on/off based on development needs.
 */
const DebugInfo: React.FC<DebugInfoProps> = ({
  appState,
  scanMode,
  sessionStarted,
  suspectId,
  calledSuspects,
  audioPlaying,
  playerId,
  isSessionActive
}) => {
  return (
    <Box 
      sx={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 9999,
        maxWidth: '300px',
        fontSize: '12px',
        fontFamily: 'monospace',
        textAlign: 'left'
      }}
    >
      <div><strong>Debug Info:</strong></div>
      <div>App State: {appState}</div>
      <div>Scan Mode: {scanMode}</div>
      <div>Session Started: {sessionStarted ? 'Yes' : 'No'}</div>
      <div>Current Input: "{suspectId}"</div>
      <div>Called Suspects: {calledSuspects.join(', ') || 'None'}</div>
      <div>Audio Playing: {audioPlaying ? 'Yes' : 'No'}</div>
      <div>Player ID: {playerId || 'None'}</div>
      <div>isSessionActive: {isSessionActive ? 'Yes' : 'No'}</div>
    </Box>
  );
};

export default DebugInfo; 