import { GameState } from '../types/GameTypes';

export interface GameState {
  currentStage: GameStage;
  selectedEvidence?: Evidence[];
  selectedWitnesses?: Witness[];
  suspectInterviews?: {
    [suspectId: number]: {
      questions: string[];
      answers: string[];
    };
  };
  // ... other state properties
}

export const saveGameState = (state: GameState) => {
  localStorage.setItem('breaking-news-state', JSON.stringify(state));
};

export const loadGameState = (): GameState | null => {
  const saved = localStorage.getItem('breaking-news-state');
  return saved ? JSON.parse(saved) : null;
}; 