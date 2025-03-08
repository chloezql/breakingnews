
export interface Evidence {
  id: number;
  name: string;
  description: string;
  image: string;
  type: 'physical' | 'document' | 'testimony';
}

export interface Witness {
  id: number;
  name: string;
  description: string;
  image: string;
  testimony: string;
}

export interface Suspect {
  id: number;
  name: string;
  description: string;
  image: string;
  profile: string;
  motivation: string;
  relationship: string;
  role: string;
  voice: string;
}


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

export interface GameState {
  currentStage: GameStage;
  selectedEvidence?: Evidence[];
  selectedWitnesses?: Witness[];
  selectedSuspect?: number;
  suspectInterviews?: {
    [suspectId: number]: {
      questions: string[];
      answers: string[];
    };
  };
  storyAngle?: string;
  reporterInfo?: {
    name: string;
    publication: string;
  };
  result?: {
    score: number;
    feedback: string;
  };
}

export const initialGameState: GameState = {
  currentStage: GameStage.START,
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
