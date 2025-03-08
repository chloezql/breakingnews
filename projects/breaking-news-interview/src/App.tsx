import React from 'react';
import { GameProvider } from './context/GameContext';
import { SuspectInterviewPage } from './pages/SuspectInterviewPage';
import './App.scss';

function App() {
  return (
    <GameProvider>
      <div className="App">
        <SuspectInterviewPage />
      </div>
    </GameProvider>
  );
}

export default App; 