import { useGame } from './GameContext';
import { GameStage } from '../types/GameTypes';
import { StartPage } from './StartPage';
import { IntroPage } from './IntroPage';
import { EvidenceSelectionPage } from './EvidenceSelectionPage';
import { WitnessSelectionPage } from './WitnessSelectionPage';
import { SuspectInterviewPage } from './SuspectInterviewPage';
import { ResultPage } from './ResultPage';
import { ReporterInfoPage } from './ReporterInfoPage';
import { AngleGenerationPage } from './AngleGenerationPage';
import { RatingPage } from './RatingPage';

export function GameContainer() {
  const { currentStage } = useGame();

  const renderStage = () => {
    switch (currentStage) {
      case GameStage.START:
        return <StartPage />;
      case GameStage.INTRO:
        return <IntroPage />;
      case GameStage.EVIDENCE_SELECTION:
        return <EvidenceSelectionPage />;
      case GameStage.WITNESS_SELECTION:
        return <WitnessSelectionPage />;
      case GameStage.ANGLE_GENERATION:
        return <AngleGenerationPage />;
      case GameStage.REPORTER_INFO:
        return <ReporterInfoPage />;
      case GameStage.RESULT:
        return <ResultPage />;
    }
  };

  return (
    <div className="game-container">
      {renderStage()}
    </div>
  );
} 