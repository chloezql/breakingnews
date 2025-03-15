import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import './ArticleStylePage.scss';

export function ArticleStylePage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const [selectedStyle, setSelectedStyle] = useState<string>('standard');
  const [error, setError] = useState<string>('');

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStyle) {
      setError('Please select a style for your article');
      return;
    }

    // Update game state with the selected style
    updateGameState({ article_style: selectedStyle });
    
    // Move to the next stage
    moveToNextStage();
  };

  return (
    <div className="article-style-page">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="window-title">Choose Article Style</div>
        </div>
        
        <div className="window-content">
          <div className="instruction">
            <p>Select a style for your breaking news article:</p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="style-options">
              <div 
                className={`style-option ${selectedStyle === 'standard' ? 'selected' : ''}`}
                onClick={() => handleStyleSelect('standard')}
              >
                <div className="style-preview standard-preview">
                  <div className="preview-header">Standard</div>
                  <div className="preview-content">
                    <div className="preview-line"></div>
                    <div className="preview-line"></div>
                    <div className="preview-line"></div>
                  </div>
                </div>
                <div className="style-description">
                  Classic newspaper layout with a clean, professional look
                </div>
              </div>
              
              <div 
                className={`style-option ${selectedStyle === 'tabloid' ? 'selected' : ''}`}
                onClick={() => handleStyleSelect('tabloid')}
              >
                <div className="style-preview tabloid-preview">
                  <div className="preview-header">Tabloid</div>
                  <div className="preview-content">
                    <div className="preview-line"></div>
                    <div className="preview-line"></div>
                    <div className="preview-line"></div>
                  </div>
                </div>
                <div className="style-description">
                  Bold and attention-grabbing with dramatic presentation
                </div>
              </div>
              
              <div 
                className={`style-option ${selectedStyle === 'digital' ? 'selected' : ''}`}
                onClick={() => handleStyleSelect('digital')}
              >
                <div className="style-preview digital-preview">
                  <div className="preview-header">Digital</div>
                  <div className="preview-content">
                    <div className="preview-line"></div>
                    <div className="preview-line"></div>
                    <div className="preview-line"></div>
                  </div>
                </div>
                <div className="style-description">
                  Modern web layout optimized for online reading
                </div>
              </div>
            </div>
            
            <div className="button-container">
              <button type="submit" className="submit-button">Continue</button>
            </div>
          </form>
        </div>
        
        <div className="window-status-bar">
          <div className="status-text">Select a style to continue</div>
        </div>
      </div>
    </div>
  );
} 