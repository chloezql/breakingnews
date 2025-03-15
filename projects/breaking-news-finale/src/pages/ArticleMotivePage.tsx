import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './ArticleMotivePage.scss';

export function ArticleMotivePage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get the initial value from the game state or use an empty string
  const [motive, setMotive] = useState(gameState?.article_motive || '');
  const [error, setError] = useState('');
  
  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      adjustTextareaHeight();
    }
  }, []);
  
  // Adjust textarea height based on content
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMotive(value);
    
    // Adjust textarea height
    adjustTextareaHeight();
    
    // Clear error when user types
    if (error) setError('');
    
    // Check if the input exceeds the maximum word count
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 20) {
      setError('Please keep your response concise');
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!motive.trim()) {
      setError('Please enter a motive');
      return;
    }
    
    // Save to game state and move to next stage
    updateGameState({ article_motive: motive });
    moveToNextStage();
  };
  
  // Get the selected suspects to display in the prompt
  const selectedSuspectIds = gameState?.article_suspect_ids || [];
  const suspectText = selectedSuspectIds.length === 1 ? 'The suspect' : 'The suspects';
  
  return (
    <div data-component="ArticleMotivePage">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Article Creation (4/7)</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="article-step-container">
            <h1>Motive for Murder</h1>
            
            <form onSubmit={handleSubmit}>
              <div className="prompt-container">
                <div className="inline-prompt">
                  <span className="prompt-text">{suspectText} wanted to kill Erin because </span>
                  <textarea
                    ref={textareaRef}
                    value={motive}
                    onChange={handleInputChange}
                    placeholder="  motive for murder"
                    rows={1}
                    maxLength={100}
                    className={`inline-textarea ${error ? 'error' : ''}`}
                  />
                </div>
                
                {error && <p className="error-message">{error}</p>}
                
                <div className="word-count">
                  {motive.trim().split(/\s+/).filter(Boolean).length}/20 words
                </div>
              </div>
              
              <button 
                type="submit"
                className="continue-button"
                disabled={!!error || !motive.trim()}
              >
                Continue
              </button>
            </form>
          </div>
        </div>
        
        <div className="window-status-bar">
          <div className="status-text">Breaking News - 2025</div>
          <div className="windows-logo"></div>
        </div>
      </div>
    </div>
  );
} 