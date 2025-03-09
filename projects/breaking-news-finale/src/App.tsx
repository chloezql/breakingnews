import React, { useEffect, useState } from 'react';
import { GameState, loadGameState, saveGameState } from './services/gameState';
import { GameStage } from './types/GameStages';
import { navigateToStage } from './services/navigation';
import { AngleGenerationPage, ReporterInfoPage, ResultPage, RatingPage } from './pages';
import { GameContext } from './context/GameContext';
import { findPlayerByCardId } from './services/api';
import { codeToCardId } from './types/codeToCardId';
import './App.scss';

// User ID Badge component
const UserIdBadge: React.FC<{ playerId: string }> = ({ playerId }) => {
  return (
    <div className="user-id-badge">
      <span className="user-id-label">Reporter ID:</span>
      <span className="user-id-value">{playerId}</span>
    </div>
  );
};

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [codeInput, setCodeInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Function to fetch player data using a card ID
  const fetchPlayerData = async (cardId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching player data for card ID:', cardId);
      const playersData = await findPlayerByCardId(cardId);
      
      if (playersData && playersData.length > 0) {
        const playerData = playersData[0]; // Get the first player from the array
        console.log('Player found:', playerData);
        
        // Load existing game state to preserve any data
        const existingState = loadGameState();
        
        // Create or update game state with player data
        const newState: GameState = {
          currentStage: GameStage.ANGLE_GENERATION,
          id: playerData.id,
          player_name: "",
          id_card_no: playerData.id_card_no,
          headline: "",
          evidence_list: playerData.evidence_list,
          tape: playerData.tape,
          selected_suspect: playerData.selected_suspect,
          story_angle: "",
          full_article_generated: "",
          ratings: {
            viral: 0,
            truth: 0,
            creativity: 0,
            overall: 0,
            feedback: ''
          },
          
          ...(existingState || {}) // Preserve any existing state
        };
        
        saveGameState(newState);
        setGameState(newState);
        setIsInitialized(true);
        console.log('Game state initialized:', newState);
      } else {
        console.error('Player not found for card ID:', cardId);
        setError(`No player found for code. Please try again.`);
        
        // If player not found, still try to use existing state
        const existingState = loadGameState();
        if (existingState) {
          setGameState(existingState);
        }
      }
    } catch (error) {
      console.error('Error initializing game:', error);
      setError('Error connecting to server. Please try again.');
      
      // If there's an error, still try to use existing state
      const existingState = loadGameState();
      if (existingState) {
        setGameState(existingState);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle code input changes
  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodeInput(e.target.value);
  };

  // Handle code submission
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if the code is in the mapping
    const code = codeInput.trim();
    const cardId = codeToCardId[code as keyof typeof codeToCardId];
    
    if (cardId) {
      await fetchPlayerData(cardId);
    } else {
      setError('Invalid code. Please try again.');
    }
  };

  // Check for existing game state on initial load
  useEffect(() => {
    const checkExistingState = () => {
      setIsLoading(true);
      
      // Load existing game state
      const state = loadGameState();
      
      // If we have a state with a player ID, use it
      if (state && state.id) {
        console.log('Using existing game state:', state);
        setGameState(state);
        setIsInitialized(true);
      }
      
      setIsLoading(false);
    };

    checkExistingState();
  }, []);

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState(prev => {
      if (!prev) return null;
      const newState = { ...prev, ...updates };
      saveGameState(newState);
      return newState;
    });
  };

  const moveToNextStage = () => {
    if (!gameState) return;
    
    const stages = Object.values(GameStage);
    const currentIndex = stages.indexOf(gameState.currentStage);
    
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      updateGameState({ currentStage: nextStage });
    }
  };

  if (isLoading) return <div className="loading-screen">Loading player data...</div>;
  
  // Show code input screen if not initialized
  if (!isInitialized) {
    return (
      <div className="code-input-screen">
        <div className="logo-container">
          <img src="/breaking-news-logo.png" alt="Breaking News" className="logo" />
        </div>
        
        <div className="code-form-container">
          <h2>Enter Your Reporter Code</h2>
          <p>Enter your 2-digit reporter code to begin</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleCodeSubmit}>
            <input
              type="text"
              value={codeInput}
              onChange={handleCodeInputChange}
              placeholder="Enter code (e.g. 11)"
              maxLength={2}
              autoFocus
            />
            <button type="submit">Start</button>
          </form>
          
          <div className="code-help">
            <p>Available codes: 11, 12, 15, 16, 17</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!gameState) return <div className="error-screen">Error loading game data</div>;

  // Render the appropriate page based on the current stage
  const renderCurrentPage = () => {
    switch (gameState.currentStage) {
      case GameStage.ANGLE_GENERATION:
        return <AngleGenerationPage />;
      case GameStage.REPORTER_INFO:
        return <ReporterInfoPage />;
      case GameStage.RESULT:
        return <ResultPage />;
      case GameStage.RATING:
        return <RatingPage />;
      default:
        return <AngleGenerationPage />;
    }
  };

  return (
    <div className="App">
      {/* Display the user ID badge if we have a game state with an ID */}
      {gameState && gameState.id && <UserIdBadge playerId={gameState.id} />}
      
      <GameContext.Provider value={{ gameState, updateGameState, moveToNextStage }}>
        {renderCurrentPage()}
      </GameContext.Provider>
    </div>
  );
}

export default App; 