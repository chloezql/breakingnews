import React from 'react';
import { Box, Button } from '@mui/material';

interface PostScanPageProps {
  playerId: string;
  isIntroAudioPlaying: boolean;
  isSessionActive: boolean;
  onStartInterview?: () => void;
}

/**
 * PostScanPage Component
 * 
 * Displays the screen after a successful RFID card scan.
 * Shows police officer image and relevant prompts based on the current state.
 */
const PostScanPage: React.FC<PostScanPageProps> = ({ 
  playerId, 
  isIntroAudioPlaying, 
  isSessionActive,
  onStartInterview
}) => {
  // Direct audio test function
  const testDirectAudio = () => {
    const audio = new Audio('/guard-audios/Station4_Tony_02.wav');
    audio.volume = 1.0;
    audio.play();
  };

  return (
    <>
    <Box className="post-scan-overlay" sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      position: 'relative',
      zIndex: 10
    }}>
      <Box sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
      }}>
       
        {/* Show different text based on state */}
        <Box
          component="h2"
          sx={{ 
            color: 'white', 
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '20px',
            position: 'absolute',
            width: '100%',
            bottom: isIntroAudioPlaying ? '10%' : '20%',
            fontSize: '2.5rem'
          }}
        >
          {isIntroAudioPlaying 
            ? "Listening to intro..." 
            : isSessionActive 
              ? "Input code to call your suspect" 
              : "Press 9 on the telephone to start"}
        </Box>
      </Box>
      
      {/* Player ID display */}
      {playerId && (
        <Box 
          sx={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '5px 10px',
            backgroundColor: 'rgba(0, 153, 255, 0.2)',
            borderRadius: '5px',
            border: '1px solid #0099ff',
            zIndex: 2
          }}
        >
          <Box component="p" sx={{ color: '#0099ff', margin: 0 }}>
            Reporter: {playerId}
          </Box>
        </Box>
      )}
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

export default PostScanPage; 