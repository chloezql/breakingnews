import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import './ArticleStylePage.scss';

// Define tone and theme options
const TONE_OPTIONS = [
  { id: 'serious', label: 'Serious' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'thrilling', label: 'Thrilling' },
  { id: 'mysterious', label: 'Mysterious' },
  { id: 'shocking', label: 'Shocking' },
  { id: 'somber', label: 'Somber' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'analytical', label: 'Analytical' }
];

const THEME_OPTIONS = [
  { id: 'crime', label: 'Crime' },
  { id: 'justice', label: 'Justice' },
  { id: 'conspiracy', label: 'Conspiracy' },
  { id: 'tragedy', label: 'Tragedy' },
  { id: 'corruption', label: 'Corruption' },
  { id: 'investigation', label: 'Investigation' },
  { id: 'scandal', label: 'Scandal' },
  { id: 'exposé', label: 'Exposé' }
];

export function ArticleStylePage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const toggleTone = (toneId: string) => {
    setSelectedTones(prev => {
      if (prev.includes(toneId)) {
        return prev.filter(id => id !== toneId);
      } else {
        return [...prev, toneId];
      }
    });
    setError('');
  };

  const toggleTheme = (themeId: string) => {
    setSelectedThemes(prev => {
      if (prev.includes(themeId)) {
        return prev.filter(id => id !== themeId);
      } else {
        return [...prev, themeId];
      }
    });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTones.length === 0) {
      setError('Please select at least one tone for your article');
      return;
    }

    if (selectedThemes.length === 0) {
      setError('Please select at least one theme for your article');
      return;
    }

    // Combine tones and themes into a single object
    const styleData = {
      tones: selectedTones,
      themes: selectedThemes
    };

    // Update game state with the selected style
    updateGameState({ article_style: JSON.stringify(styleData) });

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
            <p>Select the tone and themes for your breaking news article:</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <h2 className="section-title">Article Tone</h2>
            <p className="section-description">Select one or more tones for your article:</p>
            <div className="tags-container">
              {TONE_OPTIONS.map(tone => (
                <div
                  key={tone.id}
                  className={`tag ${selectedTones.includes(tone.id) ? 'selected' : ''}`}
                  onClick={() => toggleTone(tone.id)}
                >
                  {tone.label}
                </div>
              ))}
            </div>

            <h2 className="section-title">Article Theme</h2>
            <p className="section-description">Select one or more themes for your article:</p>
            <div className="tags-container">
              {THEME_OPTIONS.map(theme => (
                <div
                  key={theme.id}
                  className={`tag ${selectedThemes.includes(theme.id) ? 'selected' : ''}`}
                  onClick={() => toggleTheme(theme.id)}
                >
                  {theme.label}
                </div>
              ))}
            </div>

            <div className="button-container">
              <button type="submit" className="submit-button">Generate Article</button>
            </div>
          </form>
        </div>

        <div className="window-status-bar">
          <div className="status-text">
            {selectedTones.length > 0 && selectedThemes.length > 0
              ? 'Ready to continue'
              : 'Select tone and theme to continue'}
          </div>
        </div>
      </div>
    </div>
  );
} 