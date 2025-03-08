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
import { WavRecorder, WavStreamPlayer } from '../utils/wavtools/index.js';
import { WavRenderer} from '../utils/wav_renderer';
import { suspectProfiles } from '../agentJsons/suspectData.js';
import { Button } from '../components/button/Button';

import './SuspectInterviewPage.scss';
import { useGame } from './GameContext.js';
import { AVAILABLE_EVIDENCE, AVAILABLE_WITNESSES, AVAILABLE_SUSPECTS } from '../constants/evidence';


/**
 * Type for all event logs
 */
interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  event: { [key: string]: any };
}



export interface SuspectInterviewPageProps {
  onShowInstructions: () => void;
}

export function SuspectInterviewPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  
  // Ensure firstSuspect is defined
  const firstSuspect = AVAILABLE_SUSPECTS[0]; // Get the first suspect

  // Add state to track how many questions have been asked (limit to 3)
  const [questionsAskedBySuspect, setQuestionsAskedBySuspect] = useState<{[key: number]: number}>({
    1: 0, // Lucy
    2: 0  // Kevin
  });

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
  interface PlayerProfile {
    name: string;
    descriptor:string;
  }

  const [playerProfiles, setPlayerProfiles] = useState<{
    [playerId: number]: PlayerProfile;
  }>({
    1: { 
      name: 'Player 1', 
      descriptor: '',
    },
    2: { 
      name: 'Player 2', 
      descriptor: '',
    },
    3: { 
      name: 'Player 3', 
      descriptor: '',
    }
  });

  /**
   * Ask user for API Key
   * If we're using the local relay server, we don't need this
   */
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY

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

  const [selectedSuspectId, setSelectedSuspectId] = useState<number | null>(null);

  const handleNextButtonClick = () => {
    if (!selectedSuspectId) {
      alert("Please select a suspect before proceeding");
      return;
    }
    
    //update the selected suspect
    updateGameState({
      selectedSuspect: selectedSuspectId
    });
    
    // console log the questions and responses
    console.log("selected suspect", selectedSuspectId);
    console.log("questions",gameState.suspectInterviews[selectedSuspectId].questions);
    console.log("answers",gameState.suspectInterviews[selectedSuspectId].answers);
      
    moveToNextStage();
  };

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

  const [activeSuspect, setActiveSuspect] = useState<number | null>(null);

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
  const connectConversation = async () => {
    if (!activeSuspect) return;
    console.log("Connecting to conversation for suspect: ", activeSuspect);
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
  };

  /**
   * Disconnect and reset conversation state
   */
  const disconnectConversation = async () => {
    console.log("Disconnecting conversation");
    setIsConnected(false);
    setActiveSuspect(null);
    console.log("isConnected: ", isConnected);
    setRealtimeEvents([]);
    setItems([]);

    const client = clientRef.current;
    client.disconnect();

    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.end();

    const wavStreamPlayer = wavStreamPlayerRef.current;
    await wavStreamPlayer.interrupt();
    setActiveSuspect(null);
  };

    // /**
    //  * Disconnect from conversation without resetting state
    //  */
    // const disconnectConversationKeepState = useCallback(async () => {
    //   setIsConnected(false);

    //   const client = clientRef.current;
    //   client.disconnect();

    //   const wavRecorder = wavRecorderRef.current;
    //   await wavRecorder.end();

    //   const wavStreamPlayer = wavStreamPlayerRef.current;
    //   await wavStreamPlayer.interrupt();
    // }, []);
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
      setCurrentAgentIndex((prevIndex) => (prevIndex + 1) % suspectProfiles.length);
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
    if (activeSuspect && activeSuspect === 1) {
      console.log("bumping question count for suspect 1")
      setQuestionsAskedBySuspect(prev => ({
        ...prev,
        [activeSuspect]: prev[activeSuspect] + 1
      }));
    }
    console.log("Questions asked:", questionsAskedBySuspect[activeSuspect ? activeSuspect : 1]);
  };

  const stopRecording2 = async () => {
    setIsRecording2(false);
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.pause();
    await switchToPlayer(2);
    await client.createResponse();
    if (activeSuspect && activeSuspect === 2) {
      console.log("bumping question count for suspect 2")
      setQuestionsAskedBySuspect(prev => ({
        ...prev,
        [activeSuspect]: prev[activeSuspect] + 1
      }));
    }
    console.log("Questions asked:", questionsAskedBySuspect[activeSuspect ? activeSuspect : 2]);

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
  const changeTurnEndType = async (value: 'none' | 'server_vad') => {
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
    client.on('conversation.updated', async ({ 
      item, 
      delta 
    }: { 
      item: any; // Consider creating a proper type for this
      delta: { audio?: any }; // Consider creating a proper type for this
    }) => {
      const items = client.conversation.getItems();
      // if (item.status !== 'completed') {
      //   return;
      // }
      // console.log("Conversation items:", item);

      if (item.type === 'function_call_output') {
        console.log("Function call output:", item);
        await client.createResponse();
        console.log("Response created");
      }
      
      // Log user question and agent response text
      if (item.role === 'user' && item.formatted?.transcript && item.status === 'completed') {
        if (activeSuspect) {
          setQuestionsAskedBySuspect(prev => ({
            ...prev,
            [activeSuspect]: prev[activeSuspect] + 1
          }));
        }
        //update the game state with the question
        console.log("first suspect id ", firstSuspect.id);
        console.log("game state ", gameState.suspectInterviews);
        console.log("User Question:", item.formatted.transcript);

         updateGameState((prevState) => {
    const prevInterview =
      prevState.suspectInterviews[firstSuspect.id] || { questions: [], answers: [] };
    return {
      ...prevState,
      suspectInterviews: {
        ...prevState.suspectInterviews,
        [firstSuspect.id]: {
          questions: [...prevInterview.questions, item.formatted.transcript],
          answers: prevInterview.answers,
        },
      },
    };
  });
      }
      if (item.role === 'assistant' && item.formatted?.transcript && item.status === 'completed') {
        //update the game state with the answer
        console.log("Agent Response:", item.formatted.transcript);
        updateGameState((prevState) => {
          const prevInterview =
            prevState.suspectInterviews[firstSuspect.id] || { questions: [], answers: [] };
          return {
            ...prevState,
            suspectInterviews: {
              ...prevState.suspectInterviews,
              [firstSuspect.id]: {
                questions: prevInterview.questions,
                answers: [...prevInterview.answers, item.formatted.transcript],
              },
            },
          };
        });
          console.log("@@@1")
          console.log("activeSuspect:", activeSuspect);
          // console.log("questionsAskedBySuspect[activeSuspect ? activeSuspect : 1]:", questionsAskedBySuspect[activeSuspect ? activeSuspect : 1]);
          // if (questionsAskedBySuspect[activeSuspect ? activeSuspect : 1] >= 3 && isConnected) {
          //   console.log("Disconnecting conversation because of question limit");
          //   disconnectConversation();
          // }
        
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
      console.log("@@@2")

    });

    setItems(client.conversation.getItems());


    return () => {
      // cleanup; resets to defaults
      client.reset();
    };
  }, [activeSuspect]);

  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events and more
   */
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    // Get the current agent
    const currentAgent = suspectProfiles[currentAgentIndex];
    // Set base instructions with agent name and current player
    const instructions = `You are ${currentAgent.name}, ${currentAgent.promptInstructions}`;
    console.log('Setting instructions for:', currentAgent.name);
    console.log('Instructions:', instructions);
    
    // Set instructions and include current player in metadata
    client.updateSession({ 
      instructions, 
      temperature: 0.95,      
    });

    // Set voice and transcription settings
    client.updateSession({ 
      voice: currentAgent.voice as "alloy" | "shimmer" | "echo",
      input_audio_transcription: { model: 'whisper-1' }
    });

    client.tools = {};

  }, [currentAgentIndex, currentPlayer, playerProfiles, activeSuspect]); 


