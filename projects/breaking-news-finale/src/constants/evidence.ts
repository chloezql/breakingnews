export interface Evidence {
  id: string;
  name: string;
  description: string;
}

export interface Witness {
  id: string;
  name: string;
  description: string;
}

export const AVAILABLE_EVIDENCE: Evidence[] = [
  {
    id: 'photo1',
    name: 'Crime Scene Photo',
    description: 'A photograph showing the aftermath of the incident.'
  },
  {
    id: 'document1',
    name: 'Official Report',
    description: 'An official document detailing the initial findings.'
  },
  {
    id: 'evidence1',
    name: 'Physical Evidence',
    description: 'Physical items collected from the scene.'
  },
  {
    id: 'recording1',
    name: 'Audio Recording',
    description: 'A recording of statements made at the scene.'
  }
];

export const AVAILABLE_WITNESSES: Witness[] = [
  {
    id: 'witness1',
    name: 'Eyewitness',
    description: 'Someone who saw the incident firsthand.'
  },
  {
    id: 'witness2',
    name: 'Expert',
    description: 'A professional with relevant expertise.'
  },
  {
    id: 'witness3',
    name: 'Official',
    description: 'A government or organizational representative.'
  },
  {
    id: 'witness4',
    name: 'Anonymous Source',
    description: 'A source who wishes to remain unnamed.'
  }
]; 