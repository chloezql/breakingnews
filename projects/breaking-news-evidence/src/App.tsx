import React, { useState } from 'react';
import { EvidenceSelectionPage } from './pages/EvidenceSelectionPage';
import EvidenceBoardIntroPage from './pages/EvidenceBoardIntroPage';
import { EvidenceTutorialPage } from './pages/EvidenceTutorialPage';
import './App.scss';

// Define the page flow
enum AppPage {
  TUTORIAL = 'TUTORIAL',
  INTRO = 'INTRO',
  EVIDENCE_SELECTION = 'EVIDENCE_SELECTION',
}

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(AppPage.TUTORIAL);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Handle player login - this will be passed to the pages
  const handleLogin = (newPlayerId: string) => {
    console.log('Player logged in with ID:', newPlayerId);
    setPlayerId(newPlayerId);
  };

  // Move to the next page in the flow
  const goToNextPage = () => {
    switch (currentPage) {
      case AppPage.TUTORIAL:
        setCurrentPage(AppPage.INTRO);
        break;
      case AppPage.INTRO:
        setCurrentPage(AppPage.EVIDENCE_SELECTION);
        break;
      case AppPage.EVIDENCE_SELECTION:
        // This is the final page
        break;
      default:
        console.error('Unknown page:', currentPage);
    }
  };

  // Render the appropriate page based on the current state
  const renderCurrentPage = () => {
    switch (currentPage) {
      case AppPage.TUTORIAL:
        return <EvidenceTutorialPage onComplete={goToNextPage} onLogin={handleLogin} />;
      case AppPage.INTRO:
        return <EvidenceBoardIntroPage onComplete={goToNextPage} playerId={playerId} />;
      case AppPage.EVIDENCE_SELECTION:
        return <EvidenceSelectionPage initialPlayerId={playerId} />;
      default:
        return <div>Unknown page</div>;
    }
  };

  return (
    <div className="app">
      {renderCurrentPage()}
    </div>
  );
}

export default App; 