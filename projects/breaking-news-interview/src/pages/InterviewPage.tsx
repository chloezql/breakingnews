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
  const [scanMode, setScanMode] = useState<'input' | 'call'>('input');
  const [suspectId, setSuspectId] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('26817d84-2ccd-41bc-b5cf-e55c59649de0');
  const [interrogatedSuspects, setInterrogatedSuspects] = useState<string[]>([]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentResponseRef = useRef<string>('');
  const currentItemIdRef = useRef<string | null>(null);
  const processingRef = useRef<boolean>(false);
  const isEndingRef = useRef<boolean>(false);

  // Audio handling setup
  const wavRecorderRef = useRef<WavRecorder>(
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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Check if this is a suspect ID scan with confirmation (ends with .)
    if (value.endsWith('.')) {
      const suspectId = value.slice(0, -1);
      if (validateSuspectId(suspectId)) {
        // Only allow starting a call if player ID has been set via RFID
        if (playerId) {
          setSuspectId(suspectId);
          
          // Check if suspect has already been interrogated
          if (interrogatedSuspects.includes(suspectId)) {
            playAlreadyInterrogatedAudio(suspectId);
          } else {
            setScanMode('call');
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
    } 
    // Check if this is a suspect selection with confirmation (ends with 0)
    else if (value.endsWith('0')) {
      const suspectId = value.slice(0, -1);
      if (validateSuspectId(suspectId)) {
        // Only allow selecting a suspect if player ID has been set via RFID
        if (playerId) {
          setSuspectId(suspectId);
          
          try {
            // Convert string ID to number for the API call
            const suspectIdNumber = parseInt(suspectId);
            
            // Call the API to update the selected suspect
            await updateSelectedSuspect(playerId, suspectIdNumber);
            
            // Show success message
            setLoginError('Suspect selected successfully!');
            
            // Play selection confirmation audio
            const audio = new Audio('/selection_confirmation.mp3');
            audio.onended = () => {
              // Clear the player ID and reset to pre-scan state after audio finishes
              setPlayerId('');
              setSuspectId('');
              setLoginError(null);
            };
            audio.play();
            
          } catch (error) {
            console.error('Error updating selected suspect:', error);
            setLoginError('Failed to select suspect. Please try again.');
            setTimeout(() => setLoginError(null), 3000);
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
      
Personality:
${suspect.personality.map(trait => '- ' + trait).join('\n')}

Background:
${suspect.background.map(detail => '- ' + detail).join('\n')}

Your Timeline on the Day of Erin's Death:
${suspect.timeline.map(event => `${event.time}: ${event.event}`).join('\n')}

Secret Motives (these influence your behavior but you won't admit to them directly):
${suspect.secretMotives.map(motive => '- ' + motive).join('\n')}

You are being interrogated by a reporter at the police office about Erin's death. Stay in character and be consistent with your personality traits, background, and timeline. If asked about specific times, refer to your timeline but be evasive or defensive if the times involve suspicious activities. Keep responses concise - no more than 2-3 sentences.`,
      temperature: 0.9,
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: { type: 'server_vad' },
      voice: suspect.voice as 'alloy' | 'shimmer' | 'echo'
    });

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

  const endCall = () => {
    // Add current suspect to the list of interrogated suspects
    if (suspectId && !interrogatedSuspects.includes(suspectId)) {
      setInterrogatedSuspects(prev => [...prev, suspectId]);
    }
    // Set a flag to indicate we're in the ending sequence
    isEndingRef.current = true;
    wavStreamPlayerRef.current.interrupt();

    // 1. Disconnect the client first to prevent further user input
    // This stops the microphone but allows audio output to continue
    const wavRecorder = wavRecorderRef.current;
    wavRecorder.end();
    
    // Add a message indicating the interview is ending
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '*Interview time expired*'
    }]);
    

    // Function to play guard audio after agent finishes
    const playGuardAudio = () => {
      // 3. Play a random guard audio file
      const guardAudioFiles = [
        'ElevenLabs_2025-03-09T04_08_11_Chris_pre_s50_sb75_se55_b_m2.mp3',
        'ElevenLabs_2025-03-09T04_04_51_Chris_pre_s50_sb75_se0_b_m2.mp3',
        'ElevenLabs_2025-03-09T04_03_28_Chris_pre_s50_sb75_se0_b_m2.mp3',
        'ElevenLabs_2025-03-09T04_02_54_Brian_pre_s50_sb75_se35_b_m2.mp3'
      ];
      
      const randomAudioFile = guardAudioFiles[Math.floor(Math.random() * guardAudioFiles.length)];
      const guardAudio = new Audio(`/guard-audios/${randomAudioFile}`);
      guardAudio.play().catch(err => {
        console.error('Failed to play guard audio:', err);
      });
      
      // Add a message indicating the guard is speaking
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '*Guard: Time is up. Interview terminated.*'
      }]);
      
      // 4. After guard audio finishes, reset the UI
      guardAudio.onended = () => {
        // Reset UI state
        setMessages([]);
        setSuspectId('');
        currentResponseRef.current = '';
        isEndingRef.current = false;

        // After the guard audio finishes, reconnect the WebSocket
        setTimeout(() => {
          console.log('Reconnecting WebSocket after call ended');
          reconnectWebSocket();
          setScanMode('input');
          setIsSessionActive(false);
        }, 1000); // Small delay to ensure everything is reset
      };
    };
    
    // 2. Wait for any in-progress responses to finish
    if (processingRef.current) {
      // If still processing, wait for it to finish
      const checkInterval = setInterval(() => {
        if (!processingRef.current) {
          clearInterval(checkInterval);
          playGuardAudio();
        }
      }, 500);
    } else {
      // If not processing, play guard audio immediately
      playGuardAudio();
    }
    
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
      } else if (item.formatted.transcript && item.status === 'completed') {
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

  return (
    <Box className="interview-page">
      {scanMode === 'input' && (
        <Box className="input-section">
          
          {/* Player ID display */}
          {playerId ? (
            <Box className="info-box success">
              <Typography variant="body1" className="info-text">
                Reporter ID: {playerId} ✓
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" className="faded-text">
                {wsConnected 
                  ? 'Please scan your reporter ID card'
                  : 'RFID Scanner disconnected. Please check connection.'}
              </Typography>
              
              {/* Manual player ID input for testing */}
              {!wsConnected && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Enter player ID manually:
                  </Typography>
                  <input 
                    type="text" 
                    placeholder="Enter player ID" 
                    onChange={(e) => setPlayerId(e.target.value)}
                    style={{ 
                      padding: '8px', 
                      marginTop: '8px',
                      width: '100%',
                      maxWidth: '300px'
                    }}
                  />
                </Box>
              )}
            </>
          )}
          
          {loginError && (
            <Box className="info-box error">
              <Typography variant="body2" className="info-text">
                Error: {loginError}
              </Typography>
            </Box>
          )}
          
          <input
            type="text"
            value={suspectId}
            onChange={handleInput}
            className="suspect-input"
            autoFocus
            placeholder="Suspect ID..."
            disabled={!playerId}
          />
          
          {!playerId && (
            <Typography variant="body2" sx={{ marginTop: '10px', opacity: 0.7 }}>
              You must scan your reporter ID card before interviewing a suspect
            </Typography>
          )}
        </Box>
      )}

      {scanMode === 'call' && (
        <Box className="call-section">
          {/* Blurred background with suspect image */}
          <Box className="blurred-content">
            {/* Fallback blur for browsers that don't support backdrop-filter */}
            <div className="blur-fallback"></div>
            
            <img 
              src={`/suspect-shadow/${suspectId === '1234' ? 'hart.png' : 
                    suspectId === '5678' ? 'kevin.png' : 
                    suspectId === '9876' ? 'lucy_marlow.png' : 'hart.png'}`}
              alt="Suspect Shadow"
              className="suspect-shadow"
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
            
          </Box>
          
          {/* Timer (not blurred) - positioned outside the blurred container */}
          <Box className="timer-container">
            <CountdownCircleTimer
              isPlaying={isSessionActive}
              duration={300}
              colors={['#00C853', '#FFC107', '#FF5722', '#F44336']}
              colorsTime={[300, 180, 60, 0]}
              onComplete={endCall}
              size={80}
            >
              {({ remainingTime }) => (
                <Typography className="timer-text">
                  {remainingTime}
                </Typography>
              )}
            </CountdownCircleTimer>
          </Box>
          
          {/* Chat messages */}
          <Box 
            ref={chatContainerRef}
            className="chat-container"
          >
            {messages.map((message, index) => (
              <Box 
                key={index} 
                className={`message ${message.role}`}
              >
                <Typography variant="body1">
                  {message.content}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default InterviewPage; 