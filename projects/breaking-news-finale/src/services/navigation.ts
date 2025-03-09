import { GameStage } from '../types/GameStages';

export const navigateToStage = (stage: GameStage): void => {
  // Add hash to URL for navigation
  window.location.hash = stage;
};

export const getCurrentStageFromUrl = (): GameStage | null => {
  const hash = window.location.hash.replace('#', '');
  
  // Check if the hash is a valid GameStage
  if (Object.values(GameStage).includes(hash as GameStage)) {
    return hash as GameStage;
  }
  
  return null;
}; 