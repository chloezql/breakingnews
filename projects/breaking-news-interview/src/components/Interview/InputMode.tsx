import React, { useEffect } from 'react';
import { Box } from '@mui/material';

interface InputModeProps {
  suspectId: string;
  interviewedSuspects: string[];
  availableSuspects: string[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * InputMode Component
 * 
 * Displays the input interface for entering suspect IDs during the interview.
 * Shows progress of interviews and available suspect IDs.
 */
const InputMode: React.FC<InputModeProps> = ({
  suspectId,
  interviewedSuspects,
  availableSuspects,
  onInputChange,
  inputRef
}) => {
  // Ensure input is focused when component mounts or updates
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  // Handle clicking anywhere in the container to refocus on input
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Box 
      className="interview-input-overlay" 
      onClick={handleContainerClick}
      sx={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 15,
        cursor: 'text' // Show text cursor to indicate typing is possible
      }}
    >
      <Box
        component="h2"
        sx={{ 
          color: 'white', 
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '2.5rem'
        }}
      >
        Input code to call your suspect
      </Box>
      
      <Box sx={{ 
        width: '300px',
        textAlign: 'center',
      }}>
        <Box
          component="p"
          sx={{ 
            color: 'white', 
            marginBottom: '10px',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
          }}
        >
          Enter suspect ID followed [call] key
        </Box>
        <input
          type="text"
          value={suspectId}
          onChange={onInputChange}
          className="suspect-input"
          autoFocus
          placeholder="Suspect ID..."
          ref={inputRef}
          onBlur={() => inputRef.current?.focus()} // Re-focus if it loses focus
          onKeyDown={(e) => {
            // Prevent tabbing out or any other navigation keys
            if (e.key === 'Tab') {
              e.preventDefault();
            }
          }}
          style={{
            padding: '15px',
            fontSize: '24px',
            width: '100%',
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: '2px solid #0099ff',
            borderRadius: '5px'
          }}
        />
        {interviewedSuspects.length > 0 && (
          <Box
            component="p"
            sx={{ 
              color: 'white', 
              marginTop: '15px',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
            }}
          >
            Interviewed: {interviewedSuspects.length}/{availableSuspects.length}
          </Box>
        )}
        
        <Box sx={{ marginTop: '20px' }}>
          <Box
            component="p"
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
            }}
          >
            {/* Available suspects: {availableSuspects.join(', ')} */}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default InputMode; 