// This effect runs whenever currentAgentIndex changes

  // Add this useEffect to monitor playerProfiles changes
  useEffect(() => {
    console.log('playerProfiles updated:', playerProfiles);
  }, [playerProfiles]);

  useEffect(() => {
    console.log("activeSuspect updated: ", activeSuspect);
  }, [activeSuspect]);

  /**
   * Render the application
   */
  return (
    <div className="suspect-interview-page">
      <h1>Interview Suspects</h1>
      <div className="suspects-container">
        {/* First Suspect - Lucy */}
        <div className="suspect-card">
          <img src={AVAILABLE_SUSPECTS[0].image} alt={AVAILABLE_SUSPECTS[0].name} />
          <h2>{AVAILABLE_SUSPECTS[0].name}</h2>
          <div className="button-controls">
            <button
              className={isConnected && activeSuspect === 1 ? 'connected' : 'connect'}
              onClick={isConnected ? disconnectConversation : () => {
                setActiveSuspect(1);
                setCurrentAgentIndex(0);
                connectConversation();
              }}
              disabled={(questionsAskedBySuspect[1] >= 3 || (activeSuspect && activeSuspect !== 1 && isConnected)) as boolean}
              title={questionsAskedBySuspect[1] >= 3 ? "You could only ask three questions" : 
                     (activeSuspect && activeSuspect !== 1) ? "Currently interviewing another suspect" : ""}
              data-connected={(isConnected && activeSuspect === 1) || undefined}
            >
              {isConnected && activeSuspect === 1 ? 'Connected' : 'Connect'}
            </button>
            <button
              disabled={!isConnected || questionsAskedBySuspect[1] >= 3 || activeSuspect !== 1}
              onMouseDown={startRecording1}
              onMouseUp={stopRecording1}
              data-recording={isRecording1}
              title={questionsAskedBySuspect[1] >= 3 ? "You could only ask three questions" : 
                     !isConnected ? "Connect first to start recording" : ""}
            >
              {isRecording1 ? 'Release to Stop' : 'Hold to Talk'}
            </button>
          </div>
          <button
            className={`select-button ${selectedSuspectId === 1 ? 'selected' : ''}`}
            onClick={() => setSelectedSuspectId(1)}
            // disabled={questionsAskedBySuspect[1] < 3}
            title={questionsAskedBySuspect[1] < 3 ? "Ask 3 questions before selecting" : ""}
          >
            {selectedSuspectId === 1 ? 'Selected' : 'Select Suspect'}
          </button>
        </div>

        {/* Second Suspect - Kevin */}
        <div className="suspect-card">
          <img src={AVAILABLE_SUSPECTS[1].image} alt={AVAILABLE_SUSPECTS[1].name} />
          <h2>{AVAILABLE_SUSPECTS[1].name}</h2>
          <div className="button-controls">
            <button
              className={isConnected && activeSuspect === 2 ? 'connected' : 'connect'}
              onClick={isConnected ? disconnectConversation : () => {
                console.log("Onclick: ", 2);
                setActiveSuspect(2);
                setCurrentAgentIndex(1);
                connectConversation();
                console.log("activeSuspect: ", activeSuspect);
              }}
              disabled={(questionsAskedBySuspect[2] >= 3 || (activeSuspect && activeSuspect !== 2 && isConnected)) as boolean}
              title={questionsAskedBySuspect[2] >= 3 ? "You could only ask three questions" : 
                     (activeSuspect && activeSuspect !== 2) ? "Currently interviewing another suspect" : ""}
              data-connected={(isConnected && activeSuspect === 2) || undefined}
            >
              {isConnected && activeSuspect === 2 ? 'Connected' : 'Connect'}
            </button>
            <button
              disabled={!isConnected || questionsAskedBySuspect[2] >= 3 || activeSuspect !== 2}
              onMouseDown={startRecording2}
              onMouseUp={stopRecording2}
              data-recording={isRecording2}
              title={questionsAskedBySuspect[2] >= 3 ? "You could only ask three questions" : 
                     !isConnected ? "Connect first to start recording" : ""}
            >
              {isRecording2 ? 'Release to Stop' : 'Hold to Talk'}
            </button>
          </div>
          <button
            className={`select-button ${selectedSuspectId === 2 ? 'selected' : ''}`}
            onClick={() => setSelectedSuspectId(2)}
            // disabled={questionsAskedBySuspect[2] < 3}
            title={questionsAskedBySuspect[2] < 3 ? "Ask 3 questions before selecting" : ""}
          >
            {selectedSuspectId === 2 ? 'Selected' : 'Select Suspect'}
          </button>
        </div>
      </div>

      <button 
        className="next-button"
        onClick={handleNextButtonClick}
        disabled={!selectedSuspectId}
      >
        <div className="next-text">Next</div>
      </button>
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
