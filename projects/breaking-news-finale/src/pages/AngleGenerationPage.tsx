import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { AVAILABLE_EVIDENCE, AVAILABLE_WITNESSES } from '../constants/evidence';
import './AngleGenerationPage.scss';

// Type definition for SpeechRecognition
interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition {
  new(): SpeechRecognition;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

// Get the SpeechRecognition constructor from the window object
const SpeechRecognitionConstructor = (window as any).SpeechRecognition || 
  (window as any).webkitSpeechRecognition;

export function AngleGenerationPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const [inputText, setInputText] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate word count whenever input text changes
  useEffect(() => {
    const words = inputText.trim().split(/\s+/);
    setWordCount(inputText.trim() === '' ? 0 : words.length);
    setDisplayText(inputText);
  }, [inputText]);

  // Track user interactions with the page
  const handlePageInteraction = (action: 'record' | 'generate' | 'type') => {
    // This could be used for analytics or to guide the user
    console.log(`User interaction: ${action}`);
  };

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    handlePageInteraction('type');
  };

  // Start speech recognition
  const startRecording = async () => {
    if (!SpeechRecognitionConstructor) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognitionConstructor();
        if (recognitionRef.current) {
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;

          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            // Get the complete transcript from the entire recognition session
            let completeTranscript = '';
            
            // Process all results from the beginning
            for (let i = 0; i < event.results.length; i++) {
              completeTranscript += event.results[i][0].transcript + ' ';
            }
            
            // Simply update the display text with the complete transcript
            setDisplayText(completeTranscript.trim());
            
            // When a result is final, update the input text
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
              setInputText(completeTranscript.trim());
            }
          };
        }
      }

      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
        handlePageInteraction('record');
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      alert('Failed to start speech recognition.');
    }
  };

  // Stop speech recognition
  const stopRecording = async () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setInputText(displayText);
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    setIsRecording(false);
  };

  // Generate story effect (simulated AI generation)
  const typewriterEffect = async (text: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    let currentText = '';
    
    // Clear the textarea
    setInputText('');
    
    // Type each character with a delay
    for (let i = 0; i < text.length; i++) {
      currentText += text[i];
      setInputText(currentText);
      
      // Scroll to bottom as text is added
      textarea.scrollTop = textarea.scrollHeight;
      
      // Random delay between 10-30ms for realistic typing effect
      await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 10));
    }
  };

  // Handle the submission of the text
  const handleTextSubmit = async () => {
    if (wordCount > 90) {
      alert('Please limit your story to 90 words!');
      return;
    }
    
    handlePageInteraction('generate');
    setIsGenerating(false);
    
    // Update both storyText and player's story_angle if player exists
    if (gameState.player_name) {
      updateGameState({ 
        story_angle: inputText,
        });
    } else {
      updateGameState({ story_angle: inputText });
    }
    
    moveToNextStage();
  };

  // Allow editing after generation
  const handleEdit = () => {
    setIsGenerating(false);
  };

  return (
    <div data-component="AngleGenerationPage" className="page-container">
      <div className="content-top">
        <img 
          src="/breaking-news-logo.png" 
          alt="Breaking News" 
          className="breaking-news-title"
        />
        
        {gameState.player_name && (
          <div className="player-info">
            <p>Welcome, {gameState.player_name || 'Reporter'}!</p>
            <p className="card-id">Card ID: {gameState.id_card_no || 'Unknown'}</p>
          </div>
        )}
      </div>
      
      <div className="content-main">
        <div className="story-input">
          <div className="word-count">
            Words: {wordCount}/90 {wordCount > 90 && '(too many!)'}
          </div>
          
          <textarea
            ref={textareaRef}
            value={isRecording ? displayText : inputText}
            onChange={handleInputChange}
            placeholder="What's your breaking news story? Type or record your story here..."
            disabled={isGenerating}
          />
          
          <div className="input-controls">
            {isRecording ? (
              <button 
                onClick={stopRecording}
                className="recording"
              >
                Stop Recording
              </button>
            ) : (
              <button 
                onClick={startRecording}
                disabled={isGenerating}
              >
                Start Recording
              </button>
            )}
            
            <button
              onClick={handleTextSubmit}
              disabled={wordCount > 90 || inputText.trim() === ''}
            >
              Submit Story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 