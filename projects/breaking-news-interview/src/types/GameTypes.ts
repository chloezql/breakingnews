export enum GameStage {
  START = 'START',
  INTERVIEW = 'INTERVIEW',
  END = 'END'
}

export interface SuspectInterview {
  questions: string[];
  answers: string[];
}

export interface GameState {
  currentStage: number;
  selectedSuspect: number;
  suspectInterviews: {
    [key: number]: SuspectInterview;
  };
} 