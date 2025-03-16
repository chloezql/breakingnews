/// <reference types="react-scripts" />

// This file is automatically created by react-scripts
// It ensures TypeScript recognizes the environment properly

declare module '@openai/realtime-api-beta' {
  export class RealtimeClient {
    constructor(options: any);
    calls: {
      create: (options: any) => any;
    };
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback: (data: any) => void) => void;
    reset: () => void;
    isConnected: () => boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    conversation: {
      getItems: () => any[];
    };
    updateSession: (options: any) => void;
    sendUserMessageContent: (content: any[]) => void;
    appendInputAudio: (data: Int16Array) => void;
    createResponse: () => void;
    cancelResponse: (id: string, sampleCount: number) => void;
    addTool: (tool: any, callback: (params: any) => Promise<any>) => void;
    realtime: {
      send: (event: string, data: any) => void;
    };
  }
}

declare module '@openai/realtime-api-beta/dist/lib/client.js' {
  export enum ItemType {
    TEXT = 'text',
    FUNCTION_CALL = 'function_call',
    FUNCTION_RESPONSE = 'function_response',
    ERROR = 'error',
    END = 'end'
  }
} 