import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface ErrorDisplayProps {
  error: string | null;
  position?: 'timer-adjacent' | 'center' | 'top';
  autoDismiss?: boolean;
  dismissTime?: number;
}

/**
 * ErrorDisplay Component
 * 
 * Displays error messages in a styled box.
 * Can automatically dismiss after a specified time if autoDismiss is true.
 * Position can be customized based on where it should appear in the UI.
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  position = 'timer-adjacent',
  autoDismiss = false,
  dismissTime = 3000
}) => {
  const [localError, setLocalError] = useState<string | null>(error);
  
  useEffect(() => {
    setLocalError(error);
    
    if (autoDismiss && error) {
      const timer = setTimeout(() => {
        setLocalError(null);
      }, dismissTime);
      
      return () => clearTimeout(timer);
    }
  }, [error, autoDismiss, dismissTime]);
  
  if (!localError) return null;
  
  // Determine position based on prop
  const positionStyles = {
    'timer-adjacent': {
      top: '20px',
      right: '200px',
    },
    'center': {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
    'top': {
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
    }
  };
  
  return (
    <Box className="info-box error" sx={{ 
      position: 'absolute',
      ...positionStyles[position],
      padding: '5px 10px',
      backgroundColor: 'rgba(244, 67, 54, 0.2)',
      borderRadius: '5px',
      border: '1px solid #F44336',
      zIndex: 999
    }}>
      <Typography variant="body2" sx={{ color: '#F44336' }}>
        Error: {localError}
      </Typography>
    </Box>
  );
};

export default ErrorDisplay; 