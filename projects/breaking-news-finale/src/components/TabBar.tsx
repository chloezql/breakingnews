import React from 'react';
import { GameStage } from '../types/GameStages';
import './TabBar.scss';

interface TabBarProps {
  currentStage: GameStage;
}

const TabBar: React.FC<TabBarProps> = ({ currentStage }) => {
  // Define tabs based on game stages
  const tabs = [
    { id: GameStage.SCAN_ID, label: 'Login' },
    { id: GameStage.ALIAS, label: 'Alias' },
    { id: GameStage.WELCOME, label: 'Welcome' },
    { id: GameStage.EVIDENCE_RECAP, label: 'Evidence Recap' },
    { id: GameStage.TAPE_REVEAL, label: 'Tape Reveal' },
    { id: GameStage.SUSPECT_RECAP, label: 'Suspect Recap' },
    { id: GameStage.ARTICLE_INTRO, label: 'Article Intro' },
    { id: GameStage.REPORTER_INFO, label: 'Reporter Info' },
    { id: GameStage.RESULT, label: 'Article' },
    { id: GameStage.RATING, label: 'Ratings' }
  ];

  return (
    <div className="tab-bar">
      <div className="tab-bar-inner">
        {tabs.map((tab) => (
          <div 
            key={tab.id} 
            className={`tab ${currentStage === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className="tab-content-border"></div>
    </div>
  );
};

export default TabBar; 