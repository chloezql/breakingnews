import { useRef, useEffect, useCallback } from 'react';

interface UseAudioHandlingProps {
  audioPath: string;
  onAudioEnded?: () => void;
  onAudioError?: (error: any) => void;
  autoPlay?: boolean;
}

/**
 * useAudioHandling Hook
 * 
 * Custom hook for managing audio playback with proper event handling and cleanup.
 * Provides methods to play, pause, and reset audio elements.
 */
const useAudioHandling = ({
  audioPath,
  onAudioEnded,
  onAudioError,
  autoPlay = false
}: UseAudioHandlingProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(audioPath);
    
    // Add event listeners
    if (onAudioEnded) {
      audioRef.current.addEventListener('ended', onAudioEnded);
    }
    
    if (onAudioError) {
      audioRef.current.addEventListener('error', onAudioError);
    }
    
    // Auto play if needed
    if (autoPlay) {
      audioRef.current.play().catch(err => {
        console.error('Failed to auto-play audio:', err);
        if (onAudioError) onAudioError(err);
      });
    }
    
    // Cleanup
    return () => {
      if (audioRef.current) {
        if (onAudioEnded) {
          audioRef.current.removeEventListener('ended', onAudioEnded);
        }
        if (onAudioError) {
          audioRef.current.removeEventListener('error', onAudioError);
        }
        audioRef.current.pause();
      }
    };
  }, [audioPath, onAudioEnded, onAudioError, autoPlay]);
  
  // Play audio function
  const playAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Failed to play audio:', err);
        if (onAudioError) onAudioError(err);
      });
    }
  }, [onAudioError]);
  
  // Pause audio function
  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);
  
  // Stop and reset audio
  const resetAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);
  
  // Change audio source
  const changeAudioSource = useCallback((newPath: string) => {
    if (audioRef.current) {
      const wasPlaying = !audioRef.current.paused;
      audioRef.current.src = newPath;
      if (wasPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Failed to play new audio source:', err);
          if (onAudioError) onAudioError(err);
        });
      }
    }
  }, [onAudioError]);
  
  return {
    playAudio,
    pauseAudio,
    resetAudio,
    changeAudioSource,
    audioElement: audioRef.current
  };
};

export default useAudioHandling; 