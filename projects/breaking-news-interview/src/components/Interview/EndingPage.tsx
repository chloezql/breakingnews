import React from 'react';
import { Box } from '@mui/material';

interface EndingPageProps {
  allSuspectsCalled: boolean;
}

/**
 * EndingPage Component
 * 
 * Displays the ending screen after the interview session is complete.
 * Shows different messages based on whether all suspects were interviewed or time ran out.
 */
const EndingPage: React.FC<EndingPageProps> = ({ allSuspectsCalled }) => {
  return (
    <>
    <Box className="ending-overlay" sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      position: 'relative',
      top: '70%',
      zIndex: 10,
    }}>
      
      <Box
        component="h2"
        sx={{ 
          color: 'white', 
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '20px',
          fontSize: '2.5rem'
        }}
      >
        {allSuspectsCalled 
          ? "Good work, reporter." 
          : "Time's up."}
      </Box>

    
        
    </Box>
      <img 
      src="/police-arm-up.png" 
      alt="Police officer with raised arm" 
      style={{ 
        maxHeight: '80vh',
        maxWidth: '100%',
        bottom: '-100px'
      }}
    />
    </>
  );
};

export default EndingPage; 