import React, { useState, useRef } from 'react';
import OpenAI from 'openai';
import './AudioTranscriptionPage.scss';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export function AudioTranscriptionPage() {
  const [transcription, setTranscription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTranscribe = async (file: File) => {
    setIsLoading(true);
    setError('');
    
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en'
      });

      setTranscription(transcription.text);
    } catch (err) {
      setError('Error transcribing audio: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleTranscribe(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleTranscribe(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="audio-transcription-page">
      <h1>Audio Transcription</h1>
      
      <div 
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="audio/*"
          style={{ display: 'none' }}
        />
        <p>Drop audio file here or click to select</p>
        {isLoading && <div className="loader">Transcribing...</div>}
      </div>

      {error && <div className="error">{error}</div>}

      {transcription && (
        <div className="result">
          <h2>Transcription:</h2>
          <pre>{transcription}</pre>
          <button 
            onClick={() => navigator.clipboard.writeText(transcription)}
            className="copy-button"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
} 