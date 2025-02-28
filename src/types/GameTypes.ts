import { AVAILABLE_EVIDENCE, AVAILABLE_WITNESSES } from '../constants/evidence';

export type Evidence = typeof AVAILABLE_EVIDENCE[0];
export type Witness = typeof AVAILABLE_WITNESSES[0];

export interface GameState {
  currentStage: number;
  headline: string;
  reporterName: string;
  storyText: string;
  selectedEvidence: Evidence[];
  selectedWitnesses: Witness[];
  selectedSuspect?: number;
  suspectInterviews: {
    [suspectId: number]: {
      questions: string[];
      answers: string[];
    };
  };
}

export const initialGameState: GameState = {
  currentStage: 0,
  headline: '',
  reporterName: '',
  storyText: '',
  selectedEvidence: [],
  selectedWitnesses: [],
  selectedSuspect: 1,
  suspectInterviews: {
    1: {
      questions: [],
      answers: []
    },
    2: {
      questions: [],
      answers: []
    },
    3: {
      questions: [],
      answers: []
    }
  }
};

export enum GameStage {
  START = 'start',
  INTRO = 'intro',
  EVIDENCE_SELECTION = 'evidence',
  WITNESS_SELECTION = 'witness',
  ANGLE_GENERATION = 'angle',
  REPORTER_INFO = 'reporter',
  RESULT = 'result',
  RATING = 'rating'
} 