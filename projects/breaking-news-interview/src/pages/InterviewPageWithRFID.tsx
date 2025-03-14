import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../utils/wavtools';
import { getSuspect, validateSuspectId, worldBackground } from '../data/suspects';
import { useWebSocket } from '../hooks/useWebSocket';
import { findPlayerByCardId, updateSelectedSuspect } from '../services/api';
import '../styles/InterviewPage.scss';

const LOCAL_RELAY_SERVER_URL = process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

const TOTAL_INTERVIEW_TIME = 5 * 60; // 5 minutes in seconds
const AVAILABLE_SUSPECTS = ['1234', '5678', '9876']; // List of available suspect IDs

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

const InterviewPage: React.FC = () => {
  // New state variables for the enhanced UI flow
  const [appState, setAppState] = useState<'pre-scan' | 'post-scan' | 'interview' | 'ending'>('pre-scan');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [calledSuspects, setCalledSuspects] = useState<string[]>([]); // Track which suspects have been called
  const [sessionStarted, setSessionStarted] = useState(false); // Track if the 5-minute session has started
  const [sessionTimerKey, setSessionTimerKey] = useState(0); // Key for resetting the timer
  
  // Original state variables
  const [scanMode, setScanMode] = useState<'input' | 'call'>('input');
  const [suspectId, setSuspectId] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [interrogatedSuspects, setInterrogatedSuspects] = useState<string[]>([]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentResponseRef = useRef<string>('');
  const currentItemIdRef = useRef<string | null>(null);
  const processingRef = useRef<boolean>(false);
  const isEndingRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio handling setup
  const wavRecorderRef =useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );
  const client = getClient();

  // Load interrogated suspects from localStorage on component mount
  useEffect(() => {
    const savedInterrogatedSuspects = localStorage.getItem('interrogatedSuspects');
    if (savedInterrogatedSuspects) {
      setInterrogatedSuspects(JSON.parse(savedInterrogatedSuspects));
    }
    
    // Focus the input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Create audio element for the Tony audio
    audioRef.current = new Audio('/guard-audios/Station4_Tony_02.wav');
    audioRef.current.addEventListener('ended', () => {
      console.log('Audio ended, starting interview session');
      setAudioPlaying(false);
      // Move from post-scan to interview mode and start the actual interview
      setAppState('interview');
      setSessionStarted(true);
      setScanMode('input'); // Ensure we're in input mode
      
      // Reset the suspect input field
      setSuspectId('');
      
      // This will force the input field to focus
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    });

    return () => {
      // Clean up audio element on unmount
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', () => {});
      }
    };
  }, []);

  // Save interrogated suspects to localStorage when the list changes
  useEffect(() => {
    localStorage.setItem('interrogatedSuspects', JSON.stringify(interrogatedSuspects));
  }, [interrogatedSuspects]);

  // WebSocket handler for RFID card scanning
  const handleWebSocketMessage = useCallback(async (data: any) => {
    if (data.type === 'rfid_scan' && !playerId) {
      console.log('RFID card scanned:', data.cardId);
      setLoginError(null);
      
      try {
        const playerData = await findPlayerByCardId(data.cardId);
        console.log('Player data received:', playerData);
        if (playerData && playerData[0]?.id) {
          setPlayerId(playerData[0].id);
          console.log('Setting player ID:', playerData[0].id);
          
          // Update app state to post-scan after successful RFID scan
          setAppState('post-scan');
          
          // Only disconnect WebSocket if we're in production mode
          // This allows for easier debugging in development
          // if (process.env.NODE_ENV === 'production') {
            disconnectWebSocket();
          // }
        } else {
          console.log('No valid player data received');
          setLoginError('No player found for this card');
        }
      } catch (err) {
        setLoginError('Error finding player');
        console.error(err);
      } finally {
      }
    }
  }, []);

  // Set up WebSocket connection
  const { sendMessage, disconnect: disconnectWebSocket, reconnect: reconnectWebSocket } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => setWsConnected(true),
    onDisconnect: () => setWsConnected(false)
  });

  // Monitor app state changes to reconnect WebSocket when returning to pre-scan
  useEffect(() => {
    if (appState === 'pre-scan') {
      console.log('Reconnecting WebSocket for new RFID scans');
      reconnectWebSocket();
    }
  }, [appState, reconnectWebSocket]);

  // Reset all local states to starting values
  const resetAllStates = () => {
    setAppState('pre-scan');
    setAudioPlaying(false);
    setCalledSuspects([]);
    setSessionStarted(false);
    setScanMode('input');
    setSuspectId('');
    setPlayerId('');
    setMessages([]);
    setIsSessionActive(false);
    setLoginError(null);
    setSessionTimerKey(prev => prev + 1); // Force timer reset
    currentResponseRef.current = '';
    currentItemIdRef.current = null;
    processingRef.current = false;
    isEndingRef.current = false;
  };

  // Already existing useEffect for scrolling the chat container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle key press 9 to start the interview
  const handleKeyNine = () => {
    if (appState === 'post-scan' && !audioPlaying) {
      setAudioPlaying(true);
      // Play the Tony audio
      if (audioRef.current) {
        audioRef.current.play();
      }
      // After audio ends, the interview starts (handled by the audio ended event)
    }
  };

  // Function to determine if all suspects have been called
  const allSuspectsCalled = () => {
    return calledSuspects.length >= AVAILABLE_SUSPECTS.length;
  };

  // Handle the session ending
  const handleSessionEnd = async () => {
    console.log('Session ending');
    setAppState('ending');
    setSessionStarted(false);
    
    // Disconnect OpenAI client if active
    if (client.isConnected()) {
      client.disconnect();
    }
    
    // End any active recording
    wavRecorderRef.current.end();
    wavStreamPlayerRef.current.interrupt();
    
    // Convert suspect IDs to numbers for API call
    const calledSuspectIds = calledSuspects.map(id => parseInt(id));
    console.log('Called suspects:', calledSuspects, 'Converted to:', calledSuspectIds);
    
    // Call updateSelectedSuspect with the array of called suspect IDs
    try {
      await updateSelectedSuspect(playerId, calledSuspectIds);
      console.log('Updated selected suspects:', calledSuspectIds);
    } catch (error) {
      console.error('Error updating selected suspects:', error);
    }
    
    // Play the appropriate ending audio
    const audioFile = allSuspectsCalled() 
        ? '/guard-audios/Station4_Tony_03A.wav' // All suspects interviewed
        : '/guard-audios/Station4_Tony_03.wav';  // Time's up
    
    const endAudio = new Audio(audioFile);
    
    endAudio.onended = () => {
      // Reset all states when audio finishes
      resetAllStates();
    };
    
    endAudio.play().catch(err => {
      console.error('Failed to play ending audio:', err);
      // If there's an error playing audio, still reset states
      setTimeout(resetAllStates, 1000);
    });
  };

  // Function to handle the timer completion
  const handleTimerComplete = () => {
    // Only end session if it's still active
    if (sessionStarted) {
      handleSessionEnd();
    }
    return { shouldRepeat: false };
  };

  // Handle hang up call with key 0
  const hangUpCall = () => {
    if (scanMode === 'call' && isSessionActive) {
      // End the current call
      endCall(false); // Pass false to indicate this isn't a timer-triggered end
      
      // Check if all suspects have been called
      if (allSuspectsCalled()) {
        handleSessionEnd();
      } else {
        // Otherwise, return to input mode to call another suspect
        setScanMode('input');
        setIsSessionActive(false);
        // Make sure to clear the input field
        setSuspectId('');
      }
    }
  };

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Input value:', value);
    
    // When in post-scan state and not session started, treat 9 as the trigger to start
    if (appState === 'post-scan' && !sessionStarted && value === '9') {
      handleKeyNine();
      return;
    }
    
    // Skip input handling when in pre-scan state or when in post-scan but session not started
    if (appState === 'pre-scan' || (appState === 'post-scan' && !sessionStarted)) {
      console.log('Skipping input handling in', appState, 'state, sessionStarted:', sessionStarted);
      setSuspectId(value); // Still update the field value, just don't process it
      return;
    }
    
    // Handle hang up with key 0
    if (value === '0' && scanMode === 'call') {
      hangUpCall();
      setSuspectId('');
      return;
    }
    
    // Check if this is a suspect ID scan with confirmation (ends with .)
    if (value.endsWith('.')) {
      console.log('Suspect ID with confirmation:', value);
      // if player only pressed 5 and then ., play an intro audio
      if (value === '5.') {
        const introAudio = new Audio('/suspect-intro.mp3');
        setSuspectId('');
        introAudio.play();
        return;
      }
      
      const suspectId = value.slice(0, -1);
      console.log('Checking suspect ID:', suspectId, 'Valid:', validateSuspectId(suspectId));
      if (validateSuspectId(suspectId)) {
        // Only allow starting a call if player ID has been set via RFID
        if (playerId) {
          setSuspectId(suspectId);
          
          // Check if suspect has already been called in this session
          if (calledSuspects.includes(suspectId)) {
            setLoginError('You already interviewed this suspect.');
            setTimeout(() => setLoginError(null), 3000);
            setSuspectId('');
          } 
          // Check if session is active
          else if (!sessionStarted) {
            setLoginError('Session not started. Press 9 to begin.');
            setTimeout(() => setLoginError(null), 3000);
            setSuspectId('');
          }
          else {
            console.log('Starting call with suspect:', suspectId);
            setScanMode('call');
            // Add this suspect to the called list
            setCalledSuspects(prev => [...prev, suspectId]);
            await startCall(suspectId);
          }
        } else {
          setLoginError('Please scan your reporter ID card first');
          setTimeout(() => setLoginError(null), 3000);
        }
      } else {
        setLoginError('Invalid suspect ID');
        setTimeout(() => setLoginError(null), 3000);
      }
    } else {
      setSuspectId(value);
    }
  };

  // Play fallback audio for already interrogated suspects
  const playAlreadyInterrogatedAudio = (suspectId: string) => {
    
    // Play a notification sound
    const audio = new Audio('/guard_try_to_talk_again.mp3');
    
    audio.onended = () => {
      // Clear the message after audio finishes
        setMessages([]);
        setSuspectId('');
    };
    
    audio.onerror = () => {
      console.error('Error playing audio');
      // Clear the message if audio fails
      setTimeout(() => {
        setMessages([]);
        setSuspectId('');
      }, 1000);
    };
    
    // Start playing the audio
    audio.play().catch(err => {
      console.error('Failed to play audio:', err);
      // Clear the message if audio fails
      setTimeout(() => {
        setMessages([]);
        setSuspectId('');
      }, 1000);
    });
  };

  const startCall = async (id: string) => {
    console.log('Starting call for suspect:', id);
    
    // Update app state to interview mode
    setAppState('interview');
    
    const suspect = getSuspect(id);
    console.log('Found suspect:', suspect);
    if (!suspect) return;

    // Disconnect WebSocket before starting the call to avoid conflicts
    console.log('Disconnecting WebSocket before starting call');
    disconnectWebSocket();

    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    // Ensure client is connected
    if (!client.isConnected()) {
      await client.connect();
    }

    // Connect to microphone
    await wavRecorder.begin();

    // Connect to audio output
    await wavStreamPlayer.connect();
 
    console.log('Suspect:', suspect);
    // Set up the conversation parameters with VAD
    client.updateSession({
    instructions: `You are ${suspect.name} You are currently detained in a police station as a suspect in the death of Erin Carter. Here is your personality and background:

Here is your personality and background:

relationship: ${suspect.relationship}
      
Personality:
${suspect.personality.map(trait => '- ' + trait).join('\n')}

Background:
${suspect.background.map(detail => '- ' + detail).join('\n')}

Your Timeline on the Day of Erin's Death:
${suspect.timeline.map(event => `${event.time}: ${event.event}`).join('\n')}

Secret Motives (these influence your behavior but you won't admit to them directly):
${suspect.secretMotives.map(motive => '- ' + motive).join('\n')}

${worldBackground}

You are being interrogated by a reporter at the police office about Erin's death. Stay in character and be consistent with your personality traits, background, and timeline. If asked about specific times, refer to your timeline but be evasive or defensive if the times involve suspicious activities. Keep responses concise - no more than 2-3 sentences.`,
      temperature: 0.9,
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: { type: 'server_vad' },
    });
    
    // @ts-expect-error voice is not in the type definition
    client.updateSession({ voice: suspect.voice }); // Modified this line

    // Start recording with VAD
    await wavRecorder.record((data: { mono: Int16Array }) => {
      if (!processingRef.current) {
        client.appendInputAudio(data.mono);
      }
    });

    setIsSessionActive(true);
    setMessages([{
      role: 'assistant',
      content: '*Phone ringing*'
    }]);
  };

  const endCall = (isTimerTriggered = true) => {
    // Only clean up if there's an active client
    if (client.isConnected()) {
      // Disconnect the client
      console.log('Disconnecting OpenAI client');
      client.disconnect();
    }
    
    isEndingRef.current = true;
    wavStreamPlayerRef.current.interrupt();
    
    // Reset to input mode and clear messages
    setScanMode('input');
    setMessages([]);
    
    // Clear suspect ID if it was a hang up (not timer triggered)
    if (!isTimerTriggered) {
      setSuspectId('');
    }
    
    // Focus the input after a short delay to ensure DOM is updated
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    
    // Stop recording
    const wavRecorder = wavRecorderRef.current;
    wavRecorder.end();
    
    // Return the expected type for onComplete
    return { shouldRepeat: false };
  };

  // Set up realtime client event handlers
  useEffect(() => {
    const wavStreamPlayer = wavStreamPlayerRef.current;

    const handleConversationUpdate = async ({ item, delta }: any) => {
      // Handle audio output - directly pass to wavStreamPlayer without queuing
      if (delta?.audio && item.role === 'assistant') {
        // Play audio directly without queuing
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      
      // Handle text output
      if (item.role === 'assistant') {
        if (delta?.text) {
          // If this is a new response, reset the current response
          if (item.id !== currentItemIdRef.current) {
            // End any previous processing
            if (currentItemIdRef.current) {
              processingRef.current = false;
            }
            
            currentResponseRef.current = delta.text;
            currentItemIdRef.current = item.id;
            processingRef.current = true;
            
            // Add a new message
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: delta.text,
              id: item.id
            }]);
          } else {
            // Update existing message with accumulated text
            currentResponseRef.current += delta.text;
            
            setMessages(prev => {
              return prev.map(msg => 
                msg.id === item.id 
                  ? { ...msg, content: currentResponseRef.current }
                  : msg
              );
            });
          }
          
          if (item.status === 'completed') {
            processingRef.current = false;
            currentItemIdRef.current = null;
            currentResponseRef.current = '';
          }
        }
      } else if (item.formatted?.transcript && item.status === 'completed') {
        // Only add user transcripts when they're complete
        setMessages(prev => [...prev, {
          role: 'user',
          content: item.formatted.transcript
        }]);
      }
    };

    const handleConversationInterrupted = () => {
      console.log('Conversation interrupted');
      wavStreamPlayer.interrupt();
      processingRef.current = false;
    };

    client.on('conversation.updated', handleConversationUpdate);
    client.on('conversation.interrupted', handleConversationInterrupted);

    return () => {
      client.off('conversation.updated', handleConversationUpdate);
      client.off('conversation.interrupted', handleConversationInterrupted);
      client.reset();
    };
  }, []);

  // Focus input field whenever we're in input mode and playerId is set
  useEffect(() => {
    if (scanMode === 'input' && inputRef.current && playerId) {
      inputRef.current.focus();
    }
  }, [scanMode, playerId]);

  // Ensure input is focused after component updates
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (scanMode === 'input' && inputRef.current && playerId) {
        inputRef.current.focus();
      }
    }, 100); // Small delay to ensure DOM is ready
    
    return () => clearTimeout(focusTimer);
  });

  // Add global keyboard event listener to focus input when any key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle key press 9 for starting interview
      if (e.key === '9' && appState === 'post-scan' && !audioPlaying) {
        handleKeyNine();
        return;
      }
      
      // Handle key press 0 for hanging up call
      if (e.key === '0' && scanMode === 'call' && isSessionActive) {
        hangUpCall();
        return;
      }
      
      // Original keyboard focus handling
      if (scanMode === 'input' && 
          playerId && 
          inputRef.current && 
          document.activeElement !== inputRef.current) {
        
        // Ignore modifier keys and function keys
        if (!e.ctrlKey && !e.altKey && !e.metaKey && 
            !/^(F\d|Tab|Escape|Control|Alt|Shift|Meta)$/.test(e.key)) {
          inputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scanMode, playerId, appState, audioPlaying, isSessionActive]);

  return (
    <Box className="interview-page" sx={{
      backgroundImage: `url('/empty-interrogation-room.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      {/* Debug display */}
      <Box 
        sx={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 9999,
          maxWidth: '300px',
          fontSize: '12px',
          fontFamily: 'monospace',
          textAlign: 'left'
        }}
      >
        <div><strong>Debug Info:</strong></div>
        <div>App State: {appState}</div>
        <div>Scan Mode: {scanMode}</div>
        <div>Session Started: {sessionStarted ? 'Yes' : 'No'}</div>
        <div>Current Input: "{suspectId}"</div>
        <div>Called Suspects: {calledSuspects.join(', ') || 'None'}</div>
        <div>Audio Playing: {audioPlaying ? 'Yes' : 'No'}</div>
        <div>Player ID: {playerId || 'None'}</div>
        <div>isSessionActive: {isSessionActive ? 'Yes' : 'No'}</div>
      </Box>

      {/* Timer - displayed during post-scan and interview states */}
      {(appState === 'post-scan' || appState === 'interview') && sessionStarted && (
        <Box className="session-timer" sx={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 20
        }}>
          <CountdownCircleTimer
            key={sessionTimerKey}
            isPlaying={sessionStarted}
            duration={TOTAL_INTERVIEW_TIME}
            colors={['#00C853', '#FFC107', '#FF5722', '#F44336']}
            colorsTime={[TOTAL_INTERVIEW_TIME, TOTAL_INTERVIEW_TIME * 0.6, TOTAL_INTERVIEW_TIME * 0.2, 0]}
            onComplete={handleTimerComplete}
            size={160}
            strokeWidth={8}
          >
            {({ remainingTime }) => {
              // Convert seconds to minutes:seconds format
              const minutes = Math.floor(remainingTime / 60);
              const seconds = remainingTime % 60;
              return (
                <Typography className="timer-text" sx={{ 
                  fontSize: '28px',
                  fontWeight: 'bold'
                }}>
                  {`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}
                </Typography>
              );
            }}
          </CountdownCircleTimer>
        </Box>
      )}

      {/* Pre-scan state: Show blurred background with text to scan ID */}
      {appState === 'pre-scan' && (
        <Box className="pre-scan-overlay" sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Add blurred background overlay */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: -1
          }} />
          
          <Typography variant="h2" sx={{ 
            color: 'white', 
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '20px',
            zIndex: 2 // Ensure text is above the blur
          }}>
            SCAN YOUR ID CARD
          </Typography>
          
          {/* Add websocket connection status */}
          <Typography variant="body2" className="faded-text" sx={{ color: 'white', marginTop: '20px', zIndex: 2 }}>
            {wsConnected 
              ? 'Waiting for card scan...'
              : 'RFID Scanner disconnected. Please check connection.'}
          </Typography>
          
          {loginError && (
            <Box className="info-box error" sx={{ marginTop: '20px', zIndex: 2 }}>
              <Typography variant="body2" className="info-text">
                Error: {loginError}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Post-scan state: Show police image with press 9 text */}
      {appState === 'post-scan' && (
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
            justifyContent: 'center'
          }}>
            <img 
              src="/police-arm-up.png" 
              alt="Police officer with raised arm" 
              style={{ 
                maxHeight: '80vh',
                maxWidth: '100%',
                bottom: '-100px'
              }}
            />
            
            {/* Show different text based on if audio is playing */}
            <Typography variant="h2" sx={{ 
              color: 'white', 
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '20px',
              position: 'absolute',
              bottom: '10%'
            }}>
              {audioPlaying 
                ? "" 
                : sessionStarted 
                  ? "Input code to call your suspect" 
                  : "Press 9 on your phone to start"}
            </Typography>
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
              <Typography variant="body2" sx={{ color: '#0099ff' }}>
                Reporter: {playerId}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Input field for suspect ID - only show when session has started and in input mode */}
      {sessionStarted && scanMode === 'input' && appState === 'interview' && (
        <Box className="interview-input-overlay" sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 15
        }}>
          <Typography variant="h2" sx={{ 
            color: 'white', 
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            Input code to call your suspect
          </Typography>
          
          <Box sx={{ 
            width: '300px',
            textAlign: 'center',
          }}>
            <Typography variant="body1" sx={{ 
              color: 'white', 
              marginBottom: '10px',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
            }}>
              Enter suspect ID followed by a dot (.)
            </Typography>
            <input
              type="text"
              value={suspectId}
              onChange={handleInput}
              className="suspect-input"
              autoFocus
              placeholder="Suspect ID..."
              ref={inputRef}
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
            {calledSuspects.length > 0 && (
              <Typography variant="body1" sx={{ 
                color: 'white', 
                marginTop: '15px',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
              }}>
                Interviewed: {calledSuspects.length}/{AVAILABLE_SUSPECTS.length}
              </Typography>
            )}
            
            <Box sx={{ marginTop: '20px' }}>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
              }}>
                Available suspects: {AVAILABLE_SUSPECTS.join(', ')}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Error display - show in all states */}
      {loginError && (
        <Box className="info-box error" sx={{ 
          position: 'absolute',
          top: '20px',
          right: '80px', // Move to the left of the timer
          padding: '5px 10px',
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          borderRadius: '5px',
          border: '1px solid #F44336',
          zIndex: 999
        }}>
          <Typography variant="body2" sx={{ color: '#F44336' }}>
            Error: {loginError}
          </Typography>
        </Box>
      )}

      {/* Call section - displayed when in call mode */}
      {scanMode === 'call' && (
        <Box className="call-section">
          {/* Blurred background with suspect image */}
          <Box className="blurred-content">
            {/* Fallback blur for browsers that don't support backdrop-filter */}
            <div className="blur-fallback"></div>
            
            <img 
              src={suspectId === '1234' ? '/dr.hart.png' : 
                   suspectId === '5678' ? '/kevin-profile-image.png' : 
                   suspectId === '9876' ? '/lucy.png' : ''}
              alt="Suspect"
              style={{
                maxHeight: '40vh',
                maxWidth: '35vw',
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1,
                objectFit: 'contain',
                borderRadius: '10px'
              }}
            />
            
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
                <Typography variant="body2" sx={{ color: '#0099ff' }}>
                  Reporter: {playerId}
                </Typography>
              </Box>
            )}
            
            {/* Hang up instruction */}
            <Box 
              sx={{
                position: 'absolute',
                top: '20px',
                right: '100px', // Position to the left of the timer
                padding: '5px 10px',
                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                borderRadius: '5px',
                border: '1px solid #F44336',
                zIndex: 2
              }}
            >
              <Typography variant="body2" sx={{ color: '#F44336' }}>
                Press 0 to hang up
              </Typography>
            </Box>
          </Box>
          
          {/* Chat messages */}
          <Box 
            ref={chatContainerRef}
            className="chat-container"
            sx={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              maxWidth: '800px',
              maxHeight: '30vh',
              padding: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '10px',
              overflowY: 'auto',
              zIndex: 10,
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            {messages.map((message, index) => (
              <Box 
                key={index} 
                className={`message ${message.role}`}
                sx={{
                  padding: '10px',
                  margin: '5px 0',
                  borderRadius: '5px',
                  backgroundColor: message.role === 'user' 
                    ? 'rgba(0, 153, 255, 0.2)' 
                    : 'rgba(255, 255, 255, 0.2)',
                  textAlign: message.role === 'user' ? 'right' : 'left',
                  maxWidth: '80%',
                  marginLeft: message.role === 'user' ? 'auto' : '0',
                  marginRight: message.role === 'user' ? '0' : 'auto',
                }}
              >
                <Typography variant="body1" sx={{ color: 'white' }}>
                  {message.content}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      
      {/* Ending state - wait for audio to finish */}
      {appState === 'ending' && (
        <Box className="ending-overlay" sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          position: 'relative',
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }}>
          <Typography variant="h2" sx={{ 
            color: 'white', 
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '20px'
          }}>
            {allSuspectsCalled() 
              ? "Good work, reporter." 
              : "Time's up."}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default InterviewPage; 