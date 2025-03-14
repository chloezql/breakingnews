import React from 'react';
import { StartPage } from './pages/StartPage';
import { VideoPage } from './pages/VideoPage';
import { GameProvider, useGame, GameStage } from './context/GameContext';
import './App.scss';

// Main App content component
function AppContent() {
  const { gameState } = useGame();

  // Render the appropriate component based on the current game stage
  const renderStage = () => {
    switch (gameState.stage) {
      case GameStage.START:
        return <StartPage />;
      case GameStage.VIDEO:
        return <VideoPage />;
      default:
        return <StartPage />;
    }
  };

  return (
    <div className="App">
      {renderStage()}
    </div>
  );
}

// Main App component with GameProvider
function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App; 