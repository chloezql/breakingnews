import React, { useState } from 'react';
import './EvidenceTutorialPage.scss';

interface EvidenceTutorialPageProps {
  playerId: string | null;
  onComplete: () => void;
}

export function EvidenceTutorialPage({ playerId, onComplete }: EvidenceTutorialPageProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({
    select: false,
    confirm: false
  });

  // Timer to show hint if user doesn't interact
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSelected) {
        setShowHint(true);
      }
    }, 10000); // Show hint after 10 seconds

    return () => clearTimeout(timer);
  }, [isSelected]);

  const handleItemClick = () => {
    setIsSelected(!isSelected);
    setCompletedSteps(prev => ({ ...prev, select: true }));
    setShowHint(false);
  };

  const handleConfirmClick = () => {
    setCompletedSteps(prev => ({ ...prev, confirm: true }));
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  return (
    <div className="evidence-tutorial-page">
      <div className="game-content">
        <div className="page-header">
          <h1>Evidence Board - Tutorial</h1>
        </div>
        
        <div className="game-container">
          <div className="evidence-board">
            <div className="cop-container">
              <img src="/police-officer.png" alt="Police Officer" className="cop-image" />
              <div className="speech-bubble">
                {!completedSteps.select && (
                  <>
                    <h3>Welcome, Reporter!</h3>
                    <p>
                      To solve this case, you need to collect and analyze evidence.
                      Click on the item in the center of the board to select it.
                    </p>
                  </>
                )}
                
                {completedSteps.select && !completedSteps.confirm && (
                  <>
                    <h3>Good job!</h3>
                    <p>
                      Once you've selected all the evidence you need, click the "Confirm Selection" 
                      button at the bottom to proceed.
                    </p>
                  </>
                )}
                
                {completedSteps.confirm && (
                  <>
                    <h3>Excellent!</h3>
                    <p>
                      Now you're ready to investigate the real evidence. Let's go!
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <div className="board-content">
              <div 
                className={`tutorial-item ${isSelected ? 'selected' : ''} ${showHint ? 'hint-pulse' : ''}`}
                onClick={handleItemClick}
              >
                <img src="/tutorial-evidence.png" alt="Tutorial Evidence" />
                {isSelected && <div className="selected-indicator">✓</div>}
              </div>
            </div>
          </div>
        </div>
        
        <button 
          className={`confirm-button ${completedSteps.select ? 'active' : ''} ${completedSteps.confirm ? 'clicked' : ''} ${!completedSteps.select && showHint ? 'hint-hidden' : ''}`}
          onClick={handleConfirmClick}
          disabled={!completedSteps.select || completedSteps.confirm}
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
} 