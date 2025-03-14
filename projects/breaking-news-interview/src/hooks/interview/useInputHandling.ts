import { useCallback } from 'react';
import { validateSuspectId } from '../../data/suspects';

interface UseInputHandlingProps {
  playerId: string;
  suspectId: string;
  interviewedSuspects: string[];
  isSessionActive: boolean;
  onStartCall: (suspectId: string) => void;
  onHangUp: () => void;
  onInputChange: (newValue: string) => void;
  onShowError: (message: string) => void;
  onStartIntro: () => void;
}

/**
 * Custom hook to handle user input during the interview
 */
const useInputHandling = ({
  playerId,
  suspectId,
  interviewedSuspects,
  isSessionActive,
  onStartCall,
  onHangUp,
  onInputChange,
  onShowError,
  onStartIntro
}: UseInputHandlingProps) => {
  
  // Handle starting the interview with key 9
  const handleKeyNine = useCallback(() => {
    onStartIntro();
  }, [onStartIntro]);
  
  // Handle hanging up call with key 0
  const handleKeyZero = useCallback(() => {
    console.log('Key 0 pressed, attempting to hang up call');
    onHangUp();
    // Always clear the input field regardless of whether a call was active
    onInputChange('');
  }, [onHangUp, onInputChange]);
  
  // Handle input field changes and process commands
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Input value:', value);
    
    // Handle key 9 to start interview
    if (value === '9' && !isSessionActive) {
      handleKeyNine();
      return;
    }
    
    // Handle key 0 to hang up call
    if (value === '0') {
      handleKeyZero();
      return;
    }
    
    // Check if this is a suspect ID scan with confirmation (ends with .)
    if (value.endsWith('.')) {
      console.log('Suspect ID with confirmation:', value);
      
      // If player only pressed 5 and then ., play an intro audio
      if (value === '5.') {
        const introAudio = new Audio('/suspect-intro.mp3');
        onInputChange('');
        introAudio.play();
        return;
      }
      
      const suspectId = value.slice(0, -1);
      console.log('Checking suspect ID:', suspectId, 'Valid:', validateSuspectId(suspectId));
      if (validateSuspectId(suspectId)) {
        // Only allow starting a call if player ID has been set via RFID
        if (playerId) {
          // Check if suspect has already been called in this session
          if (interviewedSuspects.includes(suspectId)) {
            onShowError('You already interviewed this suspect.');
            onInputChange('');
          } 
          // Check if session is active
          else if (!isSessionActive) {
            onShowError('Session not started. Press 9 to begin.');
            onInputChange('');
          }
          else {
            console.log('Starting call with suspect:', suspectId);
            // First update the input field with the suspect ID for clarity
            onInputChange(suspectId);
            // Then initiate the call
            onStartCall(suspectId);
          }
        } else {
          onShowError('Please scan your reporter ID card first');
          onInputChange('');
        }
      } else {
        onShowError('Invalid suspect ID');
        onInputChange('');
      }
    } else {
      // Just update the input value normally
      onInputChange(value);
    }
  }, [
    playerId, 
    interviewedSuspects, 
    isSessionActive, 
    onStartCall, 
    onInputChange, 
    onShowError, 
    handleKeyNine, 
    handleKeyZero
  ]);
  
  // Handle global keyboard events
  const handleGlobalKeydown = useCallback((e: KeyboardEvent) => {
    if (e.key === '9' && !isSessionActive) {
      handleKeyNine();
    } else if (e.key === '0') {
      handleKeyZero();
    }
  }, [handleKeyNine, handleKeyZero, isSessionActive]);
  
  return {
    handleInput,
    handleGlobalKeydown
  };
};

export default useInputHandling; 