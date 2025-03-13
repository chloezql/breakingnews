import React, { useState, useEffect } from 'react';
import './ResultPage.scss';

interface ResultPageProps {
  onComplete: () => void;
  onReset: () => void;
  playerId: string | null;
  isTimeout?: boolean;
}

function ResultPage({ onComplete, onReset, playerId, isTimeout }: ResultPageProps) {
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [copFadeIn, setCopFadeIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Start loading audio after component mounts
    const audioFile = isTimeout ? 'Station2_Tony_03.wav' : 'Station2_Tony_02.wav';
    const audio = new Audio(`${process.env.PUBLIC_URL}/${audioFile}`);
    
    // Set up event listeners for audio
    audio.addEventListener('canplaythrough', () => {
      setAudioLoaded(true);
      setIsLoading(false);
    });
    
    audio.addEventListener('ended', () => {
      console.log('Audio playback completed');
      setAudioEnded(true);
      
      // Allow some time for the user to read feedback before navigating away
      setTimeout(() => {
        // Reset player ID and navigate back to tutorial
        onReset();
        onComplete();
      }, 1000);
    });
    
    // Handle audio loading error
    audio.addEventListener('error', () => {
      console.error('Error loading audio');
      setIsLoading(false);
      setAudioLoaded(false);
    });
    
    // Start loading the audio
    audio.load();
    
    // Auto-fade in the cop after a short delay
    setTimeout(() => {
      setCopFadeIn(true);
    }, 500);
    
    // Play audio after a delay to let animations complete
    setTimeout(() => {
      if (audioLoaded) {
        console.log('Audio loaded, playing audio');
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    }, 1000);
    
    // Cleanup
    return () => {
      audio.pause();
      audio.removeEventListener('canplaythrough', () => setAudioLoaded(true));
      audio.removeEventListener('ended', () => setAudioEnded(true));
      audio.removeEventListener('error', () => setIsLoading(false));
    };
  }, [onComplete, onReset, isTimeout]);
  
  // Render loading screen if still loading
  if (isLoading) {
    return (
      <div className="result-page">
        <div className="loading-screen">
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="result-page" style={{
      backgroundImage: `url(${process.env.PUBLIC_URL}/police-office-background.png)`
    }}>
      {/* Breaking News Logo */}
      <div className="breaking-news-logo">
       <img src={`/breaking-news-logo.png`} alt="Breaking News Logo" />
      </div>
      
      <div className="game-content">
        {/* Cop Character */}
        <div className={`cop-container ${copFadeIn ? 'fade-in' : ''}`}>
         
          <img 
            src={`/police-arm-up.png`}
            alt="Police Detective"
            className="cop-image" 
          />
        </div>
      </div>
    </div>
  );
}

export default ResultPage; 