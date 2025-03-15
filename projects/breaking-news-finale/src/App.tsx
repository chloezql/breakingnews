import React, { useEffect, useState } from 'react';
import { GameState, loadGameState, saveGameState } from './services/gameState';
import { GameStage } from './types/GameStages';
import { navigateToStage } from './services/navigation';
import { 
  ReporterInfoPage, 
  ResultPage, 
  ScanIdPage, 
  AliasPage,
  WelcomePage,
  EvidenceRecapPage,
  SuspectRecapPage,
  TapeRevealPage,
  ArticleIntroPage,
  ArticleDeathCausePage,
  ArticleSuspectPage,
  ArticleMethodPage,
  ArticleMotivePage,
  ArticleEvidencePage,
  ArticleWitnessQuotesPage,
  ArticleStylePage
} from './pages';
import { ArticleInterrogationFindingsPage } from './pages/ArticleInterrogationFindingsPage';
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
          selected_suspect: [],
          full_article_generated: '',
          view_count: 0,
          hashtags: []
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
      let nextStage = stages[currentIndex + 1];
      
      // Skip ANGLE_GENERATION stage
      if (nextStage === GameStage.ANGLE_GENERATION) {
        nextStage = GameStage.REPORTER_INFO;
      }
      
      // Skip RATING stage
      if (nextStage === GameStage.RATING) {
        // If we're at the RESULT stage, don't move to the next stage
        if (gameState.currentStage === GameStage.RESULT) {
          return;
        }
        // Otherwise, find the next stage after RATING
        const ratingIndex = stages.indexOf(GameStage.RATING);
        if (ratingIndex < stages.length - 1) {
          nextStage = stages[ratingIndex + 1];
        } else {
          return; // No more stages after RATING
        }
      }
      
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
      case GameStage.SUSPECT_RECAP:
        return <SuspectRecapPage />;
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
      case GameStage.ARTICLE_WITNESS_QUOTES:
        return <ArticleWitnessQuotesPage />;
      case GameStage.ARTICLE_INTERROGATION_FINDINGS:
        return <ArticleInterrogationFindingsPage />;
      case GameStage.REPORTER_INFO:
        return <ReporterInfoPage />;
      case GameStage.ARTICLE_STYLE:
        return <ArticleStylePage />;
      case GameStage.RESULT:
        return <ResultPage />;
      case GameStage.RATING:
        // We no longer use the rating page, redirect to result page
        return <ResultPage />;
      default:
        return <ScanIdPage onPlayerLoaded={handlePlayerLoaded} />;
    }
  };

  // Determine which stages should not show the tab bar and user ID badge
  const hideUIStages = [
    GameStage.SCAN_ID,
    GameStage.ALIAS,
    GameStage.WELCOME,
    GameStage.EVIDENCE_RECAP,
    GameStage.TAPE_REVEAL,
    GameStage.SUSPECT_RECAP,
    GameStage.ARTICLE_INTRO,
    GameStage.ARTICLE_DEATH_CAUSE,
    GameStage.ARTICLE_SUSPECT,
    GameStage.ARTICLE_METHOD,
    GameStage.ARTICLE_MOTIVE,
    GameStage.ARTICLE_EVIDENCE,
    GameStage.ARTICLE_WITNESS_QUOTES,
    GameStage.ARTICLE_INTERROGATION_FINDINGS,
    GameStage.REPORTER_INFO,
    GameStage.ARTICLE_STYLE,
    GameStage.RESULT
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