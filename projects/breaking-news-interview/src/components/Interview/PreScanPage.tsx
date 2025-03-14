import React from 'react';
import { Box } from '@mui/material';
import ErrorDisplay from './ErrorDisplay';

interface PreScanPageProps {
  isWsConnected: boolean;
  loginError: string | null;
}

/**
 * PreScanPage Component
 * 
 * Displays the initial screen where users are prompted to scan their ID card.
 * Shows connection status and any errors that might occur during the RFID scanning process.
 */
const PreScanPage: React.FC<PreScanPageProps> = ({ 
  isWsConnected, 
  loginError 
}) => {
  return (
    <Box className="pre-scan-overlay" sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Blurred background overlay */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: -1
      }} />
      
      {/* Main text */}
      <Box
        component="h2"
        sx={{ 
          color: 'white', 
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '20px',
          zIndex: 2, // Ensure text is above the blur
          fontSize: '2.5rem'
        }}
      >
        SCAN YOUR ID CARD
      </Box>
      
      {/* WebSocket connection status */}
      <Box
        component="p" 
        className="faded-text" 
        sx={{ 
          color: 'white', 
          marginTop: '20px', 
          zIndex: 2,
          opacity: 0.7
        }}
      >
        {isWsConnected 
          ? 'Waiting for card scan...'
          : 'RFID Scanner disconnected. Please check connection.'}
      </Box>
      
      {/* Error display component */}
      <ErrorDisplay 
        error={loginError} 
        position="center" 
        autoDismiss={true} 
        dismissTime={3000}
      />
    </Box>
  );
};

export default PreScanPage; 