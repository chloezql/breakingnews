import React, { useState, useEffect } from 'react';
import { useGame } from './GameContext';
import OpenAI from 'openai';
import './RatingPage.scss';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface Scores {
  viral: number;
  truth: number;
  creativity: number;
  feedback: string;
}

export function RatingPage() {
  const { gameState } = useGame();
  const [scores, setScores] = useState<Scores | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScores, setShowScores] = useState(false);

  useEffect(() => {
    const getRating = async () => {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are an expert news editor who evaluates stories based on:
                1. Viral Potential (how likely the story is to go viral)
                2. Truth Score (how close to the actual events the story seems)
                3. Creativity Score (how creative and engaging the story and its perspective is)
                
                Rate each category from 0-100 and provide brief feedback.
                Return as JSON with format: {
                  viral: number,
                  truth: number,
                  creativity: number,
                  feedback: string
                }`
                
            },
            {
              role: "user", 
              content: `Rate this news story: ${gameState.storyText}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        const rating = JSON.parse(completion.choices[0].message.content || '');
        setScores(rating);
        setIsLoading(false);
        // Trigger animation after a delay
        setTimeout(() => setShowScores(true), 500);
      } catch (error) {
        console.error('Error getting rating:', error);
        setIsLoading(false);
      }
    };

    getRating();
  }, [gameState.storyText]);

  if (isLoading) {
    return (
      <div className="rating-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Our editor is reviewing your story...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rating-page">
      <h1>Story Rating</h1>
      
      <div className="scores-container">
        <div className={`score-card ${showScores ? 'show' : ''}`}>
          <h2>Viral Potential</h2>
          <div className="score-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#eee"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#ff6b6b"
                strokeWidth="3"
                strokeDasharray={`${scores?.viral || 0}, 100`}
                className="score-value"
              />
            </svg>
            <span className="percentage">{scores?.viral || 0}%</span>
          </div>
        </div>

        <div className={`score-card ${showScores ? 'show' : ''}`}>
          <h2>Truth Score</h2>
          <div className="score-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#eee"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#4ecdc4"
                strokeWidth="3"
                strokeDasharray={`${scores?.truth || 0}, 100`}
                className="score-value"
              />
            </svg>
            <span className="percentage">{scores?.truth || 0}%</span>
          </div>
        </div>

        <div className={`score-card ${showScores ? 'show' : ''}`}>
          <h2>Creativity</h2>
          <div className="score-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#eee"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#ffd93d"
                strokeWidth="3"
                strokeDasharray={`${scores?.creativity || 0}, 100`}
                className="score-value"
              />
            </svg>
            <span className="percentage">{scores?.creativity || 0}%</span>
          </div>
        </div>
      </div>

      <div className={`feedback ${showScores ? 'show' : ''}`}>
        <h2>Editor's Feedback</h2>
        <p>{scores?.feedback}</p>
      </div>
    </div>
  );
} 