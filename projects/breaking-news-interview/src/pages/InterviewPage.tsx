import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../utils/wavtools';
import { getSuspect, validateSuspectId, worldBackground } from '../data/suspects';
import { findPlayerByCardId, updateSelectedSuspect } from '../services/api';
import '../styles/InterviewPage.scss';
import { codeToCardId } from '../types/codeToCardId';

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
  const [playerId, setPlayerId] = useState<string>('');
  const [interrogatedSuspects, setInterrogatedSuspects] = useState<string[]>([]);
  const [codeInput, setCodeInput] = useState<string>('');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const suspectInputRef = useRef<HTMLInputElement>(null);
  const currentResponseRef = useRef<string>('');
  const currentItemIdRef = useRef<string | null>(null);
  const processingRef = useRef<boolean>(false);
  const isEndingRef = useRef<boolean>(false);

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
    if (suspectInputRef.current) {
      suspectInputRef.current.focus();
    }
  }, []);

  // Save interrogated suspects to localStorage when the list changes
  useEffect(() => {
    localStorage.setItem('interrogatedSuspects', JSON.stringify(interrogatedSuspects));
  }, [interrogatedSuspects]);

  // Handle code input and convert to card ID
  const handleCodeInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCodeInput(value);
    
    // Check if this is a code with confirmation (ends with 1)
    if (value.endsWith('1')) {
      const code = value.slice(0, -1);
      const cardId = codeToCardId[code as keyof typeof codeToCardId];
      
      if (cardId) {
        setLoginError(null);
        try {
          const playerData = await findPlayerByCardId(cardId);
          console.log('Player data received:', playerData);
          if (playerData && playerData[0]?.id) {
            setPlayerId(playerData[0].id);
            console.log('Setting player ID:', playerData[0].id);
            // Clear the code input after successful login
            setCodeInput('');
            // Focus on the suspect input after a short delay to allow for rendering
            setTimeout(() => {
              if (suspectInputRef.current) {
                suspectInputRef.current.focus();
              }
            }, 100);
          } else {
            console.log('No valid player data received');
            setLoginError('No player found for this code');
            setTimeout(() => {
              setLoginError(null);
              setCodeInput('');
            }, 3000);
          }
        } catch (err) {
          setLoginError('Error finding player');
          console.error(err);
          setTimeout(() => {
            setLoginError(null);
            setCodeInput('');
          }, 3000);
        }
      } else {
        setLoginError('Invalid code');
        setTimeout(() => {
          setLoginError(null);
          setCodeInput('');
        }, 3000);
      }
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Check if this is a suspect ID scan with confirmation (ends with 1)
    if (value.endsWith('1')) {
      // // if player only pressed 5 and then ., play an intro audio
      // if (value === '5.') {
      //   const introAudio = new Audio('/suspect-intro.mp3');
      //   setSuspectId('');
      //   introAudio.play();
      //   return;
      // }
      
      const suspectId = value.slice(0, -1);
      if (validateSuspectId(suspectId)) {
        // Only allow starting a call if player ID has been set
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
          setLoginError('Please enter your reporter code first');
          setTimeout(() => setLoginError(null), 3000);
        }
      } else {
        setLoginError('Invalid suspect ID');
        setTimeout(() => setLoginError(null), 3000);
        setSuspectId('');
      }
    } 
    // Check if this is a suspect selection with confirmation (ends with 0)
    else if (value.endsWith('3')) {
      const suspectId = value.slice(0, -1);
      if (validateSuspectId(suspectId)) {
        // Only allow selecting a suspect if player ID has been set
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
          setLoginError('Please enter your reporter code first');
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
      instructions: `You are ${suspect.name} You are currently being interrogated in a small, dimly lit police station as a suspect in the death of Erin Carter. A cop stares at you, waiting for your response. Every hesitation makes you look more guilty. 
      Remain in-character, referring to the details below. Your goal is to avoid suspicion while staying truthful to your personality and timeline.
      Speak with short, direct answers (1-2 sentences). 
      Avoid disclaimers like "As an AI model..." or revealing your internal motives outright.
      Here is your general background information:${suspect.info}
      Your Personality & Speaking Style:${suspect.personality}

      Your Current Emotion (How you feel right now, influences your tone and responses):${suspect.currentEmotion}

      Your Secret Motives (do not reveal these unless pressured appropriately)${suspect.motives}
      Your Timeline on the Day of Erin's Death (reference these events if asked about specific times):
      ${suspect.timeline.map(event => `${event.time}: ${event.event}`).join('\n')}

      Other Suspects (What you know about them, share if relevant or asked):

      ${suspect.otherSuspects.map((other) => `${other.name}: ${other.background}`).join("\n")}

      You are being interrogated about Erin's death. Stay in character, be consistent with your personal details, and only reveal what aligns with your knowledge and motives. Evasive or defensive answers are appropriate if pressed on suspicious activities. Keep responses concise.
      - Speak naturally, not like a robot. Do not state facts mechanically—answer as a real person would under pressure.
      - If a question contradicts your story, react accordingly (confused, defensive, frustrated).
      - If asked about past statements, acknowledge them ("I already told you...").
      - Keep responses **short (1-2 sentences)** unless additional detail is demanded.

      `,
      temperature: 0.9,
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: { type: 'server_vad' }
    });
    
    // Add voice property to session update
    client.updateSession({ 
      voice: suspect.voice 
    } as any);

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
    // Disconnect from the OpenAI client
    console.log('Disconnecting OpenAI client');
    client.disconnect();
    isEndingRef.current = true;
    wavStreamPlayerRef.current.interrupt();
    
    // Reset to input mode and clear suspect ID
    setScanMode('input');
    setSuspectId('');
    
    // Focus the input after a short delay to ensure DOM is updated
    setTimeout(() => {
      if (suspectInputRef.current) {
        suspectInputRef.current.focus();
      }
    }, 100);
    
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
        wavStreamPlayerRef.current.interrupt();
        isEndingRef.current = false;
   
        processingRef.current = false;
        currentItemIdRef.current = null;

        // After the guard audio finishes, reset the UI
        setTimeout(() => {
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

  // Focus input field whenever we're in input mode and playerId is set
  useEffect(() => {
    if (scanMode === 'input' && suspectInputRef.current && playerId) {
      suspectInputRef.current.focus();
    }
  }, [scanMode, playerId]);

  // Ensure input is focused after component updates
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (scanMode === 'input' && suspectInputRef.current && playerId) {
        suspectInputRef.current.focus();
      }
    }, 100); // Small delay to ensure DOM is ready
    
    return () => clearTimeout(focusTimer);
  });

  // Add global keyboard event listener to focus input when any key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle key events when in input mode and not already focused on an input
      if (scanMode === 'input') {
        // Ignore modifier keys and function keys
        if (!e.ctrlKey && !e.altKey && !e.metaKey && 
            !/^(F\d|Tab|Escape|Control|Alt|Shift|Meta)$/.test(e.key)) {
          
          // If player ID is not set, focus on code input
          if (!playerId && codeInputRef.current && 
              document.activeElement !== codeInputRef.current) {
            codeInputRef.current.focus();
          }
          
          // If player ID is set, focus on suspect input
          if (playerId && suspectInputRef.current && 
              document.activeElement !== suspectInputRef.current) {
            suspectInputRef.current.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scanMode, playerId]);

  return (
    <Box className="interview-page">
      {scanMode === 'input' && (
        <Box className="input-section">
          
          {/* Player ID input section - only show if no player ID yet */}
          {!playerId && (
            <Box className="code-input-container">
              <Typography variant="body1" className="info-text">
                Enter your 2-digit reporter code, and then press enter (e.g., "11 enter")
              </Typography>
              <input
                type="text"
                value={codeInput}
                onChange={handleCodeInput}
                className="suspect-input"
                autoFocus
                placeholder="Reporter code..."
                ref={codeInputRef}
              />
            </Box>
          )}
          
          {/* Player ID display */}
          {playerId && (
            <Box className="info-box success">
              <Typography variant="body1" className="info-text">
                Reporter ID: {playerId} ✓
              </Typography>
            </Box>
          )}
          
          {loginError && (
            <Box className="info-box error">
              <Typography variant="body2" className="info-text">
                Error: {loginError}
              </Typography>
            </Box>
          )}
          
          {/* Suspect ID input - only show if player ID is set */}
          {playerId && (
            <>
              <input
                type="text"
                value={suspectId}
                onChange={handleInput}
                className="suspect-input"
                autoFocus
                placeholder="Suspect ID..."
                ref={suspectInputRef}
              />
              <Typography variant="body2" sx={{ marginTop: '10px', opacity: 0.7 }}>
                To call a suspect: Enter suspect ID and then press enter (e.g., "7298 enter")
                To select a suspect: Enter suspect ID and then press Select (e.g., "7298 Select")
              </Typography>
            </>
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
              src={`/suspect-shadow/${suspectId === '7298' ? 'hart.png' : 
                    suspectId === '4692' ? 'kevin.png' : 
                    suspectId === '5746' ? 'lucy_marlow.png' : ''}`}
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
              duration={90}
              colors={['#00C853', '#FFC107', '#FF5722', '#F44336']}
              colorsTime={[90, 60, 30, 0]}
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