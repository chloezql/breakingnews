import { GameStage } from '../types/GameStages';

export interface GameState {
  currentStage: GameStage;
  id?: string;
  player_name?: string;
  id_card_no?: string;
  headline?: string;
  evidence_list?: number[];
  tape?: number[];
  selected_suspect?: string;
  story_angle?: string;
  full_article_generated?: string;
  ratings?: {
    viral: number;
    truth: number;
    creativity: number;
    overall: number;
    feedback: string;
  }
}

const STORAGE_KEY = 'breaking_news_game_state';

export const saveGameState = (state: GameState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadGameState = (): GameState | null => {
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (!savedState) {
    // Initialize with default state
    const initialState: GameState = {
      currentStage: GameStage.ANGLE_GENERATION
    };
     saveGameState(initialState);
    return initialState;
  }
  
  try {
    return JSON.parse(savedState) as GameState;
  } catch (error) {
    console.error('Failed to parse saved game state:', error);
    return null;
  }
};

export const clearGameState = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const resetGameState = (): GameState => {
  const initialState: GameState = {
    currentStage: GameStage.ANGLE_GENERATION
  };
  saveGameState(initialState);
  return initialState;
}; 