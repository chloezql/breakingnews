import React, { useEffect, useState } from 'react';
import { GameState, loadGameState, saveGameState } from './services/gameState';
import { GameStage } from './types/GameStages';
import { navigateToStage } from './services/navigation';
import { SuspectInterviewPage } from './pages/SuspectInterviewPage';
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
    updateGameState({ currentStage: GameStage.ANGLE_GENERATION });
    navigateToStage(GameStage.ANGLE_GENERATION);
  };

  if (!gameState) return <div>Loading...</div>;

  return (
    <div className="App">
      <GameContext.Provider value={{ gameState, updateGameState, moveToNextStage }}>
        <SuspectInterviewPage />
      </GameContext.Provider>
    </div>
  );
}

export default App; 