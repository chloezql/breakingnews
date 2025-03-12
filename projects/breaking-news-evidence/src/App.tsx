import React, { useState } from 'react';
import { EvidenceSelectionPage } from './pages/EvidenceSelectionPage';
import { EvidenceBoardIntroPage } from './pages/EvidenceBoardIntroPage';
import { EvidenceTutorialPage } from './pages/EvidenceTutorialPage';
import './App.scss';

// Define the page flow
enum AppPage {
  INTRO = 'intro',
  TUTORIAL = 'tutorial',
  EVIDENCE_SELECTION = 'evidence_selection'
}

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(AppPage.INTRO);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Handle player login - this will be passed to the pages
  const handlePlayerLogin = (id: string) => {
    console.log('Player logged in with ID:', id);
    setPlayerId(id);
  };

  // Move to the next page in the flow
  const goToNextPage = () => {
    switch (currentPage) {
      case AppPage.INTRO:
        setCurrentPage(AppPage.TUTORIAL);
        break;
      case AppPage.TUTORIAL:
        setCurrentPage(AppPage.EVIDENCE_SELECTION);
        break;
      default:
        console.log('Already at the final page');
    }
  };

  // Render the appropriate page based on the current state
  const renderCurrentPage = () => {
    switch (currentPage) {
      case AppPage.INTRO:
        return <EvidenceBoardIntroPage 
                 playerId={playerId} 
                 onComplete={goToNextPage}
                 onLogin={handlePlayerLogin} 
               />;
      case AppPage.TUTORIAL:
        return <EvidenceTutorialPage playerId={playerId} onComplete={goToNextPage} />;
      case AppPage.EVIDENCE_SELECTION:
        // No need to handle login in this page anymore, player ID is already set
        return <EvidenceSelectionPage initialPlayerId={playerId} />;
      default:
        return <div>Error: Unknown page</div>;
    }
  };

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  );
}

export default App; 