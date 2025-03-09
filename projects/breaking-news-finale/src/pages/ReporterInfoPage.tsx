import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './ReporterInfoPage.scss';

export function ReporterInfoPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const [headline, setHeadline] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [introAudio, setIntroAudio] = useState<HTMLAudioElement | null>(null);

  // Initialize audio on component mount
  useEffect(() => {
    // const audio = new Audio('/newspaper-sound.mp3');
    // setIntroAudio(audio);
    
    // // Play intro sound
    // audio.play().catch(error => {
    //   console.error('Error playing audio:', error);
    // });

    // Set initial values from game state if available
    if (gameState.headline) setHeadline(gameState.headline);
    if (gameState.player_name) setReporterName(gameState.player_name);

    // // Cleanup on unmount
    // return () => {
    //   audio.pause();
    //   audio.currentTime = 0;
    // };
  }, [gameState]);

  // Stop intro audio (if needed)
  const stopIntroAudio = () => {
    if (introAudio) {
      introAudio.pause();
      introAudio.currentTime = 0;
    }
  };

  // Validate form whenever inputs change
  useEffect(() => {
    setIsFormValid(headline.trim() !== '' && reporterName.trim() !== '');
  }, [headline, reporterName]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'headline') {
      setHeadline(value);
    } else if (name === 'reporterName') {
      setReporterName(value);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!isFormValid) return;
    
    updateGameState({
      headline,
      player_name: reporterName
    });
    
    stopIntroAudio();
    moveToNextStage();
  };

  return (
    <div className="reporter-info-page page-container">
      <div className="breaking-news-logo">
        <img src="/breaking-news-logo.png" alt="Breaking News" />
      </div>
      
      <div className="newspaper">
        <div className="headline-input">
          <input
            type="text"
            name="headline"
            value={headline}
            onChange={handleInputChange}
            placeholder="Write your headline here..."
            maxLength={100}
            autoComplete='off'
          />
        </div>
        
        <div className="story-preview">
          {gameState.story_angle || "Your story will appear here..."}
        </div>
        
        <div className="reporter-line">
          <div className="reporter-section">
            <span>By:</span>
            <input
              type="text"
              name="reporterName"
              value={reporterName}
              onChange={handleInputChange}
              placeholder="Your name"
              maxLength={30}
              autoComplete='off'
            />
          </div>
          
          <div className="date">
            March 19, 2025
          </div>
        </div>
        
        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          Publish Story
        </button>
      </div>
    </div>
  );
} 