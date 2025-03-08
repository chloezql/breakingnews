import { GameStage } from '../types/GameStages';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost';

export const PROJECT_URLS = {
  [GameStage.START]: `${BASE_URL}`,
  [GameStage.INTRO]: `${BASE_URL}/intro`,
  [GameStage.EVIDENCE_SELECTION]: `${BASE_URL}/evidence`,
  [GameStage.WITNESS_SELECTION]: `${BASE_URL}/witness`,
  [GameStage.SUSPECT_INTERVIEW]: `${BASE_URL}/interview`,
  [GameStage.ANGLE_GENERATION]: `${BASE_URL}/finale`
};

export const navigateToStage = (stage: GameStage) => {
  window.location.href = PROJECT_URLS[stage];
}; 