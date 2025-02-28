import './App.scss';
import { useState } from 'react';
import { GameProvider } from './context/GameContext';
import { GameContainer } from './pages/GameContainer';
import { AudioTranscriptionPage } from './pages/AudioTranscriptionPage';
import { SuspectInterviewPage } from './pages/SuspectInterviewPage';

function App() {
  const [showTranscribe, setShowTranscribe] = useState(false);

  if (showTranscribe) {
    return <AudioTranscriptionPage />;
  }

  return (
    <>
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={() => setShowTranscribe(true)}
          style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}
        >
          Transcribe Audio
        </button>
      )}
      <GameProvider>
        <GameContainer />
      </GameProvider>
    </>
  );
}

export default App;
