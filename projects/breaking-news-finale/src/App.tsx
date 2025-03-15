import React, { useEffect, useState } from 'react';
import { GameState, loadGameState, saveGameState } from './services/gameState';
import { GameStage } from './types/GameStages';
import { navigateToStage } from './services/navigation';
import { 
  ReporterInfoPage, 
  ResultPage, 
  RatingPage, 
  ScanIdPage, 
  AliasPage,
  WelcomePage,
  EvidenceRecapPage,
  TapeRevealPage,
  ArticleIntroPage,
  ArticleDeathCausePage,
  ArticleSuspectPage,
  ArticleMethodPage,
  ArticleMotivePage,
  ArticleEvidencePage
} from './pages';
import { GameContext } from './context/GameContext';
import TabBar from './components/TabBar';
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
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Handle player loaded from ScanIdPage
  const handlePlayerLoaded = (playerId: string) => {
    console.log('Player loaded with ID:', playerId);
    
    // Load the game state
    const state = loadGameState();
    
    if (state && state.id === playerId) {
      console.log('Game state loaded for player:', state);
      setGameState(state);
      setIsInitialized(true);
      
      // Move to the next stage after a short delay
      updateGameState({ currentStage: GameStage.ALIAS });
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
      } else {
        // If no state exists, set the initial stage to SCAN_ID
        const initialState: GameState = {
          currentStage: GameStage.SCAN_ID,
          id: '',
          player_name: '',
          id_card_no: '',
          headline: '',
          evidence_list: [],
          tape: [],
          selected_suspect: '',
          story_angle: '',
          full_article_generated: '',
          ratings: {
            viral: 0,
            truth: 0,
            creativity: 0,
            overall: 0,
            feedback: ''
          }
        };
        setGameState(initialState);
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
  
  if (!gameState) return <div className="error-screen">Error loading game data</div>;

  // Render the appropriate page based on the current stage
  const renderCurrentPage = () => {
    switch (gameState.currentStage) {
      case GameStage.SCAN_ID:
        return <ScanIdPage onPlayerLoaded={handlePlayerLoaded} />;
      case GameStage.ALIAS:
        return <AliasPage />;
      case GameStage.WELCOME:
        return <WelcomePage />;
      case GameStage.EVIDENCE_RECAP:
        return <EvidenceRecapPage />;
      case GameStage.TAPE_REVEAL:
        return <TapeRevealPage />;
      case GameStage.ARTICLE_INTRO:
        return <ArticleIntroPage />;
      case GameStage.ARTICLE_DEATH_CAUSE:
        return <ArticleDeathCausePage />;
      case GameStage.ARTICLE_SUSPECT:
        return <ArticleSuspectPage />;
      case GameStage.ARTICLE_METHOD:
        return <ArticleMethodPage />;
      case GameStage.ARTICLE_MOTIVE:
        return <ArticleMotivePage />;
      case GameStage.ARTICLE_EVIDENCE:
        return <ArticleEvidencePage />;
      case GameStage.ANGLE_GENERATION:
        // Temporarily redirect to Reporter Info until AngleGenerationPage is implemented
        updateGameState({ currentStage: GameStage.REPORTER_INFO });
        return <div className="loading-screen">Loading next page...</div>;
      case GameStage.REPORTER_INFO:
        return <ReporterInfoPage />;
      case GameStage.RESULT:
        return <ResultPage />;
      case GameStage.RATING:
        return <RatingPage />;
      default:
        return <ScanIdPage onPlayerLoaded={handlePlayerLoaded} />;
    }
  };

  // Determine which stages should not show the tab bar and user ID badge
  const hideUIStages = [
    GameStage.SCAN_ID,
    GameStage.ALIAS,
    GameStage.WELCOME,
    GameStage.ARTICLE_INTRO,
    GameStage.ARTICLE_DEATH_CAUSE,
    GameStage.ARTICLE_SUSPECT,
    GameStage.ARTICLE_METHOD,
    GameStage.ARTICLE_MOTIVE,
    GameStage.ARTICLE_EVIDENCE
  ];

  return (
    <div className="App">
      <div className="app-content">
        {/* Windows 2000s-style tab bar - only show after certain stages */}
        {!hideUIStages.includes(gameState.currentStage) && (
          <TabBar currentStage={gameState.currentStage} />
        )}
        
        {/* Display the user ID badge if we have a game state with an ID */}
        {gameState && gameState.id && !hideUIStages.includes(gameState.currentStage) && (
          <UserIdBadge playerId={gameState.id} />
        )}
        
        <GameContext.Provider value={{ gameState, updateGameState, moveToNextStage }}>
          {renderCurrentPage()}
        </GameContext.Provider>
      </div>
    </div>
  );
}

export default App; 