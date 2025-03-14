import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../../utils/wavtools';
import { getSuspect } from '../../data/suspects';
import { Message } from '../../types/InterviewTypes';

interface UseCallHandlingProps {
  onCallEnded?: () => void;
  onCallStarted?: () => void;
}

const LOCAL_RELAY_SERVER_URL = process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';

// Singleton getter for RealtimeClient
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

/**
 * Custom hook to manage call functionality with OpenAI Realtime API
 */
const useCallHandling = ({ onCallEnded, onCallStarted }: UseCallHandlingProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  
  // Refs to manage audio and OpenAI client state
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );
  const currentResponseRef = useRef<string>('');
  const currentItemIdRef = useRef<string | null>(null);
  const processingRef = useRef<boolean>(false);
  const isEndingRef = useRef<boolean>(false);
  
  // Get the OpenAI Realtime client
  const client = getClient();
  
  // Initialize event handlers for the OpenAI client
  useEffect(() => {
    const wavStreamPlayer = wavStreamPlayerRef.current;

    const handleConversationUpdate = async ({ item, delta }: any) => {
      // Handle audio output - directly pass to wavStreamPlayer
      if (delta?.audio && item.role === 'assistant') {
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
  
  // Start a call with a suspect
  const startCall = useCallback(async (suspectId: string) => {
    console.log('Starting call for suspect:', suspectId);
    
    const suspect = getSuspect(suspectId);
    console.log('Found suspect:', suspect);
    if (!suspect) return false;

    try {
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
  
  You are being interrogated by a reporter at the police office about Erin's death. Stay in character and be consistent with your personality traits, background, and timeline. If asked about specific times, refer to your timeline but be evasive or defensive if the times involve suspicious activities. Keep responses concise - no more than 2-3 sentences.`,
        temperature: 0.9,
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: { type: 'server_vad' },
      });
      
      // @ts-expect-error voice is not in the type definition
      client.updateSession({ voice: suspect.voice });
  
      // Start recording with VAD
      await wavRecorder.record((data: { mono: Int16Array }) => {
        if (!processingRef.current) {
          client.appendInputAudio(data.mono);
        }
      });
  
      // Update state AFTER all initialization is complete
      setIsCallActive(true);
      setMessages([{
        role: 'assistant',
        content: '*Phone ringing*'
      }]);
      
      // Notify caller that call has started
      if (onCallStarted) {
        onCallStarted();
      }
      
      return true;
    } catch (error) {
      console.error('Error starting call:', error);
      return false;
    }
  }, [client, onCallStarted]);
  
  // End the current call
  const endCall = useCallback(() => {
    if (isEndingRef.current) return { shouldRepeat: false };
    
    console.log('Ending call');
    isEndingRef.current = true;
    
    try {
      // Only clean up if there's an active client
      if (client.isConnected()) {
        console.log('Disconnecting OpenAI client');
        try {
          client.disconnect();
        } catch (error) {
          console.error('Error disconnecting OpenAI client:', error);
        }
      }
      
      // Stop any audio playback
      try {
        wavStreamPlayerRef.current.interrupt();
      } catch (error) {
        console.error('Error interrupting audio playback:', error);
      }
      
      // Reset message state
      setMessages([]);
      setIsCallActive(false);
      
      // Stop recording
      try {
        const wavRecorder = wavRecorderRef.current;
        wavRecorder.end();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
      
      // Reset refs
      processingRef.current = false;
      currentItemIdRef.current = null;
      currentResponseRef.current = '';
      
      // Call the onCallEnded callback if provided
      if (onCallEnded) {
        onCallEnded();
      }
      
      // Ensure ending flag is reset after everything else
      setTimeout(() => {
        isEndingRef.current = false;
      }, 100);
      
    } catch (error) {
      console.error('Error during call cleanup:', error);
      isEndingRef.current = false;
    }
    
    return { shouldRepeat: false };
  }, [client, onCallEnded]);
  
  // Clean up when the component unmounts
  useEffect(() => {
    return () => {
      // Ensure we clean up all resources
      if (client.isConnected()) {
        client.disconnect();
      }
      
      wavRecorderRef.current.end();
      wavStreamPlayerRef.current.interrupt();
    };
  }, [client]);
  
  return {
    messages,
    isCallActive,
    startCall,
    endCall
  };
};

export default useCallHandling; 