import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../utils/wavtools';
import { getSuspect, validateSuspectId, worldBackground } from '../data/suspects';
import { useWebSocket } from '../hooks/useWebSocket';
import { findPlayerByCardId, updateSelectedSuspect } from '../services/api';
import '../styles/InterviewPage.scss';

// Import our components
import SessionTimer from '../components/Interview/SessionTimer';
import ErrorDisplay from '../components/Interview/ErrorDisplay';
import DebugInfo from '../components/Interview/DebugInfo';
import PreScanPage from '../components/Interview/PreScanPage';
import PostScanPage from '../components/Interview/PostScanPage';
import InputMode from '../components/Interview/InputMode';
import CallMode from '../components/Interview/CallMode';
import EndingPage from '../components/Interview/EndingPage';

// Import custom hooks
import useAudioHandling from '../hooks/interview/useAudioHandling';
import useInterviewState from '../hooks/interview/useInterviewState';
import useCallHandling from '../hooks/interview/useCallHandling';
import useInputHandling from '../hooks/interview/useInputHandling';

// Import shared types
import { 
  InterviewStage, 
  InteractionMode, 
  Message, 
  TOTAL_INTERVIEW_TIME, 
  AVAILABLE_SUSPECTS 
} from '../types/InterviewTypes';

const LOCAL_RELAY_SERVER_URL = process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';

const getClient = (() => {
  let clientInstance: RealtimeClient | null = null;
  return () => {
    if (!clientInstance) {
      clientInstance = new RealtimeClient(
        LOCAL_RELAY_SERVER_URL
          ? { url: LOCAL_RELAY_SERVER_URL }
          : {
              apiKey: process.env.REACT_APP_OPENAI_API_KEY,
              dangerouslyAllowAPIKeyInBrowser: true,
            }
      );
    }
    return clientInstance;
  };
})();

// Function to validate suspect IDs
const isValidSuspectId = (id: string): boolean => {
  return ['7298', '4692', '5746'].includes(id);
};

