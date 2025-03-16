/**
 * InterviewTypes.ts
 * 
 * Shared type definitions for the interview process.
 */

export type InterviewStage = 'pre-scan' | 'post-scan' | 'interview' | 'ending';

export type InteractionMode = 'input' | 'call';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

export interface SuspectData {
  id: string;
  name: string;
  voice: string;
  relationship: string;
  personality: string[];
  background: string[];
  timeline: { time: string; event: string }[];
  secretMotives: string[];
}

export interface CallState {
  isActive: boolean;
  suspectId: string;
  messages: Message[];
}

export interface SessionState {
  isStarted: boolean;
  calledSuspects: string[];
  timeRemaining: number;
}

// Define constants
export const TOTAL_INTERVIEW_TIME = 300; // 5 minutes in seconds
export const AVAILABLE_SUSPECTS = ['7298', '4692', '5746']; // List of available suspect IDs 