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

import React, { useState, useRef, useEffect } from 'react';
import { useGame } from './GameContext';
import { AVAILABLE_EVIDENCE, AVAILABLE_WITNESSES } from '../constants/evidence';
import OpenAI from 'openai';
import './AngleGenerationPage.scss';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

type SpeechRecognition = {
  new(): SpeechRecognition;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: any) => void;
  start: () => void;
  stop: () => void;
}

export function AngleGenerationPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const introAudioRef = useRef<HTMLAudioElement>(null);

  const wordCount = inputText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const WORD_LIMIT = 90;

  useEffect(() => {
    // Play intro audio when component mounts
    if (introAudioRef.current) {
      introAudioRef.current.play();
    }
  }, []);

  const handlePageInteraction = (action: 'record' | 'generate' | 'type') => {
    // Only stop intro audio for recording or generating
    if ((action === 'record' || action === 'generate') && introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current.currentTime = 0;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const startRecording = async () => {
    handlePageInteraction('record');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone');
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current) return;

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

        try {
          setIsTyping(true);
          const transcription = await openai.audio.transcriptions.create({
            file,
            model: "whisper-1",
          });

          setInputText('');
          const words = transcription.text.split(' ');
          for (const word of words) {
            await new Promise(resolve => setTimeout(resolve, 50));
            setInputText(prev => prev + (prev ? ' ' : '') + word);
          }
          setIsTyping(false);
        } catch (err) {
          console.error('Transcription error:', err);
          alert('Error transcribing audio');
          setIsTyping(false);
        }

        // Clean up
        const tracks = mediaRecorderRef.current?.stream.getTracks();
        tracks?.forEach(track => track.stop());
        resolve();
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
    });
  };

  const typewriterEffect = async (text: string) => {
    setDisplayedText([]);
    const words = text.split(' ');
    let currentLine = '';
    let currentText = '';
    
    for (const word of words) {
      // Add word to current line
      if ((currentLine + ' ' + word).split(' ').length > 10) {
        setDisplayedText(prev => [...prev, currentLine.trim()]);
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
      
      // Type each character of the word
      for (const char of word + ' ') {
        currentText += char;
        await new Promise(resolve => setTimeout(resolve, 50)); // Adjust speed here
        if (currentLine === word) {
          setDisplayedText(prev => [...prev.slice(0, -1), currentText]);
        } else {
          setDisplayedText(prev => [...prev, currentText]);
        }
      }
    }
    
    if (currentLine) {
      setDisplayedText(prev => [...prev, currentLine.trim()]);
    }
  };

  const handleTextSubmit = async () => {
    if (wordCount > WORD_LIMIT) return;
    handlePageInteraction('generate');
    setIsGenerating(false);
    updateGameState({ storyText: inputText });
    moveToNextStage();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setInputText(displayedText.join(' '));
    setDisplayedText([]);
  };

  return (
    <div data-component="AngleGenerationPage" className="angle-page">
      <div className="content-top">
        <img 
          src="./breaking-news-logo.png" 
          alt="Breaking News" 
          className="breaking-news-title"
        />
      </div>
      
      <div className="content-main">
        <div className="content-block">
          
            <div className="story-input">
              {!isGenerating && displayedText.length === 0 && (
                <>
                  <textarea
                    ref={textAreaRef}
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Type your story angle here..."
                    maxLength={WORD_LIMIT * 6}
                    disabled={isTyping}
                  />
                  <div className="word-count">
                    {wordCount}/{WORD_LIMIT} words
                  </div>
                  <div className="input-controls">
                    <button 
                      className={`record-button ${isRecording ? 'recording' : ''}`}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                    <button 
                      className="submit-button"
                      onClick={handleTextSubmit}
                      disabled={wordCount > WORD_LIMIT || wordCount === 0}
                    >
                      Generate Story
                    </button>
                  </div>
                </>
              )}

              <div className={`story-display ${isGenerating ? 'generating' : ''}`}>
                {displayedText.map((line, index) => (
                  <div key={index} className="story-line">
                    {line}
                  </div>
                ))}
                {isGenerating && <div className="cursor">|</div>}
              </div>

              {!isGenerating && displayedText.length > 0 && (
                <div className="edit-controls">
                  <button onClick={handleEdit}>Edit Story</button>
                </div>
              )}
            </div>
          </div>
        
      </div>

      <audio 
        ref={introAudioRef}
        src="./audio/angle_intro.mp3"
      />
    </div>
  );
}
