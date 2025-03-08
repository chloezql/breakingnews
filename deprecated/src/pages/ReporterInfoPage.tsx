import React, { useState, useRef, useEffect } from 'react';
import { useGame } from './GameContext';
import './ReporterInfoPage.scss';

export function ReporterInfoPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const [headline, setHeadline] = useState(gameState.headline);
  const [reporterName, setReporterName] = useState(gameState.reporterName);
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
  const introAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Play intro audio when component mounts
    if (introAudioRef.current) {
      introAudioRef.current.play();
    }
  }, []);

  const stopIntroAudio = () => {
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current.currentTime = 0;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'headline') {
      setHeadline(value);
    } else if (name === 'reporterName') {
      setReporterName(value);
    }
  };

  const handleSubmit = () => {
    if (!headline.trim() || !reporterName.trim()) return;
    
    stopIntroAudio(); // Only stop audio when publishing
    
    updateGameState({
      headline: headline,
      reporterName: reporterName
    });
    moveToNextStage();
  };

  return (
    <div className="reporter-info-page">
      <div className="breaking-news-logo">
        <img 
          src="./breaking-news-logo.png" 
          alt="Breaking News" 
        />
      </div>
      <div className="newspaper">
        <div className="separator"></div>
        <div className="headline-input">
          <input
            type="text"
            name="headline"
            value={headline}
            onChange={handleInputChange}
            placeholder="Enter Your Headline..."
            maxLength={100}
          />
        </div>

        {/* <div className="story-preview">
          {gameState.storyText}
        </div> */}

        <div className="reporter-line">
          <div className="reporter-section">
            <span>Reported By:</span>
            <input
              type="text"
              name="reporterName"
              value={reporterName}
              onChange={handleInputChange}
              placeholder="Your Name"
              maxLength={50}
            />
          </div>
          <div className="date">
            Date: {currentDate}
          </div>
        </div>

        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={!headline.trim() || !reporterName.trim()}
        >
          Publish
        </button>
      </div>

      <audio 
        ref={introAudioRef}
        src="./audio/headline_intro.mp3"
      />
    </div>
  );
} 