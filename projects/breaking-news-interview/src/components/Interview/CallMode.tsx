import React from 'react';
import { Box } from '@mui/material';
import SuspectImage from './SuspectImage';
import ChatContainer from './ChatContainer';
import { Message } from '../../types/InterviewTypes';

interface CallModeProps {
  suspectId: string;
  playerId: string;
  messages: Message[];
  onHangUp?: () => void;
}

/**
 * CallMode Component
 * 
 * Displays the call interface during an active conversation with a suspect.
 * Shows the suspect image, chat messages, and the hang-up instructions.
 */
const CallMode: React.FC<CallModeProps> = ({
  suspectId,
  playerId,
  messages,
  onHangUp
}) => {
  return (
    <Box className="call-section">
      {/* Blurred background with suspect image */}
      <Box className="blurred-content">
        {/* Fallback blur for browsers that don't support backdrop-filter */}
        <div className="blur-fallback"></div>
        
        {/* Using our SuspectImage component */}
        <SuspectImage suspectId={suspectId} />
        
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
        
        {/* Hang up instruction */}
        <Box 
          sx={{
            position: 'absolute',
            bottom: '120px',
            padding: '5px 10px',
            backgroundColor: 'rgba(244, 67, 54, 0.2)',
            borderRadius: '5px',
            zIndex: 2,
            cursor: onHangUp ? 'pointer' : 'default'
          }}
          onClick={onHangUp}
        >
          <Box component="p" sx={{ color: '#F44336', margin: 0 , fontSize: '40px'}}>
            Press [End] to hang up
          </Box>
        </Box>
      </Box>
      
      {/* Using our ChatContainer component */}
      {/* <ChatContainer messages={messages} /> */}
    </Box>
  );
};

export default CallMode; 