import React, { useState, useCallback } from 'react';
import { Button } from '../components/button/Button';
import { useGame } from '../context/GameContext';
import './SuspectInterviewPage.scss';

export function SuspectInterviewPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const [textInput, setTextInput] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    const suspectId = gameState.selectedSuspect;
    const currentQuestions = gameState.suspectInterviews[suspectId].questions;
    const currentAnswers = gameState.suspectInterviews[suspectId].answers;

    updateGameState({
      suspectInterviews: {
        ...gameState.suspectInterviews,
        [suspectId]: {
          questions: [...currentQuestions, textInput],
          answers: [...currentAnswers, "Mock response from the suspect"]
        }
      }
    });

    setTextInput('');
  };

  const handleNextButtonClick = () => {
    if (!gameState.selectedSuspect) {
      alert("Please select a suspect before proceeding");
      return;
    }
    moveToNextStage();
  };

  return (
    <div className="suspect-interview-page">
      <h1>Interview the Suspect</h1>
      
      <div className="suspect-selection">
        <h2>Select a Suspect</h2>
        <div className="suspect-buttons">
          <Button
            onClick={() => updateGameState({ selectedSuspect: 1 })}
            className={gameState.selectedSuspect === 1 ? 'active' : ''}
          >
            Suspect 1
          </Button>
          <Button
            onClick={() => updateGameState({ selectedSuspect: 2 })}
            className={gameState.selectedSuspect === 2 ? 'active' : ''}
          >
            Suspect 2
          </Button>
        </div>
      </div>

      <div className="interview-section">
        <div className="conversation-history">
          {gameState.selectedSuspect && gameState.suspectInterviews[gameState.selectedSuspect].questions.map((question, index) => (
            <div key={index} className="conversation-item">
              <p className="question">Q: {question}</p>
              <p className="answer">A: {gameState.suspectInterviews[gameState.selectedSuspect].answers[index]}</p>
            </div>
          ))}
        </div>

        <div className="input-section">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your question here..."
            disabled={isRecording}
          />
          <div className="controls">
            <Button onClick={handleTextSubmit} disabled={!textInput.trim() || isRecording}>
              Send Question
            </Button>
            <Button onClick={handleNextButtonClick}>
              Next Stage
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 