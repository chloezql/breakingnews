import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../utils/wavtools';
import { getSuspect, validateSuspectId } from '../data/suspects';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentResponseRef = useRef<string>('');
  const currentItemIdRef = useRef<string | null>(null);
  const processingRef = useRef<boolean>(false);
  const audioQueueRef = useRef<{audio: Int16Array, id: string}[]>([]);
  const isPlayingAudioRef = useRef<boolean>(false);

  // Audio handling setup
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );
  const client = getClient();

  // Function to process the audio queue
  const processAudioQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0 || isPlayingAudioRef.current) {
      return;
    }

    isPlayingAudioRef.current = true;
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const { audio, id } = audioQueueRef.current[0];
    
    try {
      // Play the audio
      wavStreamPlayer.add16BitPCM(audio, id);
      
      // Estimate audio duration based on sample rate and buffer length
      // Assuming 24000 samples per second (from your sample rate)
      const durationMs = Math.ceil((audio.length / 24000) * 1000);
      
      // Wait for estimated duration plus a small buffer
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), durationMs + 100);
      });
      
      // Remove the played audio from the queue
      audioQueueRef.current.shift();
      
      // Set playing to false
      isPlayingAudioRef.current = false;
      
      // Process the next item in the queue
      processAudioQueue();
    } catch (error) {
      console.error('Error playing audio:', error);
      isPlayingAudioRef.current = false;
      audioQueueRef.current.shift(); // Remove the problematic audio
      processAudioQueue(); // Try the next one
    }
  }, []);

  // Add audio to the queue and process it
  const queueAudio = useCallback((audio: Int16Array, id: string) => {
    audioQueueRef.current.push({ audio, id });
    processAudioQueue();
  }, [processAudioQueue]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith('.')) {
      const suspectId = value.slice(0, -1);
      if (validateSuspectId(suspectId)) {
        setSuspectId(suspectId);
        setScanMode('call');
        await startCall(suspectId);
      }
    } else {
      setSuspectId(value);
    }
  };

  const startCall = async (id: string) => {
    console.log('Starting call for suspect:', id);
    const suspect = getSuspect(id);
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

    // Set up the conversation parameters with VAD
    client.updateSession({
      instructions: `You are ${suspect.name} (Suspect #${suspect.id}). Here is your personality and background:
      
Personality:
${suspect.personality.map(trait => '- ' + trait).join('\n')}

Background:
${suspect.background.map(detail => '- ' + detail).join('\n')}

Your Timeline on the Day of Erin's Death:
${suspect.timeline.map(event => `${event.time}: ${event.event}`).join('\n')}

Secret Motives (these influence your behavior but you won't admit to them directly):
${suspect.secretMotives.map(motive => '- ' + motive).join('\n')}

You are being interrogated by a reporter over the phone about Erin's death. Stay in character and be consistent with your personality traits, background, and timeline. If asked about specific times, refer to your timeline but be evasive or defensive if the times involve suspicious activities. Keep responses concise - no more than 2-3 sentences.`,
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
    setIsSessionActive(false);
    setScanMode('input');
    setSuspectId('');
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '*Call ended*'
    }]);

    client.disconnect();

    const wavRecorder = wavRecorderRef.current;
    wavRecorder.end();

    const wavStreamPlayer = wavStreamPlayerRef.current;
    wavStreamPlayer.interrupt();

    processingRef.current = false;
    currentItemIdRef.current = null;
    currentResponseRef.current = '';

    return { shouldRepeat: false };
  };

  // Set up realtime client event handlers
  useEffect(() => {
    const wavStreamPlayer = wavStreamPlayerRef.current;

    const handleConversationUpdate = async ({ item, delta }: any) => {
      // Handle audio output
      console.log(delta);
      if (delta?.audio) {
        // Instead of playing immediately, add to queue
        queueAudio(delta.audio, item.id);
      }
      
      // Handle text output
      if (item.role === 'assistant') {
        if (delta?.text) {
          // Log the agent's text
          console.log(`Agent: ${delta.text}`);
          setLogs(prevLogs => [...prevLogs, `Agent: ${delta.text}`]);

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

    client.on('conversation.updated', handleConversationUpdate);

    return () => {
      client.off('conversation.updated', handleConversationUpdate);
      client.reset();
    };
  }, [queueAudio]);

  return (
    <Box className="interview-page">
      {scanMode === 'input' && (
        <Box className="input-section">
          <Typography variant="h5">
            Enter suspect ID followed by a dot (.) to confirm
          </Typography>
          <input
            type="text"
            value={suspectId}
            onChange={handleInput}
            className="suspect-input"
            autoFocus
          />
        </Box>
      )}

      {scanMode === 'call' && (
        <Box className="call-section">
          <Box className="timer">
            <CountdownCircleTimer
              isPlaying={isSessionActive}
              duration={60}
              colors={['#004777', '#F7B801', '#A30000']}
              colorsTime={[60, 30, 0]}
              onComplete={endCall}
            >
              {({ remainingTime }) => remainingTime}
            </CountdownCircleTimer>
          </Box>
          
          <Paper className="transcript-container" ref={chatContainerRef}>
            {messages.map((message, index) => (
              <Box
                key={message.id || index}
                className={`message ${message.role}`}
              >
                <Typography>{message.content}</Typography>
              </Box>
            ))}
          </Paper>

          {/* <Box className="log-section">
            <Typography variant="h6">Logs</Typography>
            <Paper className="log-container">
              {logs.map((log, index) => (
                <Typography key={index}>{log}</Typography>
              ))}
            </Paper>
          </Box> */}
        </Box>
      )}
    </Box>
  );
};

export default InterviewPage; 