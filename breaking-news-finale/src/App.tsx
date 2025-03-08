import React, { useEffect, useState } from 'react';
import { GameState, loadGameState, saveGameState } from './services/gameState';
import { GameStage } from './types/GameStages';
import { navigateToStage } from './services/navigation';
import { AngleGenerationPage } from './pages/AngleGenerationPage';
import { ReporterInfoPage } from './pages/ReporterInfoPage';
import { ResultPage } from './pages/ResultPage';
import { RatingPage } from './pages/RatingPage';
import { GameContext } from './context/GameContext';
import './App.scss';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const state = loadGameState();
    if (state) {
      setGameState(state);
    } else {
      // Redirect to start if no state
      navigateToStage(GameStage.START);
    }
  }, []);

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState(prev => {
      if (!prev) return null;
      const newState = { ...prev, ...updates };
      saveGameState(newState);
      return newState;
    });
  };

  const moveToNextStage = () => {
    if (!gameState) return;
    
    const stages = Object.values(GameStage);
    const currentIndex = stages.indexOf(gameState.currentStage);
    
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      updateGameState({ currentStage: nextStage });
    }
  };

  if (!gameState) return <div>Loading...</div>;

  // Render the appropriate page based on the current stage
  const renderCurrentPage = () => {
    switch (gameState.currentStage) {
      case GameStage.ANGLE_GENERATION:
        return <AngleGenerationPage />;
      case GameStage.REPORTER_INFO:
        return <ReporterInfoPage />;
      case GameStage.RESULT:
        return <ResultPage />;
      case GameStage.RATING:
        return <RatingPage />;
      default:
        return <AngleGenerationPage />;
    }
  };

  return (
    <div className="App">
      <GameContext.Provider value={{ gameState, updateGameState, moveToNextStage }}>
        {renderCurrentPage()}
      </GameContext.Provider>
    </div>
  );
}

export default App; 