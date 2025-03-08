import { GameStage } from '../types/GameStages';

export const PROJECT_URLS = {
  [GameStage.START]: 'http://localhost:3000',
  [GameStage.INTRO]: 'http://localhost:3001',
  [GameStage.EVIDENCE_SELECTION]: 'http://localhost:3002',
  [GameStage.WITNESS_SELECTION]: 'http://localhost:3003',
  [GameStage.SUSPECT_INTERVIEW]: 'http://localhost:3004',
  [GameStage.ANGLE_GENERATION]: 'http://localhost:3005',
};

export const navigateToStage = (stage: GameStage) => {
  window.location.href = PROJECT_URLS[stage];
}; 