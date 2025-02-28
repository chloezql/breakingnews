import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import './IntroPage.scss';

// Intro page with audio
export function IntroPage() {
  const { moveToNextStage } = useGame();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.play().catch(error => {
        console.error('Audio playback failed:', error);
      });
      setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
      };
    }
  }, []);

  useEffect(() => {
   setIsPlaying(true);
  }, []);


  return (
    <div className="intro-page">
      <div className="logo-container">
        <img 
          src="./breaking-news-logo.png" 
          alt="Breaking News" 
        />
      </div>
      
      <div className="audio-visualizer">
        <div className={`bar bar1 ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`bar bar2 ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`bar bar3 ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`bar bar4 ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`bar bar5 ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`bar bar6 ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`bar bar7 ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`bar bar8 ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`bar bar9 ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`bar bar10 ${isPlaying ? 'playing' : ''}`}></div>
      </div>

      <audio 
        ref={audioRef} 
        src="/audio/game_intro.mp3"
        preload="auto"
      />
      
      <button 
        className="next-button"
        onClick={moveToNextStage}
      >
        <div className="next-text">Next</div>
      </button>
    </div>
  );
} 