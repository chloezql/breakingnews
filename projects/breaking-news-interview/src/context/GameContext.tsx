import React, { createContext, useContext, useState } from 'react';
import { GameState, GameStage } from '../types/GameTypes';

interface GameContextType {
  gameState: GameState;
  currentStage: GameStage;
  updateGameState: (updates: Partial<GameState> | ((prev: GameState) => GameState)) => void;
  moveToNextStage: () => void;
}

const initialState: GameState = {
  currentStage: 0,
  selectedSuspect: 1,
  suspectInterviews: {
    1: {
      questions: [],
      answers: []
    },
    2: {
      questions: [],
      answers: []
    }
  }
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [currentStage, setCurrentStage] = useState<GameStage>(GameStage.START);

  const updateGameState = (updates: Partial<GameState> | ((prev: GameState) => GameState)) => {
    if (typeof updates === 'function') {
      setGameState(updates);
    } else {
      setGameState(current => ({ ...current, ...updates }));
    }
  };

  const moveToNextStage = () => {
    const stages = Object.values(GameStage);
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex < stages.length - 1) {
      setCurrentStage(stages[currentIndex + 1]);
    }
  };

  return (
    <GameContext.Provider value={{ gameState, currentStage, updateGameState, moveToNextStage }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}; 