import React, { useState } from 'react';
import { PlayerLoginPage } from './pages/PlayerLoginPage';
import { EvidenceSelectionPage } from './pages/EvidenceSelectionPage';
import './App.scss';

function App() {
  const [playerId, setPlayerId] = useState<string | null>(null);

  const handlePlayerLogin = (id: string) => {
    setPlayerId(id);
  };

  return (
    <div className="App">
      {playerId ? (
        <EvidenceSelectionPage playerId={playerId} />
      ) : (
        <PlayerLoginPage onPlayerLogin={handlePlayerLogin} />
      )}
    </div>
  );
}

export default App; 