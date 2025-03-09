import React, { createContext, useContext } from 'react';
import { GameState } from '../services/gameState';

interface GameContextType {
  gameState: GameState;
  updateGameState: (updates: Partial<GameState>) => void;
  moveToNextStage: () => void;
}

// Create context with a default undefined value
export const GameContext = createContext<GameContextType | undefined>(undefined);

// Custom hook to use the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  
  if (context === undefined) {
    throw new Error('useGame must be used within a GameContext.Provider');
  }
  
  return context;
}; 