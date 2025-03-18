import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { EVIDENCE_ITEMS, Evidence } from '../constants/evidence';
import './EvidenceRecapPage.scss';

export function EvidenceRecapPage() {
  const { gameState, moveToNextStage } = useGame();
  const [activeEvidence, setActiveEvidence] = useState<Evidence | null>(null);
  
  // Get the evidence items that the player has collected
  const playerEvidence = gameState?.evidence_list 
    ? EVIDENCE_ITEMS.filter(item => gameState.evidence_list?.includes(item.id))
    : [];

  const handleEvidenceHover = (evidence: Evidence) => {
    setActiveEvidence(evidence);
  };

  const handleEvidenceLeave = () => {
    setActiveEvidence(null);
  };

  const handleContinue = () => {
    moveToNextStage();
  };

  return (
    <div data-component="EvidenceRecapPage">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Evidence Recap</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="evidence-container">
            <h1>You snapped a few photos from the police office... </h1>
            
            {playerEvidence.length === 0 ? (
              <div className="no-evidence">
                <p>You haven't collected any evidence yet.</p>
              </div>
            ) : (
              <div className="evidence-grid-container">
                <div className={`evidence-grid ${playerEvidence.length > 3 ? 'multi-row' : ''} ${playerEvidence.length === 4 ? 'items-4' : ''}`}>
                  {playerEvidence.map(evidence => (
                    <div 
                      key={evidence.id}
                      className={`evidence-item ${evidence.type}`}
                      onMouseEnter={() => handleEvidenceHover(evidence)}
                      onMouseLeave={handleEvidenceLeave}
                    >
                      <div className="evidence-image">
                        <img 
                          src={`/images/evidence/${evidence.image}`} 
                          alt={evidence.name}
                          onError={(e) => {
                            // Replace with a div containing the evidence name when image fails to load
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallbackDiv = document.createElement('div');
                              fallbackDiv.className = 'evidence-image-fallback';
                              fallbackDiv.textContent = evidence.name;
                              parent.replaceChild(fallbackDiv, e.currentTarget);
                            }
                          }}
                        />
                      </div>
                      <div className="evidence-name">{evidence.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeEvidence && (
              <div className="evidence-tooltip">
                <h3>{activeEvidence.name}</h3>
                <p className="evidence-description">{activeEvidence.description}</p>
                <p className="evidence-hint">{activeEvidence.hint}</p>
                <div className={`evidence-type-badge ${activeEvidence.type}`}>{activeEvidence.type}</div>
              </div>
            )}
            
            <button 
              className="continue-button"
              onClick={handleContinue}
            >
              Continue
            </button>
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