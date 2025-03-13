import React, { useState } from 'react';
import { EvidenceSelectionPage } from './pages/EvidenceSelectionPage';
import EvidenceBoardIntroPage from './pages/EvidenceBoardIntroPage';
import { EvidenceTutorialPage } from './pages/EvidenceTutorialPage';
import ResultPage from './pages/ResultPage';
import './App.scss';

// Define the page flow
enum AppPage {
  TUTORIAL = 'TUTORIAL',
  INTRO = 'INTRO',
  EVIDENCE_SELECTION = 'EVIDENCE_SELECTION',
  RESULT = 'RESULT',
}

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(AppPage.TUTORIAL);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);

  // Handle player login - this will be passed to the pages
  const handleLogin = (newPlayerId: string) => {
    console.log('Player logged in with ID:', newPlayerId);
    setPlayerId(newPlayerId);
  };

  // Reset player ID - used when returning to the tutorial page
  const resetPlayerId = () => {
    console.log('Resetting player ID');
    setPlayerId(null);
    setIsTimeout(false);
  };

  // Handle the confirmation of evidence selection - go to results page
  const handleEvidenceConfirm = (timedOut?: boolean) => {
    setIsTimeout(!!timedOut);
    setCurrentPage(AppPage.RESULT);
  };

  // Move to the next page in the flow
  const goToNextPage = () => {
    switch (currentPage) {
      case AppPage.TUTORIAL:
        setCurrentPage(AppPage.EVIDENCE_SELECTION);
        break;
      case AppPage.INTRO:
        setCurrentPage(AppPage.EVIDENCE_SELECTION);
        break;
      case AppPage.EVIDENCE_SELECTION:
        // Should not be called directly from here
        break;
      case AppPage.RESULT:
        // Go back to the tutorial page after results
        setCurrentPage(AppPage.TUTORIAL);
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
        return <EvidenceSelectionPage 
                 initialPlayerId={playerId} 
                 onEvidenceConfirm={handleEvidenceConfirm}
               />;
      case AppPage.RESULT:
        return <ResultPage 
                 onComplete={goToNextPage} 
                 onReset={resetPlayerId} 
                 playerId={playerId}
                 isTimeout={isTimeout}
               />;
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