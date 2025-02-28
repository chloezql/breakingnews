import React, { useEffect, useState } from 'react';
import { useGame } from './GameContext';
import './ResultPage.scss';
import { generateStory } from '../utils/storyGenerator';

export function ResultPage() {
  const { gameState } = useGame();
  const [generatedStory, setGeneratedStory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: '2-digit', 
    year: 'numeric' 
  });

  useEffect(() => {
    const generateNewsStory = async () => {
      setIsLoading(true);
      try {
        const story = await generateStory(gameState);
        setGeneratedStory(story);
      } finally {
        setIsLoading(false);
      }
    };

    generateNewsStory();
  }, [gameState]);

  const handlePrint = () => {
    window.print();
  };

  const { moveToNextStage } = useGame();

  const goToRatingPage = () => {
    moveToNextStage()
  }

  return (
    <div className="result-page">
      <div className="breaking-news-logo">
        <img 
          src="./breaking-news-logo.png" 
          alt="Breaking News" 
        />
      </div>

      <div className="newspaper">
        <div className="newspaper-header">
          <h1>Global Daily Courier</h1>
          <div className="date-line">
            {currentDate}
          </div>
        </div>

        <div className="headline">
          {gameState.headline}
        </div>

        {/* <div className="main-image" /> */}

        <div className="story-content">
          {isLoading ? (
            <div className="loading-animation">
              <div className="typewriter">
                <div className="line"></div>
                <div className="line"></div>
                <div className="line"></div>
              </div>
            </div>
          ) : (
            ((generatedStory || gameState.storyText) ?? '').split('\n\n').map((paragraph, index) => (
              <React.Fragment key={index}>
                <p>{paragraph}</p>
                {index < gameState.selectedEvidence.length && <div className="evidence-inline" />}
              </React.Fragment>
            ))
          )}
        </div>

        <div className="reporter-info">
          <span>Reported By: {gameState.reporterName}</span>
          <span>Date: {currentDate}</span>
        </div>
      </div>

      <div className="congratulations">
        <h2>Congratulations, Reporter!</h2>
        <p>Your story has been published in the Global Daily Courier.</p>

        <div>
        <button className="print-button" onClick={handlePrint}>
          Print Your Story
        </button>

        <button className="print-button" onClick={goToRatingPage}>
          Reveal Rating 
        </button>
        </div>
      </div>
    </div>
    
  );
} 