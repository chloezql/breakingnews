import { useRef, useEffect, useCallback, useState } from 'react';

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
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  
  // Initialize audio element
  useEffect(() => {
    // Create new audio element
    const audio = new Audio();
    
    // Set up event listeners before setting source
    if (onAudioEnded) {
      audio.addEventListener('ended', onAudioEnded);
    }
    
    if (onAudioError) {
      audio.addEventListener('error', onAudioError);
    }
    
    // Add canplaythrough event to know when audio is loaded
    const handleCanPlayThrough = () => {
      setIsAudioLoaded(true);
      if (autoPlay) {
        audio.play().catch(err => {
          if (onAudioError) onAudioError(err);
        });
      }
    };
    
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    
    // Set the source last to trigger loading
    audio.src = audioPath;
    audio.load();
    
    // Store the audio element in ref
    audioRef.current = audio;
    
    // Cleanup
    return () => {
      if (audio) {
        audio.pause();
        if (onAudioEnded) {
          audio.removeEventListener('ended', onAudioEnded);
        }
        if (onAudioError) {
          audio.removeEventListener('error', onAudioError);
        }
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      }
    };
  }, [audioPath, onAudioEnded, onAudioError, autoPlay]);
  
  // Play audio function with pre-load check
  const playAudio = useCallback(() => {
    if (!audioRef.current) return;
    
    // If audio isn't loaded yet, force load and add one-time event listener
    if (!isAudioLoaded) {
      audioRef.current.load();
      const playOnceLoaded = () => {
        audioRef.current?.play();
        audioRef.current?.removeEventListener('canplaythrough', playOnceLoaded);
      };
      audioRef.current.addEventListener('canplaythrough', playOnceLoaded);
    } else {
      // If loaded, play directly
      audioRef.current.currentTime = 0; // Reset to beginning
      audioRef.current.play().catch(err => {
        if (onAudioError) onAudioError(err);
      });
    }
  }, [isAudioLoaded, onAudioError]);
  
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
      setIsAudioLoaded(false);
      audioRef.current.src = newPath;
      audioRef.current.load();
      if (wasPlaying) {
        const playWhenLoaded = () => {
          audioRef.current?.play();
          audioRef.current?.removeEventListener('canplaythrough', playWhenLoaded);
        };
        audioRef.current.addEventListener('canplaythrough', playWhenLoaded);
      }
    }
  }, []);
  
  return {
    playAudio,
    pauseAudio,
    resetAudio,
    changeAudioSource,
    audioElement: audioRef.current,
    isAudioLoaded
  };
};

export default useAudioHandling; 