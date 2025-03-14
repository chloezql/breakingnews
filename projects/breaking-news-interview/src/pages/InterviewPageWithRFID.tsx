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
  return ['1234', '5678', '9876'].includes(id);
};

const InterviewPage: React.FC = () => {
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Create a ref for the WebSocket message handler to avoid circular dependencies
  const handleWebSocketMessageRef = useRef<(data: any) => Promise<void>>();
  
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
    setIsSessionActive
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
    onAudioEnded: handleIntroAudioEnded
  });
  
  // Handler for playing the ending audio
  const playEndingAudio = useCallback(() => {
    // Determine which audio to play
    const audioFile = allSuspectsCalled() 
        ? '/guard-audios/Station4_Tony_03A.wav' // All suspects interviewed
        : '/guard-audios/Station4_Tony_03.wav';  // Time's up
    
    // Set up audio with onended callback to reset state
    const endAudio = new Audio(audioFile);
    endAudio.onended = endInterviewSession;
    
    // Play the audio
    endAudio.play().catch(err => {
      console.error('Failed to play ending audio:', err);
      // If there's an error playing audio, still reset state
      setTimeout(endInterviewSession, 1000);
    });
  }, [allSuspectsCalled, endInterviewSession]);
  
  // WebSocket handler for RFID card scanning
  handleWebSocketMessageRef.current = async (data: any) => {
    if (data.type === 'rfid_scan' && !playerId) {
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
  
  // Handle interview session start
  const handleStartInterview = useCallback(() => {
    if (interviewStage === 'post-scan' && !isIntroAudioPlaying) {
      console.log('Starting interview session from post-scan stage');
      startInterviewSession();
      // playIntroAudio();
      
      // Directly move to interview stage after starting the session
      setIsSessionActive(true);
      setInterviewStageWithSync('interview');
      setInteractionModeWithSync('input');
      console.log('Transitioned to interview stage, input mode');
    }
  }, [
    interviewStage,
    isIntroAudioPlaying,
    startInterviewSession,
    setIsSessionActive,
    setInterviewStageWithSync,
    setInteractionModeWithSync
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
    if (interviewStage === 'ending') {
      playEndingAudio();
    }
  }, [interviewStage, playEndingAudio]);

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
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeydown);
    };
  }, [handleGlobalKeydown]);

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
      <DebugInfo
        appState={interviewStage}
        scanMode={interactionMode}
        sessionStarted={isSessionActive}
        suspectId={suspectId}
        calledSuspects={interviewedSuspects}
        audioPlaying={isIntroAudioPlaying}
        playerId={playerId}
        isSessionActive={isCallActive}
      />

      {/* Using our SessionTimer component */}
      {(interviewStage === 'post-scan' || interviewStage === 'interview') && isSessionActive && (
        <SessionTimer
          isActive={isSessionActive}
          timerKey={sessionTimerKey}
          duration={TOTAL_INTERVIEW_TIME}
          onComplete={handleTimerComplete}
        />
      )}

      {/* Error display component used for all states */}
      <ErrorDisplay 
        error={loginError} 
        position="timer-adjacent" 
        autoDismiss={true} 
      />

      {/* Render appropriate screen based on current stage using our components */}
      {renderContent()}
    </Box>
  );
};

export default InterviewPage; 