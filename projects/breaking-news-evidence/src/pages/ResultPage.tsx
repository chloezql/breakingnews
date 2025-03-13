import React, { useState, useEffect, useRef } from 'react';
import './ResultPage.scss';

interface ResultPageProps {
  onComplete: () => void;
  onReset: () => void;
  playerId: string | null;
  isTimeout?: boolean;
  hadSelectedEvidence?: boolean;
}

function ResultPage({ onComplete, onReset, playerId, isTimeout, hadSelectedEvidence }: ResultPageProps) {
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [copFadeIn, setCopFadeIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const audioFile = isTimeout 
      ? (hadSelectedEvidence ? 'Station2_Tony_03.wav' : 'Station2_Tony_03A.wav')
      : 'Station2_Tony_02.wav';
      
    const audio = new Audio(`${process.env.PUBLIC_URL}/${audioFile}`);
    audioRef.current = audio;

    const handleCanPlayThrough = () => {
      if (mounted) {
        console.log('Audio can play through');
        setAudioLoaded(true);
        setIsLoading(false);
      }
    };

    const handleEnded = () => {
      if (mounted) {
        console.log('Audio playback completed');
        setAudioEnded(true);
        setTimeout(() => {
          if (mounted) {
            onReset();
            onComplete();
          }
        }, 1000);
      }
    };

    const handleError = (e: ErrorEvent) => {
      if (mounted) {
        console.error('Error loading audio:', e);
        setIsLoading(false);
        setAudioLoaded(false);
      }
    };

    // Set up event listeners
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Start loading the audio
    audio.load();

    // Auto-fade in the cop after a short delay
    const copTimer = setTimeout(() => {
      if (mounted) {
        setCopFadeIn(true);
      }
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(copTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('canplaythrough', handleCanPlayThrough);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
      }
    };
  }, [onComplete, onReset, isTimeout, hadSelectedEvidence]);

  // Separate effect for playing audio once it's loaded and cop animation starts
  useEffect(() => {
    if (audioLoaded && copFadeIn && audioRef.current) {
      console.log('Audio loaded and cop faded in, attempting to play audio');
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing audio:', error);
          // If autoplay fails, we might want to show a play button or try an alternative approach
        });
      }
    }
  }, [audioLoaded, copFadeIn]);

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