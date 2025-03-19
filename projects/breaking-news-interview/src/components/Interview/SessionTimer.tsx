import React from 'react';
import { Box, Typography } from '@mui/material';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

interface SessionTimerProps {
  isActive: boolean;
  timerKey: number;
  duration: number;
  onComplete: () => { shouldRepeat: boolean };
}

/**
 * SessionTimer Component
 * 
 * Displays a countdown timer for the interview session duration.
 * Visually indicates remaining time with color changes.
 */
const SessionTimer: React.FC<SessionTimerProps> = ({ 
  isActive, 
  timerKey, 
  duration, 
  onComplete 
}) => {
  return (
    <Box className="session-timer" sx={{
      position: 'absolute',
      top: '400px',
      right: '400px',
      zIndex: 20
    }}>
      <CountdownCircleTimer
        key={timerKey}
        isPlaying={isActive}
        duration={duration}
        colors={['#00C853', '#FFC107', '#FF5722', '#F44336']}
        colorsTime={[duration, duration * 0.6, duration * 0.2, 0]}
        onComplete={onComplete}
        size={160}
        strokeWidth={8}
      >
        {({ remainingTime }) => {
          // Convert seconds to minutes:seconds format
          const minutes = Math.floor(remainingTime / 60);
          const seconds = remainingTime % 60;
          return (
            <Typography className="timer-text" sx={{ 
              fontSize: '38px',
              fontWeight: 'bold'
            }}>
              {`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}
            </Typography>
          );
        }}
      </CountdownCircleTimer>
    </Box>
  );
};

export default SessionTimer; 