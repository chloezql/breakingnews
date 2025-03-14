import { useState, useCallback, useRef } from 'react';
import { updateSelectedSuspect } from '../../services/api';
import { InterviewStage, InteractionMode, AVAILABLE_SUSPECTS } from '../../types/InterviewTypes';

interface UseInterviewStateProps {
  onSessionEnd?: () => void;
}

/**
 * Custom hook to manage the interview state and related functionality
 */
const useInterviewState = ({ onSessionEnd }: UseInterviewStateProps = {}) => {
  // Core interview state
  const [interviewStage, setInterviewStage] = useState<InterviewStage>('pre-scan');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('input');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isIntroAudioPlaying, setIsIntroAudioPlaying] = useState(false);
  
  // ID and tracking state
  const [suspectId, setSuspectId] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [interviewedSuspects, setInterviewedSuspects] = useState<string[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Call management state
  const [isCallActive, setIsCallActive] = useState(false);
  const [sessionTimerKey, setSessionTimerKey] = useState(0);
  
  // Persist interrogated suspects across sessions
  const [savedInterrogatedSuspects, setSavedInterrogatedSuspects] = useState<string[]>([]);
  
  // Refs for managing async actions
  const isEndingRef = useRef<boolean>(false);

  // Set interaction mode with appropriate synchronization
  const setInteractionModeWithSync = useCallback((mode: InteractionMode) => {
    console.log('Setting interaction mode to:', mode);
    setInteractionMode(mode);
    
    // Ensure interview stage is correct based on interaction mode
    if (mode === 'call' && interviewStage !== 'interview') {
      console.log('Auto-updating interview stage to interview for call mode');
      setInterviewStage('interview');
    }
  }, [interviewStage, setInterviewStage]);

  // Set interview stage with appropriate synchronization
  const setInterviewStageWithSync = useCallback((stage: InterviewStage) => {
    console.log('Setting interview stage to:', stage);
    setInterviewStage(stage);
    
    // Reset interaction mode to input when changing major stages
    if (stage !== 'interview' && interactionMode === 'call') {
      console.log('Auto-resetting interaction mode to input');
      setInteractionMode('input');
    }
  }, [interactionMode, setInteractionMode]);

  // Handle player identification
  const setPlayerIdentity = useCallback((id: string) => {
    setPlayerId(id);
    setInterviewStageWithSync('post-scan');
    return id;
  }, [setInterviewStageWithSync]);

  // Start the interview session
  const startInterviewSession = useCallback(() => {
    console.log('🚀 Starting interview session');
    setIsIntroAudioPlaying(true);
    
    // Don't transition to interview stage yet - wait for audio to complete
    console.log('📢 Audio will play now, waiting for onAudioEnded callback');
    
    // Initialize session timer but don't activate it yet
    setSessionTimerKey(prev => prev + 1);
  }, [setIsIntroAudioPlaying]);

  // Handle intro audio ended
  const handleIntroAudioEnded = useCallback(() => {
    console.log('🔊 Intro audio ended, completing interview session setup');
    
    // First update audio playing state
    setIsIntroAudioPlaying(false);
    
    // Then set the interview stage
    console.log('📝 Setting interview stage to interview');
    setInterviewStageWithSync('interview');
    
    // Then activate the session
    console.log('⏱️ Activating session timer');
    setIsSessionActive(true);
    
    // Finally set the interaction mode
    console.log('📱 Setting interaction mode to input');
    setInteractionModeWithSync('input');
    
    // Reset suspect ID to clear any previous values
    setSuspectId('');
    
    console.log('✅ Interview session fully initialized');
  }, [setInterviewStageWithSync, setInteractionModeWithSync, setSuspectId]);

  // Check if all suspects have been called
  const allSuspectsCalled = useCallback(() => {
    return interviewedSuspects.length >= AVAILABLE_SUSPECTS.length;
  }, [interviewedSuspects]);

  // End the interview session
  const endInterviewSession = useCallback(async () => {
    if (isEndingRef.current) return; // Prevent multiple calls
    isEndingRef.current = true;
    
    console.log('Session ending');
    // Update UI states immediately to prevent further interaction
    setInterviewStage('ending');
    setIsSessionActive(false);
    setIsCallActive(false);
    setInteractionMode('input');
    
    // Convert suspect IDs to numbers for API call
    const calledSuspectIds = interviewedSuspects.map(id => parseInt(id));
    console.log('Called suspects:', interviewedSuspects, 'Converted to:', calledSuspectIds);
    
    // Call updateSelectedSuspect with the array of called suspect IDs
    try {
      await updateSelectedSuspect(playerId, calledSuspectIds);
      console.log('Updated selected suspects:', calledSuspectIds);
    } catch (error) {
      console.error('Error updating selected suspects:', error);
    }
    
    if (onSessionEnd) {
      onSessionEnd();
    }
  }, [interviewedSuspects, playerId, onSessionEnd, setInterviewStage, setIsSessionActive, setIsCallActive, setInteractionMode]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    // Only end session if it's still active
    if (isSessionActive) {
      endInterviewSession();
    }
    return { shouldRepeat: false };
  }, [isSessionActive, endInterviewSession]);

  // Reset the entire interview state
  const resetInterviewState = useCallback(() => {
    console.log('🧹 Completely resetting interview state for new player');
    
    // Reset core interview state
    setInterviewStage('pre-scan');
    setInteractionMode('input');
    setIsSessionActive(false);
    setIsIntroAudioPlaying(false);
    
    // Reset ID and tracking state
    setSuspectId('');
    setPlayerId('');
    setInterviewedSuspects([]);
    setLoginError(null);
    
    // Reset call management state
    setIsCallActive(false);
    setSessionTimerKey(prev => prev + 1); // Force timer reset
    
    // Reset persisted state
    setSavedInterrogatedSuspects([]);
    
    // Reset ref state
    isEndingRef.current = false;
    
    console.log('🔄 Interview state reset complete');
  }, [
    setInterviewStage,
    setInteractionMode,
    setIsSessionActive,
    setIsIntroAudioPlaying,
    setSuspectId,
    setPlayerId,
    setInterviewedSuspects,
    setLoginError,
    setIsCallActive,
    setSavedInterrogatedSuspects
  ]);

  // Hang up the current call
  const hangUpCall = useCallback(() => {
    console.log('Hanging up call and updating UI state');
    
    // Update UI state
    setInteractionMode('input');
    setIsCallActive(false);
    
    // Clear the suspect ID to reset the input field
    setSuspectId('');
    
    // Check if all suspects have been called
    if (allSuspectsCalled()) {
      endInterviewSession();
      return true;
    }
    
    // Make sure we're still in the interview stage
    if (interviewStage !== 'interview') {
      setInterviewStage('interview');
    }
    
    return true;
  }, [interactionMode, isCallActive, interviewStage, allSuspectsCalled, endInterviewSession, setSuspectId, setInteractionMode, setIsCallActive, setInterviewStage]);

  // Record a suspect as called
  const markSuspectCalled = useCallback((id: string) => {
    if (!interviewedSuspects.includes(id)) {
      setInterviewedSuspects(prev => [...prev, id]);
      return true;
    }
    return false;
  }, [interviewedSuspects]);

  // Display an error message that auto-dismisses
  const showError = useCallback((message: string, timeout = 3000) => {
    setLoginError(message);
    setTimeout(() => setLoginError(null), timeout);
  }, []);

  return {
    // State
    interviewStage,
    interactionMode,
    isSessionActive,
    suspectId,
    playerId,
    interviewedSuspects,
    savedInterrogatedSuspects,
    loginError,
    isCallActive,
    isIntroAudioPlaying,
    sessionTimerKey,
    
    // Setters
    setInterviewStage,
    setInteractionMode,
    setSuspectId,
    setPlayerId,
    setInterviewedSuspects,
    setSavedInterrogatedSuspects,
    setLoginError,
    setIsCallActive,
    setIsSessionActive,
    setIsIntroAudioPlaying,
    
    // Synchronized setters
    setInterviewStageWithSync,
    setInteractionModeWithSync,
    
    // Action methods
    startInterviewSession,
    endInterviewSession,
    resetInterviewState,
    handleIntroAudioEnded,
    handleTimerComplete,
    hangUpCall,
    setPlayerIdentity,
    markSuspectCalled,
    showError,
    allSuspectsCalled
  };
};

export default useInterviewState; 