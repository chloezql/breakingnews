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
  
  // Create a ref to hold the endCall function to avoid circular dependencies
  const endCallRef = useRef<() => { shouldRepeat: boolean }>();
  
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
  
  // End the current call with improved error handling and cleanup
  const endCall = useCallback(() => {
    if (isEndingRef.current) {
      console.log('Call end already in progress, ignoring duplicate request');
      return { shouldRepeat: false };
    }
    
    console.log('Ending call with complete cleanup');
    isEndingRef.current = true;
    
    try {
      // Stop audio playback immediately
      try {
        console.log('Interrupting audio playback');
        wavStreamPlayerRef.current.interrupt();
      } catch (error) {
        console.error('Error interrupting audio playback:', error);
      }
      
      // Stop recording immediately
      try {
        console.log('Stopping recording');
        const wavRecorder = wavRecorderRef.current;
        wavRecorder.end();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
      
      // Disconnect from OpenAI
      if (client.isConnected()) {
        console.log('Disconnecting OpenAI client');
        try {
          client.disconnect();
        } catch (error) {
          console.error('Error disconnecting OpenAI client:', error);
        }
      }
      
      // Reset message state and other UI state
      setMessages([]);
      setIsCallActive(false);
      
      // Reset refs
      processingRef.current = false;
      currentItemIdRef.current = null;
      currentResponseRef.current = '';
      
      // Call the onCallEnded callback if provided
      if (onCallEnded) {
        console.log('Calling onCallEnded callback');
        onCallEnded();
      }
    } catch (error) {
      console.error('Critical error during call cleanup:', error);
    } finally {
      // Always make sure the ending flag is reset
      setTimeout(() => {
        isEndingRef.current = false;
        console.log('Call end process complete, reset ending flag');
      }, 100);
    }
    
    return { shouldRepeat: false };
  }, [client, onCallEnded]);
  
  // Store the latest endCall function in the ref
  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);
  
  // Start a call with a suspect
  const startCall = useCallback(async (suspectId: string) => {
    console.log('Starting call for suspect:', suspectId);
    
    // Already have an active call? Clean it up first
    if (isCallActive && endCallRef.current) {
      console.log('Call already active, cleaning up first');
      endCallRef.current();
    }
    
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
      instructions: `You are ${suspect.name} You are currently being interrogated in a small, dimly lit police station as a suspect in the death of Erin Carter. This is the morning of the next day Erin was found dead. A cop stares at you, waiting for your response. Every hesitation makes you look more guilty. 
      Remain in-character, referring to the details below. Your goal is to avoid suspicion while staying truthful to your personality and timeline.
      Speak with short, direct answers (1-2 sentences). 
      Avoid disclaimers like "As an AI model..." or "How can I assist you today?" or revealing your internal motives outright.
      Here is your general background information:${suspect.info}
      Your Personality & Speaking Style:${suspect.personality}

      Your Current Emotion (How you feel right now, influences your tone and responses):${suspect.currentEmotion}

      Your Secret Motives (do not reveal these unless pressured appropriately)${suspect.motives}
      Your Timeline on the Day of Erin's Death (reference these events if asked about specific times):
      ${suspect.timeline.map(event => `${event.time}: ${event.event}`).join('\n')}

      Other Suspects (What you know about them, share if relevant or asked):

      ${suspect.otherSuspects.map((other) => `${other.name}: ${other.background}`).join("\n")}

      You are being interrogated about Erin's death. Stay in character, be consistent with your personal details, and only reveal what aligns with your knowledge and motives. Evasive or defensive answers are appropriate if pressed on suspicious activities. 
      Keep responses concise.
      - Speak naturally, not like a robot. Do not state facts mechanically—answer as a real person would under pressure.
      - If a question contradicts your story, react accordingly (confused, defensive, frustrated). If it touches your interest and motives, you could ask for lawyer.
      - If asked about past statements, acknowledge them ("I already told you...").

      `,
       temperature: 0.9,
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: { type: 'server_vad' }
      });
      
      // @ts-expect-error voice is not in the type definition
      client.updateSession({ voice: suspect.voice });
  

      // Make the agent speak first by sending an initial message using sendUserMessageContent
      client.sendUserMessageContent([{
        type: 'input_text',
        text: 'Hello? Are you there?'
      }]);

      // Start recording with VAD
      await wavRecorder.record((data: { mono: Int16Array }) => {
        if (!processingRef.current) {
          client.appendInputAudio(data.mono);
        }
      });
  
      // Update state AFTER all initialization is complete
      console.log('✅ Call setup complete, marking call as active');
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
      // Ensure we reset the call state on error
      setIsCallActive(false);
      return false;
    }
  }, [client, onCallStarted, isCallActive]);
  
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