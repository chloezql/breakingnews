import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './TapeRevealPage.scss';

// Define the tape matches
interface TapeMatch {
  id: number;
  witness: string;
  witnessImage: string;
  suspect: string;
  suspectImage: string;
  tapeImage: string;
}

export function TapeRevealPage() {
  const { gameState, moveToNextStage } = useGame();
  const [revealedMatches, setRevealedMatches] = useState<number[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(-1);
  
  // Define the tape matches
  const tapeMatches: TapeMatch[] = [
    {
      id: 1,
      witness: "Football Player",
      witnessImage: "/witness-photos/football-player-tape.png",
      suspect: "Kevin",
      suspectImage: "/character-photos/kevin.png",
      tapeImage: "/witness-photos/football-player-tape.png"
    },
    {
      id: 2,
      witness: "Exhibition Manager",
      witnessImage: "/witness-photos/manager-tape.png",
      suspect: "Dr. Hart",
      suspectImage: "/character-photos/dr.hart.png",
      tapeImage: "/witness-photos/manager-tape.png"
    },
    {
      id: 3,
      witness: "Neighbor at Dorm",
      witnessImage: "/witness-photos/neighbor-tape.png",
      suspect: "Lucy",
      suspectImage: "/character-photos/lucy.png",
      tapeImage: "/witness-photos/neighbor-tape.png"
    }
  ];
  
  // Get the successful matches from the game state
  const successfulMatches = gameState?.tape || [];
  
  // Start the reveal animation when the component mounts
  useEffect(() => {
    startReveal();
  }, []);
  
  // Function to start the reveal animation
  const startReveal = () => {
    if (isRevealing) return;
    
    setIsRevealing(true);
    setCurrentRevealIndex(-1);
    setRevealedMatches([]);
    
    // If there are no successful matches, show all as failures quickly
    if (!successfulMatches || successfulMatches.length === 0) {
      tapeMatches.forEach((match, index) => {
        setTimeout(() => {
          setCurrentRevealIndex(index);
          setTimeout(() => {
            setRevealedMatches(prev => [...prev, match.id]);
          }, 800); // Reduced from 1000ms
        }, index * 1500); // Reduced from 2000ms
      });
      
      // Set revealing to false after all matches are revealed
      setTimeout(() => {
        setIsRevealing(false);
      }, tapeMatches.length * 1500 + 800); // Adjusted timing
      
      return;
    }
    
    // Reveal each match with a delay
    tapeMatches.forEach((match, index) => {
      setTimeout(() => {
        setCurrentRevealIndex(index);
        setTimeout(() => {
          setRevealedMatches(prev => [...prev, match.id]);
        }, 1200); // Reduced from 1500ms
      }, index * 2000); // Reduced from 3000ms
    });
    
    // Set revealing to false after all matches are revealed
    setTimeout(() => {
      setIsRevealing(false);
    }, tapeMatches.length * 2000 + 1200); // Adjusted timing
  };
  
  // Check if a match is successful
  const isMatchSuccessful = (matchId: number) => {
    return successfulMatches && successfulMatches.includes(matchId);
  };
  
  // Handle continue button click
  const handleContinue = () => {
    moveToNextStage();
  };
  
  return (
    <div data-component="TapeRevealPage" className="page-container">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Witness Tapes</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="tape-container">
            <h1>Witness Tape Results</h1>
            
            <div className="tape-matches">
              {tapeMatches.map((match, index) => (
                <div 
                  key={match.id}
                  className={`tape-match ${currentRevealIndex === index ? 'revealing' : ''} ${revealedMatches.includes(match.id) ? 'revealed' : ''}`}
                >
                  <div className="match-pair">
                    <div className="witness-card">
                      <div className="card-image">
                        <img src={match.witnessImage} alt={match.witness} />
                      </div>
                      <div className="card-name">{match.witness}</div>
                    </div>
                    
                    <div className="match-connector">
                      <div className="connector-line"></div>
                      {revealedMatches.includes(match.id) && (
                        <div className={`result-indicator ${isMatchSuccessful(match.id) ? 'success' : 'failure'}`}>
                          {isMatchSuccessful(match.id) ? '✓' : '✗'}
                        </div>
                      )}
                    </div>
                    
                    <div className="suspect-card">
                      <div className="card-image">
                        <img src={match.suspectImage} alt={match.suspect} />
                      </div>
                      <div className="card-name">{match.suspect}</div>
                    </div>
                  </div>
                  
                  {currentRevealIndex === index && !revealedMatches.includes(match.id) && (
                    <div className="revealing-animation">
                      <div className="tape-image">
                        <img src={match.tapeImage} alt="Tape" />
                      </div>
                      <div className="revealing-text">Analyzing tape...</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="results-summary">
              {!isRevealing && (
                <>
                  <h2>
                    {!successfulMatches || successfulMatches.length === 0 
                      ? "No matches found in the witness tapes." 
                      : `You found ${successfulMatches.length} match${successfulMatches.length > 1 ? 'es' : ''} in the witness tapes!`}
                  </h2>
                  <button 
                    className="continue-button"
                    onClick={handleContinue}
                  >
                    Check Out My Suspects
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="window-status-bar">
          <div className="status-text">Breaking News - 2025</div>
          <div className="windows-logo"></div>
        </div>
      </div>
    </div>
  );
} 