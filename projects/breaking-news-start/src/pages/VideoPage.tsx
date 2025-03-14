import React, { useEffect, useRef } from 'react';
import { useGame, GameStage } from '../context/GameContext';
import './VideoPage.scss';

export function VideoPage() {
  const { gameState, resetGame } = useGame();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play the video when the component mounts
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }
  }, []);

  // Handle video end
  const handleVideoEnd = () => {
    // Reset the game state and go back to the start page
    setTimeout(() => {
      resetGame();
    }, 3000);
  };

  return (
    <div className="video-page">
      {/* Display user ID in the corner */}
      {gameState.player && (
        <div className="user-id">
          Player ID: {gameState.player.id}
        </div>
      )}

      {/* Video player */}
      <div className="video-container">
        <video 
          ref={videoRef}
          src="/banana.mp4"
          controls={false}
          autoPlay
          onEnded={handleVideoEnd}
        />
      </div>
    </div>
  );
} 