const InterviewPage: React.FC = () => {
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Create a ref for the WebSocket message handler to avoid circular dependencies
  const handleWebSocketMessageRef = useRef<(data: any) => Promise<void>>();
  
  // Create refs for functions with circular dependencies
  const resetGameCompletelyRef = useRef<() => void>();
  const playEndingAudioRef = useRef<() => void>();
  
  // Use our custom hook for interview state
  const {
    interviewStage,
    setInterviewStage,
    setInterviewStageWithSync,
    interactionMode,
    setInteractionMode,
    setInteractionModeWithSync,
    suspectId,
    setSuspectId,
    playerId,
    setPlayerId,
    interviewedSuspects,
    setInterviewedSuspects,
    loginError,
    isCallActive,
    isIntroAudioPlaying,
    sessionTimerKey,
    isSessionActive,
    markSuspectCalled,
    hangUpCall,
    setIsCallActive,
    startInterviewSession,
    endInterviewSession,
    showError,
    allSuspectsCalled,
    handleIntroAudioEnded,
    handleTimerComplete,
    setIsSessionActive,
    resetInterviewState,
    setIsIntroAudioPlaying
  } = useInterviewState();
  
  // Use our custom hook for call handling
  const {
    messages,
    startCall,
    endCall
  } = useCallHandling({
    onCallStarted: () => {
      console.log('Call started callback');
      setInterviewStageWithSync('interview');
    },
    onCallEnded: () => {
      console.log('Call ended callback');
      hangUpCall();
    }
  });
  
  // Use our custom hook for intro audio
  const { playAudio: playIntroAudio } = useAudioHandling({
    audioPath: '/guard-audios/Station4_Tony_02.wav',
    onAudioEnded: handleIntroAudioEnded,
    onAudioError: (error) => {
      // If hook-based audio fails, try direct approach as fallback
      const fallbackAudio = new Audio('/guard-audios/Station4_Tony_02.wav');
      fallbackAudio.onended = handleIntroAudioEnded;
      fallbackAudio.play().catch(() => {
        // If both approaches fail, manually trigger callback to continue flow
        setTimeout(handleIntroAudioEnded, 500);
      });
    }
  });
  
  // Set up WebSocket connection
  const { 
    sendMessage, 
    disconnect: disconnectWebSocket, 
    reconnect: reconnectWebSocket 
  } = useWebSocket({
    onMessage: (data) => handleWebSocketMessageRef.current?.(data),
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected')
  });
  
  // Define function to completely reset the game and all resources
  const resetGameCompletely = useCallback(() => {
    console.log('🔄 Completely resetting game for next player');
    
    // First make sure any active calls are ended
    if (interactionMode === 'call' || isCallActive) {
      console.log('📞 Cleaning up active call before reset');
      endCall();
    }
    
    // Reset all application state
    resetInterviewState();
    
    // Clear local storage to remove any persisted state
    localStorage.removeItem('interrogatedSuspects');
    
    // Return to pre-scan state
    setInterviewStageWithSync('pre-scan');
    
    // Reconnect the WebSocket for the next player
    reconnectWebSocket();
    
    console.log('✅ Game completely reset and ready for next player');
    
  }, [
    interactionMode,
    isCallActive,
    endCall,
    resetInterviewState,
    setInterviewStageWithSync,
    reconnectWebSocket,
    showError
  ]);
  
  // Store the function in ref
  useEffect(() => {
    resetGameCompletelyRef.current = resetGameCompletely;
  }, [resetGameCompletely]);

  // WebSocket handler for RFID card scanning
  handleWebSocketMessageRef.current = async (data: any) => {
    if (data.type === 'rfid_scan' && data.deviceId === 'esp32-004' && !playerId) {
      console.log('RFID card scanned:', data.cardId);
      
      try {
        const playerData = await findPlayerByCardId(data.cardId);
        console.log('Player data received:', playerData);
        if (playerData && playerData[0]?.id) {
          // Set player ID (not suspect ID)
          setPlayerId(playerData[0].id);
          console.log('Setting player ID:', playerData[0].id);
          
          // Transition to post-scan stage
          setInterviewStageWithSync('post-scan');
          
          // Disconnect WebSocket after successful scan
          disconnectWebSocket?.();
        } else {
          console.log('No valid player data received');
          showError('No player found for this card');
        }
      } catch (err) {
        showError('Error finding player');
        console.error(err);
      }
    }
  };
  
  // Handle interview session start
  const handleStartInterview = useCallback(() => {
    if (interviewStage === 'post-scan' && !isIntroAudioPlaying) {
      // First set the state that audio is playing
      setIsIntroAudioPlaying(true);
      
      // Then start the interview session
      startInterviewSession();
      
      // Trigger audio playback with proper browser context
      // This ensures we're in a user-triggered context to avoid autoplay restrictions
      playIntroAudio();
      // handleIntroAudioEnded();
    }
  }, [
    interviewStage,
    isIntroAudioPlaying,
    startInterviewSession,
    setIsIntroAudioPlaying,
    playIntroAudio
  ]);
  
  // Handle starting a call
  const handleStartCall = useCallback(async () => {
    console.log('Attempting to start call with suspect ID:', suspectId);
    
    if (!suspectId || !isValidSuspectId(suspectId)) {
      showError('Invalid suspect ID. Please try again.');
        return;
    }
    
    // Set UI state to call mode first
    setInteractionModeWithSync('call');
    setInterviewStageWithSync('interview');
    console.log('Set interaction mode to call and interview stage to interview');
    
    // Start the call after UI state has been updated
    const success = await startCall(suspectId);
    
    if (!success) {
      console.error('Failed to start call');
      showError('Failed to connect call. Please try again.');
      // Revert UI state if call failed
      setInteractionModeWithSync('input');
      return;
    }
    
    markSuspectCalled(suspectId);
    
    console.log('Call started successfully');
  }, [suspectId, startCall, setInteractionModeWithSync, setInterviewStageWithSync, showError, markSuspectCalled]);
  
  // Handle hanging up the call
  const onHangUp = useCallback(() => {
    console.log('Hanging up call');
    
    // First ensure the OpenAI session is closed
    endCall();
    
    // Then update the UI state
    setIsCallActive(false);
    setInteractionModeWithSync('input');
    
    // Finally handle any other state changes needed
    hangUpCall();
    
    console.log('Call hung up successfully');
  }, [endCall, setIsCallActive, setInteractionModeWithSync, hangUpCall]);
  
  // Use our custom hook for input handling
  const {
    handleInput,
    handleGlobalKeydown
  } = useInputHandling({
    playerId,
    suspectId,
    interviewedSuspects,
    isSessionActive,
    onStartCall: handleStartCall,
    onHangUp: onHangUp,
    onInputChange: setSuspectId,
    onShowError: showError,
    onStartIntro: handleStartInterview
  });
  
  // Monitor app state changes to reconnect WebSocket when returning to pre-scan
  useEffect(() => {
    if (interviewStage === 'pre-scan') {
      console.log('Reconnecting WebSocket for new RFID scans');
      reconnectWebSocket();
    }
  }, [interviewStage, reconnectWebSocket]);
  
  // Add session ending handler
  useEffect(() => {
    if (interviewStage === 'ending' && playEndingAudioRef.current) {
      playEndingAudioRef.current();
    }
  }, [interviewStage]);

  // Load interrogated suspects from localStorage on component mount
  useEffect(() => {
    const storedSuspects = localStorage.getItem('interrogatedSuspects');
    if (storedSuspects) {
      setInterviewedSuspects(JSON.parse(storedSuspects));
    }
    
    // Focus the input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [setInterviewedSuspects]);

  // Save interrogated suspects to localStorage when the list changes
  useEffect(() => {
    localStorage.setItem('interrogatedSuspects', JSON.stringify(interviewedSuspects));
  }, [interviewedSuspects]);
  
  // Add global keyboard event listener
  useEffect(() => {
    // First, add the normal keydown handler for specific keys
    window.addEventListener('keydown', handleGlobalKeydown);
    
    // Add a focus handler for any keypress when in input mode
    const handleAnyKeyForFocus = (e: KeyboardEvent) => {
      // Only handle if we're in input mode and in interview stage
      if (interactionMode === 'input' && 
          interviewStage === 'interview' && 
          inputRef.current &&
          // Don't interfere with input typing by only handling keys when input is not focused
          document.activeElement !== inputRef.current) {
        
        // Focus the input element
        inputRef.current.focus();
      }
    };
    
    window.addEventListener('keydown', handleAnyKeyForFocus);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeydown);
      window.removeEventListener('keydown', handleAnyKeyForFocus);
    };
  }, [handleGlobalKeydown, interactionMode, interviewStage]);

  // Focus input field whenever we're in input mode and playerId is set
  useEffect(() => {
    if (interactionMode === 'input' && inputRef.current && playerId) {
      inputRef.current.focus();
    }
  }, [interactionMode, playerId]);

  // Ensure input is focused after component updates
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (interactionMode === 'input' && inputRef.current && playerId) {
        inputRef.current.focus();
      }
    }, 100); // Small delay to ensure DOM is ready
    
    return () => clearTimeout(focusTimer);
  });

  // Add the missing handler functions
  const handleScan = useCallback((playerId: string) => {
    console.log('Scan detected with player ID:', playerId);
    // Set the player ID and update the stage
    setPlayerId(playerId);
    setInterviewStageWithSync('post-scan');
  }, [setPlayerId, setInterviewStageWithSync]);

  const handleContinue = useCallback(() => {
    console.log('Continuing to interview from post-scan');
    // Start the interview session
    startInterviewSession();
  }, [startInterviewSession]);

  // Handle timer expiration - ensure all resources are cleaned up
  const handleTimerExpiration = useCallback(() => {
    console.log('⏰ Timer expired - cleaning up all resources');
    console.log('📊 Current state: ', {
      interviewStage,
      interactionMode,
      isCallActive,
      isSessionActive,
      callMessages: messages.length
    });
    
    // Force cleanup regardless of current state, to be extra safe
    if (interactionMode === 'call') {
      console.log('📞 Call mode detected during timer expiration - ending call');
      
      // Show notification to user      
      try {
        // Close the OpenAI session and stop audio
        console.log('🔌 Forcibly closing OpenAI session');
        endCall();
        
        // Make sure UI state is synced
        setIsCallActive(false);
        setInteractionModeWithSync('input');
        console.log('✅ Call cleanup completed on timer expiration');
      } catch (error) {
        console.error('❌ Error cleaning up call on timer expiration:', error);
      }
    } else {
      console.log('⏱️ Timer expired while not in a call');
    }
    
    // End the session which will transition to the ending stage
    console.log('🏁 Ending interview session due to timer expiration');
    handleTimerComplete();
    
    return { shouldRepeat: false };
  }, [
    interviewStage,
    interactionMode,
    isCallActive,
    isSessionActive,
    messages,
    endCall,
    setIsCallActive,
    setInteractionModeWithSync,
    handleTimerComplete,
    showError
  ]);

  // Handler for playing the ending audio
  const playEndingAudio = useCallback(() => {
    // Determine which audio to play
    const audioFile = allSuspectsCalled() 
        ? '/guard-audios/Station4_Tony_03A_Alt.wav' // All suspects interviewed
        : '/guard-audios/Station4_Tony_03_Alt.wav';  // Time's up
    
    // Set up audio with onended callback to reset state
    const endAudio = new Audio(audioFile);
    
    // Set callback to reset the game after showing ending screen
    const handleAudioEnded = () => {
      console.log('🔊 Ending audio finished');
      
      // First end the current session
      endInterviewSession();
      
      // Wait a moment to show the ending screen before resetting
      setTimeout(() => {
        if (resetGameCompletelyRef.current) {
          resetGameCompletelyRef.current();
        }
      }, 1000); // Show ending for 5 seconds before resetting
    };
    
    // Set the callback
    endAudio.onended = handleAudioEnded;
    
    // Play the audio
    endAudio.play().catch(err => {
      console.error('Failed to play ending audio:', err);
      // If there's an error playing audio, still reset state
      handleAudioEnded()
    });
  }, [allSuspectsCalled, endInterviewSession]);
  
  // Store the function in ref
  useEffect(() => {
    playEndingAudioRef.current = playEndingAudio;
  }, [playEndingAudio]);

  // Update the render function to use the actual component interfaces
  const renderContent = () => {
    switch (interviewStage) {
      case 'pre-scan':
        return <PreScanPage 
          isWsConnected={!!sendMessage} 
          loginError={loginError} 
        />;
      case 'post-scan':
        return <PostScanPage 
          playerId={playerId} 
          isIntroAudioPlaying={isIntroAudioPlaying}
          isSessionActive={isSessionActive}
          onStartInterview={handleStartInterview}
        />;
      case 'interview':
        return (
          <>
            {interactionMode === 'input' && (
              <InputMode 
                suspectId={suspectId}
                interviewedSuspects={interviewedSuspects}
                availableSuspects={AVAILABLE_SUSPECTS}
                onInputChange={handleInput}
                inputRef={inputRef}
              />
            )}
            
            {interactionMode === 'call' && (
              <CallMode
                suspectId={suspectId}
                playerId={playerId}
                messages={messages}
                onHangUp={onHangUp}
              />
            )}
          </>
        );
      case 'ending':
        return <EndingPage allSuspectsCalled={allSuspectsCalled()} />;
      default:
        return <Box>Unknown stage</Box>;
    }
  };

  return (
    <Box className="interview-page" sx={{
      backgroundImage: `url('/empty-interrogation-room.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      {/* Using our DebugInfo component */}
      {/* <DebugInfo
        appState={interviewStage}
        scanMode={interactionMode}
        sessionStarted={isSessionActive}
        suspectId={suspectId}
        calledSuspects={interviewedSuspects}
        audioPlaying={isIntroAudioPlaying}
        playerId={playerId}
        isSessionActive={isCallActive}
      /> */}

      {/* Using our SessionTimer component */}
      {(interviewStage === 'post-scan' || interviewStage === 'interview') && isSessionActive && (
        <SessionTimer
          isActive={isSessionActive}
          timerKey={sessionTimerKey}
          duration={TOTAL_INTERVIEW_TIME}
          onComplete={handleTimerExpiration}
        />
      )}

      {/* Error display component used for all states */}
      <ErrorDisplay 
        error={loginError} 
        position="center" 
        autoDismiss={true} 
      />

      {/* Render appropriate screen based on current stage using our components */}
      {renderContent()}
    </Box>
  );
};

export default InterviewPage; 