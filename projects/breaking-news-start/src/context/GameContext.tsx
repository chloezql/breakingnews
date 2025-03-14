import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Player } from '../services/api';

// Define the game stages
export enum GameStage {
  START = 'START',
  VIDEO = 'VIDEO'
}

// Define the game state interface
interface GameState {
  stage: GameStage;
  player: Player | null;
  cardId: string | null;
}

// Define the context interface
interface GameContextType {
  gameState: GameState;
  setStage: (stage: GameStage) => void;
  setPlayer: (player: Player | null) => void;
  setCardId: (cardId: string | null) => void;
  resetGame: () => void;
}

// Create the context with default values
const GameContext = createContext<GameContextType | undefined>(undefined);

// Initial game state
const initialGameState: GameState = {
  stage: GameStage.START,
  player: null,
  cardId: null
};

// Provider component
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const setStage = (stage: GameStage) => {
    setGameState(prevState => ({ ...prevState, stage }));
  };

  const setPlayer = (player: Player | null) => {
    setGameState(prevState => ({ ...prevState, player }));
  };

  const setCardId = (cardId: string | null) => {
    setGameState(prevState => ({ ...prevState, cardId }));
  };

  const resetGame = () => {
    setGameState(initialGameState);
  };

  return (
    <GameContext.Provider value={{ gameState, setStage, setPlayer, setCardId, resetGame }}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 