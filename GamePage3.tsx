/**
 * Running a local relay server will allow you to hide your API key
 * and run custom logic on the server
 *
 * Set the local relay server address to:
 * REACT_APP_LOCAL_RELAY_SERVER_URL=http://localhost:8081
 *
 * This will also require you to set OPENAI_API_KEY= in a `.env` file
 * You can run it with `npm run relay`, in parallel with `npm start`
 */
const LOCAL_RELAY_SERVER_URL: string =
  process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';

import { useEffect, useRef, useCallback, useState } from 'react';


import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';
import { WavRenderer} from '../utils/wav_renderer';
import { agentsJson, GameStateUpdaters, PlayerProfile as PlayerProfile } from '../game-metadata/agents2';
import { X, Edit, Zap, ArrowUp, ArrowDown, Mic, MicOff } from 'react-feather';
import { Button } from '../components/button/Button';
import { Toggle } from '../components/toggle/Toggle';

import './GamePage3.scss';
import { DiceRoll } from '../components/dice/DiceRoll';
import { generateFluxProfilePicture } from '../components/genimage/ImageGeneratorFlux';


/**
 * Type for all event logs
 */
interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  event: { [key: string]: any };
}



export interface GamePage3Props {
  onShowInstructions: () => void;
}

export function GamePage3({ onShowInstructions }: GamePage3Props) {

  //To-do list for level objectives
  const [todos, setTodos] = useState<Record<string, boolean>>({});
  // Inventory
  const [inventory, setInventory] = useState<string[]>([]);

  // Conversation goals/objectives
  const [convoGoals, setConvoGoals] = useState<Record<string, any>>({});

  // In GamePage.tsx, add this state for text input
  const [textInput1, setTextInput1] = useState<string>('');
  const [textInput2, setTextInput2] = useState<string>('');
  const [textInput3, setTextInput3] = useState<string>('');

  // Replace the single isRecording state with three separate states
  const [isRecording1, setIsRecording1] = useState(false);
  const [isRecording2, setIsRecording2] = useState(false);
  const [isRecording3, setIsRecording3] = useState(false);
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<number>(1);

  // Add this state near your other useState declarations
  const [playerProfiles, setPlayerProfiles] = useState<{
    [playerId: number]: PlayerProfile;
  }>({
    1: { 
      name: 'Player 1', 
      actions: [], 
      stat1: 3, 
      stat2: 3,
      descriptor: '',
      type: '',
      role: ''
    },
    2: { 
      name: 'Player 2', 
      actions: [], 
      stat1: 3, 
      stat2: 3,
      descriptor: '',
      type: '',
      role: ''
    },
    3: { 
      name: 'Player 3', 
      actions: [], 
      stat1: 3, 
      stat2: 3,
      descriptor: '',
      type: '',
      role: ''
    }
  });

  /**
   * Ask user for API Key
   * If we're using the local relay server, we don't need this
   */
  const apiKey = LOCAL_RELAY_SERVER_URL
    ? ''
    : localStorage.getItem('tmp::voice_api_key') ||
      prompt('OpenAI API Key') ||
      '';
  if (apiKey !== '') {
    localStorage.setItem('tmp::voice_api_key', apiKey);
  }

  /**
   * Instantiate:
   * - WavRecorder (speech input)
   * - WavStreamPlayer (speech output)
   * - RealtimeClient (API client)
   */
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient(
      LOCAL_RELAY_SERVER_URL
        ? { url: LOCAL_RELAY_SERVER_URL }
        : {
            apiKey: apiKey,
            dangerouslyAllowAPIKeyInBrowser: true,
          }
    )
  );

  /**
   * References for
   * - Rendering audio visualization (canvas)
   * - Autoscrolling event logs
   * - Timing delta for event log displays
   */
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventsScrollHeightRef = useRef(0);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  /**
   * All of our variables for displaying application state
   * - items are all conversation items (dialog)
   * - realtimeEvents are event logs, which can be expanded
   * - memoryKv is for set_memory() function
   * - coords, marker are for get_weather() function
   */
  const [items, setItems] = useState<ItemType[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<{
    [key: string]: boolean;
  }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [canPushToTalk, setCanPushToTalk] = useState(true);


  /**
   * Utility for formatting the timing of logs
   */
  const formatTime = useCallback((timestamp: string) => {
    const startTime = startTimeRef.current;
    const t0 = new Date(startTime).valueOf();
    const t1 = new Date(timestamp).valueOf();
    const delta = t1 - t0;
    const hs = Math.floor(delta / 10) % 100;
    const s = Math.floor(delta / 1000) % 60;
    const m = Math.floor(delta / 60_000) % 60;
    const pad = (n: number) => {
      let s = n + '';
      while (s.length < 2) {
        s = '0' + s;
      }
      return s;
    };
    return `${pad(m)}:${pad(s)}.${pad(hs)}`;
  }, []);

  /**
   * When you click the API key
   */
  const resetAPIKey = useCallback(() => {
    const apiKey = prompt('OpenAI API Key');
    if (apiKey !== null) {
      localStorage.clear();
      localStorage.setItem('tmp::voice_api_key', apiKey);
      window.location.reload();
    }
  }, []);

  /**
   * Connect to conversation:
   * WavRecorder taks speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    // Set state variables
    startTimeRef.current = new Date().toISOString();

    // Connect to microphone
    await wavRecorder.begin();

    // Connect to audio output
    await wavStreamPlayer.connect();

    // Connect to realtime API
    await client.connect();
    if (client.getTurnDetectionType() === 'server_vad') {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    }
    setIsConnected(true);
    setRealtimeEvents([]);
    setItems(client.conversation.getItems());

  }, []);

  /**
   * Disconnect and reset conversation state
   */
  const disconnectConversation = useCallback(async () => {
    setIsConnected(false);
    setRealtimeEvents([]);
    setItems([]);

    const client = clientRef.current;
    client.disconnect();

    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.end();

    const wavStreamPlayer = wavStreamPlayerRef.current;
    await wavStreamPlayer.interrupt();
  }, []);

    /**
     * Disconnect from conversation without resetting state
     */
    const disconnectConversationKeepState = useCallback(async () => {
      setIsConnected(false);

      const client = clientRef.current;
      client.disconnect();

      const wavRecorder = wavRecorderRef.current;
      await wavRecorder.end();

      const wavStreamPlayer = wavStreamPlayerRef.current;
      await wavStreamPlayer.interrupt();
    }, []);
    /**
     * Function to cycle to the next agent
     */
    const nextAgent = useCallback(async () => {
      // Disconnect current session if connected
      const client = clientRef.current;
      if (client.isConnected()) {
        await disconnectConversation();
      }
  
      // Update currentAgentIndex
      setCurrentAgentIndex((prevIndex) => (prevIndex + 1) % agentsJson.length);
    }, [disconnectConversation]);
  

  const deleteConversationItem = useCallback(async (id: string) => {
    const client = clientRef.current;
    client.deleteItem(id);
  }, []);

  /**
   * In push-to-talk mode, start recording
   * .appendInputAudio() for each sample
   */
  const addPlayerPrefix = (text: string, playerNumber: number) => {
    return `[Player ${playerNumber}]: ${text}`;
  };

  /**
   * Handles switching between players and notifies the AI
   */
  const switchToPlayer = async (playerId: number) => {
    if (currentPlayer !== playerId) {
      const client = clientRef.current;
      await client.sendUserMessageContent([
        { type: 'input_text', text: `<context> Switching to Player ${playerId} </context>`}
      ]);
    }
    setCurrentPlayer(playerId);
    await new Promise(resolve => setTimeout(resolve, 0)); // Ensure state updates
  };

  // Update text handlers
  const handleTextSubmit1 = async () => {
    await switchToPlayer(1);
    if (textInput1.trim() && isConnected) {
      clientRef.current.sendUserMessageContent([
        { type: 'input_text', text: addPlayerPrefix(textInput1, 1) }
      ]);
      setTextInput1('');
    }
  };

  const handleTextSubmit2 = async () => {
    await switchToPlayer(2);
    if (textInput2.trim() && isConnected) {
      clientRef.current.sendUserMessageContent([
        { type: 'input_text', text: addPlayerPrefix(textInput2, 2) }
      ]);
      setTextInput2('');
    }
  };

  const handleTextSubmit3 = async () => {
    await switchToPlayer(3);
    if (textInput3.trim() && isConnected) {
      clientRef.current.sendUserMessageContent([
        { type: 'input_text', text: addPlayerPrefix(textInput3, 3) }
      ]);
      setTextInput3('');
    }
  };

  const startRecording1 = async () => {
    setIsRecording1(true);
    const client = clientRef.current;
    // Send context message first

    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const trackSampleOffset = await wavStreamPlayer.interrupt();
    if (trackSampleOffset?.trackId) {
      const { trackId, offset } = trackSampleOffset;
      await client.cancelResponse(trackId, offset);
    }
    await wavRecorder.record((data) => client.appendInputAudio(data.mono));
     
  };

  const startRecording2 = async () => {
    setIsRecording2(true);
    const client = clientRef.current;
    //client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const trackSampleOffset = await wavStreamPlayer.interrupt();
    if (trackSampleOffset?.trackId) {
      const { trackId, offset } = trackSampleOffset;
      await client.cancelResponse(trackId, offset);
    }
    await wavRecorder.record((data) => client.appendInputAudio(data.mono));
  };

  const startRecording3 = async () => {
    setIsRecording3(true);
    const client = clientRef.current;
    //client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const trackSampleOffset = await wavStreamPlayer.interrupt();
    if (trackSampleOffset?.trackId) {
      const { trackId, offset } = trackSampleOffset;
      await client.cancelResponse(trackId, offset);
    }
    await wavRecorder.record((data) => client.appendInputAudio(data.mono));
  };

  /**
   * In push-to-talk mode, stop recording
   */
  const stopRecording1 = async () => {
    setIsRecording1(false);
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.pause();
    await switchToPlayer(1);
    await client.createResponse();
  };

  const stopRecording2 = async () => {
    setIsRecording2(false);
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.pause();
    await switchToPlayer(2);
    await client.createResponse();
  };

  const stopRecording3 = async () => {
    setIsRecording3(false);
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.pause();
    await switchToPlayer(3);
    await client.createResponse();
  };

  /**
   * Switch between Manual <> VAD mode for communication
   */
  const changeTurnEndType = async (value: string) => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    if (value === 'none' && wavRecorder.getStatus() === 'recording') {
      await wavRecorder.pause();
    }
    client.updateSession({
      turn_detection: value === 'none' ? null : { type: 'server_vad' },
    });
    
    if (value === 'server_vad' && client.isConnected()) {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    }
    setCanPushToTalk(value === 'none');
  };

  /**
   * Auto-scroll the event logs
   */
  useEffect(() => {
    if (eventsScrollRef.current) {
      const eventsEl = eventsScrollRef.current;
      const scrollHeight = eventsEl.scrollHeight;
      // Only scroll if height has just changed
      if (scrollHeight !== eventsScrollHeightRef.current) {
        eventsEl.scrollTop = scrollHeight;
        eventsScrollHeightRef.current = scrollHeight;
      }
    }
  }, [realtimeEvents]);

  /**
   * Auto-scroll the conversation logs
   */
  useEffect(() => {
    const conversationEls = [].slice.call(
      document.body.querySelectorAll('[data-conversation-content]')
    );
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement;
      conversationEl.scrollTop = conversationEl.scrollHeight;
    }
  }, [items]);


  /**
   * Set up render loops for the visualization canvas
   */
  useEffect(() => {
    let isLoaded = true;

    const wavRecorder = wavRecorderRef.current;
    const clientCanvas = clientCanvasRef.current;
    let clientCtx: CanvasRenderingContext2D | null = null;

    const wavStreamPlayer = wavStreamPlayerRef.current;
    const serverCanvas = serverCanvasRef.current;
    let serverCtx: CanvasRenderingContext2D | null = null;

    const render = () => {
      if (isLoaded) {
        if (clientCanvas) {
          if (!clientCanvas.width || !clientCanvas.height) {
            clientCanvas.width = clientCanvas.offsetWidth;
            clientCanvas.height = clientCanvas.offsetHeight;
          }
          clientCtx = clientCtx || clientCanvas.getContext('2d');
          if (clientCtx) {
            clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
            const result = wavRecorder.recording
              ? wavRecorder.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              clientCanvas,
              clientCtx,
              result.values,
              '#0099ff',
              10,
              0,
              8
            );
          }
        }
        if (serverCanvas) {
          if (!serverCanvas.width || !serverCanvas.height) {
            serverCanvas.width = serverCanvas.offsetWidth;
            serverCanvas.height = serverCanvas.offsetHeight;
          }
          serverCtx = serverCtx || serverCanvas.getContext('2d');
          if (serverCtx) {
            serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
            const result = wavStreamPlayer.analyser
              ? wavStreamPlayer.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              serverCanvas,
              serverCtx,
              result.values,
              '#009900',
              10,
              0,
              8
            );
          }
        }
        window.requestAnimationFrame(render);
      }
    };
    render();

    return () => {
      isLoaded = false;
    };
  }, []);

  const [diceVisible, setDiceVisible] = useState(false);
  const [diceValue, setDiceValue] = useState<1|2|3|4|5|6>(1);
  const setDiceResult = (result: 1 | 2 | 3 | 4 | 5 | 6): void => {
    setDiceVisible(true);
    setDiceValue(result);
    setTimeout(() => {
      setDiceVisible(false);
    }, 10000);
  };



  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events and more
   */
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    // Set instructions
    client.updateSession({ temperature: 1 });
    // Set transcription, otherwise we don't get user transcriptions back
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });


    // handle realtime events from client + server for event logging
    client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
      setRealtimeEvents((realtimeEvents) => {
        const lastEvent = realtimeEvents[realtimeEvents.length - 1];
        if (lastEvent?.event.type === realtimeEvent.event.type) {
          // if we receive multiple events in a row, aggregate them for display purposes
          lastEvent.count = (lastEvent.count || 0) + 1;
          return realtimeEvents.slice(0, -1).concat(lastEvent);
        } else {
          return realtimeEvents.concat(realtimeEvent);
        }
      });
    });
    client.on('error', (event: any) => console.error(event));
    client.on('conversation.interrupted', async () => {
      console.log(items)
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);

      }
    });
    client.on('conversation.updated', async ({ item, delta }: any) => {
      const items = client.conversation.getItems();

      if (item.type === 'function_call_output') {
        console.log("Function call output:", item);
        await client.createResponse();
        console.log("Response created");
      }

      // Add player prefix based on which recording state was active
      if (item.role === 'user' && item.formatted.transcript) {
        if (isRecording1) {
          item.formatted.transcript = `[Player 1]: ${item.formatted.transcript}`;
        } else if (isRecording2) {
          item.formatted.transcript = `[Player 2]: ${item.formatted.transcript}`;
        } else if (isRecording3) {
          item.formatted.transcript = `[Player 3]: ${item.formatted.transcript}`;
        }
      }
      
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        );
        item.formatted.file = wavFile;
      }
      setItems(items);
    });

    setItems(client.conversation.getItems());

    return () => {
      // cleanup; resets to defaults
      client.reset();
    };
  }, []);

  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events and more
   */
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    // Get the current agent
    const currentAgent = agentsJson[currentAgentIndex];
    console.log('Loading agent:', currentAgent?.name);
    console.log('Agent index:', currentAgentIndex);

    // Set base instructions with agent name and current player
    const instructions = `You are ${currentAgent.name}, ${currentAgent.promptInstructions}`;
    console.log('Setting instructions for:', currentAgent.name);
    console.log('Instructions:', instructions);
    
    // Set instructions and include current player in metadata
    client.updateSession({ 
      instructions, 
      temperature: 0.95,
      
      
    });

    // @ts-expect-error voice is not in the type definition
    client.updateSession({ voice: currentAgent.voice }); // Modified this line


    // Set transcription, otherwise we don't get user transcriptions back
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });

    client.tools = {};
    
    // Set up GameStateUpdaters
    const gameStateUpdaters: GameStateUpdaters = {
      getStat1: (playerId: number) => playerProfiles[playerId].stat1,
      getStat2: (playerId: number) => playerProfiles[playerId].stat2,
      setPlayerProfiles: setPlayerProfiles, 
      setStat1: (newValue) => {
        console.log("setStat1", newValue);
        setPlayerProfiles(current => ({
          ...current,
          [currentPlayer]: {
            ...current[currentPlayer],
            stat1: newValue
          }
        }));
      },
      setStat2: (newValue) => {
        console.log("setStat2", newValue);
        setPlayerProfiles(current => ({
          ...current,
          [currentPlayer]: {
            ...current[currentPlayer],
            stat2: newValue
          }
        }));
      },
      getTodos: () => todos,
      setTodos,
      getInventory: () => inventory,
      setInventory,
      getConvoGoals: () => convoGoals,
      setConvoGoals,
      sendAssistantMessageContent: (content: string) => {
        client.sendUserMessageContent([{ type: 'input_text', text: content }]);
      },
      sendAssistantAudioContent: () => {
        // Send a minimal valid PCM audio buffer encoded as base64
        const emptyPCM = new Uint8Array(2); // Minimal 16-bit PCM sample
        const base64Audio = btoa(String.fromCharCode(...emptyPCM));
        client.sendUserMessageContent([{ type: 'input_audio', audio: base64Audio }]);
      },
      disconnectConversation: async () => {
        console.log("disconnectConversation");
        return Promise.resolve();
      },
      getPlayerProfile: (playerId: number) => playerProfiles[playerId],
      setPlayerName: (playerId: number, name: string) => {
        setPlayerProfiles(current => ({
          ...current,
          [playerId]: {
            ...current[playerId],
            name
          }
        }));
      },
      addPlayerAction: (playerId: number, action: string, success: boolean) => {
        setPlayerProfiles(current => ({
          ...current,
          [playerId]: {
            ...current[playerId],
            actions: [...current[playerId].actions, {
              action,
              success,
              timestamp: Date.now()
            }]
          }
        }));
      },
      setPlayerAttributes: (playerId: number, descriptor: string, type: string, role: string) => {
        setPlayerProfiles(current => {
          const updatedProfiles = {
            ...current,
            [playerId]: {
              ...current[playerId],
              descriptor,
              type,
              role
            }
          };
          console.log('Updated profile:', updatedProfiles[playerId]);
          return updatedProfiles;
        });
      },
      simulatePTT: async (playerId: number) => {
        // First switch to the correct player
        await switchToPlayer(playerId);
        
        // Simulate start recording
        const client = clientRef.current;
        const wavRecorder = wavRecorderRef.current;
        const wavStreamPlayer = wavStreamPlayerRef.current;
        
        // Interrupt any current playback
        const trackSampleOffset = await wavStreamPlayer.interrupt();
        if (trackSampleOffset?.trackId) {
          const { trackId, offset } = trackSampleOffset;
          await client.cancelResponse(trackId, offset);
        }
        
        // Send empty audio and create response
        await client.sendUserMessageContent([{ type: 'input_audio', audio: '' }]);
        await client.createResponse();
      },
    showDice: (result: 1 | 2 | 3 | 4 | 5 | 6) => {
      setDiceResult(result);
    },
    updateProfilePicture: async (playerId: number, updateProfile?: Partial<PlayerProfile>) => {
      // Get latest profile state to avoid timing issues
      const profile = {...playerProfiles[playerId], ...updateProfile};
      
      try {
        const imageUrl = await generateFluxProfilePicture(profile);
        setPlayerProfiles(current => {
          const updatedProfile = {
            ...current[playerId],
            profilePictureUrl: imageUrl || undefined // Convert null to undefined
          };
          return {
            ...current,
            [playerId]: updatedProfile
          };
        });
      } catch (error) {
        console.error('Failed to generate profile picture:', error);
      }
    }
    };


    // Add tools from current agent
    if (currentAgent.toolFunctions) {
      try {
        for (const [_, toolDef] of Object.entries(currentAgent.toolFunctions)) {
          client.addTool({
            type: "function",
            name: toolDef.name,
            description: toolDef.description,
            parameters: toolDef.parameters
          }, toolDef.function(gameStateUpdaters, currentPlayer));
          console.log(`Added tool: ${toolDef.name}`);
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes("Tool already added")) {
          console.log(`Ignoring error: Tool already added`);
        } else {
          // Re-throw any other errors
          throw e;
        }
      }
    }

    // Add tools...
    // (rest of your existing code)

  }, [currentAgentIndex, currentPlayer, playerProfiles]); 


  // Add this useEffect to handle agent index changes
  useEffect(() => {
    setPlayerProfiles(current => {
      const newStats = currentAgentIndex === 0 
        ? { stat1: 3, stat2: 3 }
        : { stat1: 0, stat2: 0 };
      
      return {
        1: { ...current[1], ...newStats },
        2: { ...current[2], ...newStats },
        3: { ...current[3], ...newStats }
      };
    });
  }, [currentAgentIndex]); // This effect runs whenever currentAgentIndex changes

  // Add this useEffect to monitor playerProfiles changes
  useEffect(() => {
    console.log('playerProfiles updated:', playerProfiles);
  }, [playerProfiles]);

  /**
   * Render the application
   */
  return (
    <div data-component="GamePage">
      <div className="content-top">
        <div className="content-title">
          <img src="./volley-logo-yellow.png" width="24" height="24" />
          <span>Crown Quest</span>
        </div>
        <div className="action-buttons">
              <Button
                label={isConnected ? 'disconnect' : 'connect'}
                iconPosition={isConnected ? 'end' : 'start'}
                icon={isConnected ? X : Zap}
                buttonStyle={isConnected ? 'neutral' : 'action'}
                onClick={isConnected ? disconnectConversation : connectConversation}
              />
            </div>

        <div className="content-api-key">
          {!LOCAL_RELAY_SERVER_URL && (
            <Button
              icon={Edit}
              iconPosition="end"
              buttonStyle="flush"
              label={`api key: ${apiKey.slice(0, 3)}...`}
              onClick={() => resetAPIKey()}
            />
          )}
        </div>
      </div>
      <div className="content-main">
        <div className="content-logs">
          <div className="content-block conversation">
            <div className="content-block-title">
              <div className="title-wrapper">
                <img 
                  src="./conversation-crown.png" 
                  width="30" 
                  height="30" 
                  alt="Crown Icon"
                  className="title-icon"
                />
                <span className="title-text">Conversation</span>
              </div>
            </div>
            <div className="content-block-body" data-conversation-content>
              {!items.length && `awaiting connection...`}
              {items.map((conversationItem, i) => {
                if (conversationItem.type?.includes('function_call')) {
                  return null;
                }
                return (
                  <div className="conversation-item" key={conversationItem.id}>
                    <div className={`speaker ${conversationItem.role || ''}`}>
                      <div>
                        {(
                          conversationItem.role === "assistant" ? "Dungeon Master" : (conversationItem.role || conversationItem.type)
                        ).replaceAll('_', ' ')}
                      </div>
                    </div>
                    <div className={`speaker-content`}>
                      {/* tool response 
                      {conversationItem.type === 'function_call_output' && (
                        <div>{conversationItem.formatted.output}</div>
                      )}
                      */}
                      {/* tool call 
                      {!!conversationItem.formatted.tool && (
                        <div>
                          {conversationItem.formatted.tool.name}(
                          {conversationItem.formatted.tool.arguments})
                        </div>
                      )}
                      */}
                      {!conversationItem.formatted.tool &&
                        conversationItem.role === 'user' && (
                          <div>
                            {conversationItem.formatted.transcript ||
                              (conversationItem.formatted.audio?.length
                                ? '(awaiting transcript)'
                                : conversationItem.formatted.text ||
                                  '(item sent)')}
                          </div>
                        )}
                      {!conversationItem.formatted.tool &&
                        conversationItem.role === 'assistant' && (
                          <div>
                            {conversationItem.formatted.transcript ||
                              conversationItem.formatted.text ||
                              '(truncated)'}
                          </div>
                        )}
                      {/* {conversationItem.formatted.file && (
                        <audio
                          src={conversationItem.formatted.file.url}
                          controls
                        />
                      )} */}
                    </div>
                  </div>
                );
              })}

          </div>
          <div className="visualization">
              <div className="visualization-entry client">
                <canvas ref={clientCanvasRef} />
              </div>
              <div className="visualization-entry server">
                <canvas ref={serverCanvasRef} />
              </div>
            </div>

            </div>

          <div className="content-actions">
            <div className="ptt-buttons">
              <div className="player-controls">
                <Button
                  label="Player 1"
                  buttonStyle={isRecording1 ? 'alert' : 'regular'}
                  disabled={!isConnected}
                  onMouseDown={startRecording1}
                  onMouseUp={stopRecording1}
                  icon={isConnected ? Mic : MicOff}
                />
                <div className="text-input-container">
                  <input
                    type="text"
                    value={textInput1}
                    onChange={(e) => setTextInput1(e.target.value)}
                    placeholder="Player 1 message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTextSubmit1();
                      }
                    }}
                    disabled={!isConnected || isRecording1}
                  />
                  <Button
                    label="Send"
                    buttonStyle="neutral"
                    disabled={!isConnected || !textInput1.trim() || isRecording1}
                    onClick={handleTextSubmit1}
                  />
                </div>
              </div>

              <div className="player-controls">
                <Button
                  label="Player 2"
                  buttonStyle={isRecording2 ? 'alert' : 'regular'}
                  disabled={!isConnected}
                  onMouseDown={startRecording2}
                  onMouseUp={stopRecording2}
                  icon={isConnected ? Mic : MicOff}
                />
                <div className="text-input-container">
                  <input
                    type="text"
                    value={textInput2}
                    onChange={(e) => setTextInput2(e.target.value)}
                    placeholder="Player 2 message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTextSubmit2();
                      }
                    }}
                    disabled={!isConnected || isRecording2}
                  />
                  <Button
                    label="Send"
                    buttonStyle="neutral"
                    disabled={!isConnected || !textInput2.trim() || isRecording2}
                    onClick={handleTextSubmit2}
                  />
                </div>
              </div>

              <div className="player-controls">
                <Button
                  label="Player 3"
                  buttonStyle={isRecording3 ? 'alert' : 'regular'}
                  icon={isConnected ? Mic : MicOff}
                  disabled={!isConnected}
                  onMouseDown={startRecording3}
                  onMouseUp={stopRecording3}
                />
                <div className="text-input-container">
                  <input
                    type="text"
                    value={textInput3}
                    onChange={(e) => setTextInput3(e.target.value)}
                    placeholder="Player 3 message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTextSubmit3();
                      }
                    }}
                    disabled={!isConnected || isRecording3}
                  />
                  <Button
                    label="Send"
                    buttonStyle="neutral"
                    disabled={!isConnected || !textInput3.trim() || isRecording3}
                    onClick={handleTextSubmit3}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-right">
          <div className="instructions">
            <div className="content-block-title">
              <div className="title-wrapper">
                <img 
                  src="./parchment-icon.png" 
                  width="50" 
                  height="30" 
                  alt="Scroll Icon"
                  className="title-icon"
                />
                <span className="title-text">Game Instructions</span>
              </div>
            </div>
            <div className="content-block-dice">
              <DiceRoll visible={diceVisible} result={diceValue} />
            </div>
            <div className="content-block-body">
              <div className="meters">
                {[1, 2, 3].map(playerId => {
                  const profile = playerProfiles[playerId];
                  const statLabels = getStatLabels(currentAgentIndex);
                  return (
                    <div key={playerId} className="player-stats">
                      <div className="player-header">
                        <img 
                          src={profile.profilePictureUrl || '/characters/unset-profile-pic.png'}
                          alt={`${profile.name} avatar`}
                          className="player-avatar"
                          width={100}
                          height={100}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/characters/boy.png';
                          }}
                        />
                        <div className="player-name">
                          {profile.name || `Adventurer ${playerId}`}
                        </div>
                      </div>
                      
                      <div className="player-info">
                        {profile.descriptor && (
                          <div className="player-attributes">
                            <span>{profile.descriptor}</span>
                            <span>{profile.type}</span>
                          </div>
                        )}
                        <div className="stat-bars">
                          <div className="stat-bar">
                            <div className="stat-label">
                              <span>{statLabels.stat1}</span>
                              <span>{profile.stat1}</span>
                            </div>
                            <div className="meter">
                              <div 
                                className="meter-fill wit"
                                style={{width: `${(profile.stat1 / 6) * 100}%`}}
                              />
                            </div>
                          </div>
                          <div className="stat-bar">
                            <div className="stat-label">
                              <span>{statLabels.stat2}</span>
                              <span>{profile.stat2}</span>
                            </div>
                            <div className="meter">
                              <div 
                                className="meter-fill brawn"
                                style={{width: `${(profile.stat2 / 6) * 100}%`}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* <div className="content-actions">
              <Button
                label="Next Agent"
                buttonStyle="action"
                onClick={nextAgent}
              />
            </div> */}
          </div>
        </div>
        </div>
      </div>
  );
}

// Add this helper function to get stat labels based on agent index
const getStatLabels = (agentIndex: number) => {
  switch (agentIndex) {
    case 0:  // Medieval Fantasy RPG
      return { stat1: "Wit", stat2: "Brawn" };
    default:
      return { stat1: "Wit", stat2: "Brawn" };
  }
};
