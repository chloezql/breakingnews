import React, { createContext, useContext, ReactNode } from 'react';
import { GameState } from '../types/GameTypes';
import { GameStage } from '../types/GameStages';
import { navigateToStage } from '../services/navigation';

interface GameContextType {
  gameState: GameState;
  updateGameState: (updates: Partial<GameState>) => void;
  moveToNextStage: () => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
  initialState: GameState;
  onUpdateState: (state: GameState) => void;
}

export const GameProvider: React.FC<GameProviderProps> = ({ 
  children, 
  initialState, 
  onUpdateState 
}) => {
  const updateGameState = (updates: Partial<GameState>) => {
    const newState = { ...initialState, ...updates };
    onUpdateState(newState);
  };

  const moveToNextStage = () => {
    const stages = Object.values(GameStage);
    const currentIndex = stages.indexOf(initialState.currentStage);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      updateGameState({ currentStage: nextStage });
      navigateToStage(nextStage);
    }
  };

  return (
    <GameContext.Provider value={{ 
      gameState: initialState, 
      updateGameState, 
      moveToNextStage 
    }}>
      {children}
    </GameContext.Provider>
  );
}; 