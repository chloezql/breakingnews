import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { WITNESS_LIST } from '../constants/witness';
import { GameStage } from '../types/GameStages';
import './ArticleWitnessQuotesPage.scss';

// Define the quote interface for internal component use
interface Quote {
  text: string;
  witnessId: number;
  witnessName: string;
}

export function ArticleWitnessQuotesPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  
  // Get the initially selected quotes from the game state or use an empty array
  const [selectedQuotes, setSelectedQuotes] = useState<Quote[]>(() => {
    const storedQuotes = gameState?.article_witness_quotes || [];
    
    // Convert string quotes to Quote objects
    return storedQuotes.map((quoteStr: string) => {
      // Try to extract witness name from the format "quote - witness"
      const match = quoteStr.match(/"(.+)" - (.+)$/);
      if (match) {
        const [, text, witnessName] = match;
        // Find the witness ID based on the name
        const witness = WITNESS_LIST.find(w => w.name === witnessName);
        return {
          text,
          witnessId: witness?.id || 0,
          witnessName
        };
      }
      // Fallback if the format doesn't match
      return {
        text: quoteStr,
        witnessId: 0,
        witnessName: 'Unknown'
      };
    });
  });
  
  const [error, setError] = useState('');
  const [currentWitnessIndex, setCurrentWitnessIndex] = useState(0);
  const [highlightedText, setHighlightedText] = useState('');
  const textRef = useRef<HTMLDivElement>(null);
  
  // Get successful tape matches from game state
  const successfulTapeMatches = gameState?.tape || [];
  
  // Filter witnesses to only show those that were successfully matched
  const availableWitnesses = WITNESS_LIST.filter(witness => 
    successfulTapeMatches.includes(witness.id)
  );
  
  // Get the current witness or default to first available witness
  const currentWitness = availableWitnesses.length > 0 
    ? availableWitnesses[currentWitnessIndex] 
    : null;
  
  // Handle text selection/highlighting
  const handleTextSelection = () => {
    if (!currentWitness) return;
    
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setHighlightedText(selection.toString().trim());
    }
  };
  
  // Clear selection when changing witnesses
  useEffect(() => {
    setHighlightedText('');
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }, [currentWitnessIndex]);
  
  // Add the highlighted quote to the selected quotes
  const addQuote = () => {
    if (!currentWitness) return;
    
    if (highlightedText) {
      // Check if this exact quote is already selected
      const quoteExists = selectedQuotes.some(
        quote => quote.text === highlightedText && quote.witnessId === currentWitness.id
      );
      
      if (!quoteExists) {
        const newQuote: Quote = {
          text: highlightedText,
          witnessId: currentWitness.id,
          witnessName: currentWitness.name
        };
        
        setSelectedQuotes(prev => [...prev, newQuote]);
        setHighlightedText('');
        
        // Clear selection
        if (window.getSelection) {
          window.getSelection()?.removeAllRanges();
        }
        
        // Clear any error when a quote is added
        if (error) setError('');
      }
    }
  };
  
  // Remove a quote from the selected quotes
  const removeQuote = (index: number) => {
    setSelectedQuotes(prev => prev.filter((_, i) => i !== index));
  };
  
  // Navigate to the next witness
  const nextWitness = () => {
    if (currentWitnessIndex < availableWitnesses.length - 1) {
      setCurrentWitnessIndex(prev => prev + 1);
    }
  };
  
  // Navigate to the previous witness
  const prevWitness = () => {
    if (currentWitnessIndex > 0) {
      setCurrentWitnessIndex(prev => prev - 1);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one quote is selected
    if (selectedQuotes.length === 0) {
      setError('Please select at least one quote from the witness(es)');
      return;
    }
    
    // Convert Quote objects to strings for game state
    const quotesForGameState = selectedQuotes.map(
      quote => `"${quote.text}" - ${quote.witnessName}`
    );
    
    // Save to game state and move to next stage
    updateGameState({ 
      article_witness_quotes: quotesForGameState,
      currentStage: GameStage.ARTICLE_INTERROGATION_FINDINGS 
    });
  };
  
  // Helper function to render the testimony with instructions
  const renderTestimony = () => {
    if (!currentWitness) {
      return (
        <div className="no-witnesses">
          <p>No witness testimonies available. You didn't successfully match any witness tapes.</p>
        </div>
      );
    }
    
    return (
      <div className="testimony-with-instructions">
        <div 
          ref={textRef}
          className="witness-testimony"
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
        >
          {currentWitness.content}
        </div>
        <div className="selection-instructions">
          <p>Highlight text above to select a quote</p>
        </div>
      </div>
    );
  };
  
  // If no witnesses are available, show a message
  if (availableWitnesses.length === 0) {
    return (
      <div data-component="ArticleWitnessQuotesPage">
        <div className="window-container">
          <div className="window-title-bar">
            <div className="title-text">Breaking News - Article Creation (6/7)</div>
            <div className="window-controls">
              <button className="minimize-btn">_</button>
              <button className="maximize-btn">[]</button>
              <button className="close-btn">×</button>
            </div>
          </div>
          
          <div className="window-content">
            <div className="article-step-container">
              <h1>Witness Quotes</h1>
              
              <div className="no-witnesses-container">
                <p className="no-witnesses-message">
                  You didn't successfully match any witness tapes, so no witness quotes are available.
                </p>
                <button 
                  className="continue-button"
                  onClick={() => updateGameState({ currentStage: GameStage.ARTICLE_INTERROGATION_FINDINGS })}
                >
                  Continue
                </button>
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
  
  return (
    <div data-component="ArticleWitnessQuotesPage">
      <div className="window-container">
        <div className="window-title-bar">
          <div className="title-text">Breaking News - Article Creation (6/7)</div>
          <div className="window-controls">
            <button className="minimize-btn">_</button>
            <button className="maximize-btn">[]</button>
            <button className="close-btn">×</button>
          </div>
        </div>
        
        <div className="window-content">
          <div className="article-step-container">
            <h1>Witness Quotes</h1>
            
            <form onSubmit={handleSubmit}>
              <div className="prompt-container">
                <p className="prompt-text">
                  To add credibility to my story, I will quote the following witness(es):
                </p>
                
                <div className="witness-container">
                  <div className="witness-navigation">
                    <button 
                      type="button" 
                      className="nav-button prev-button"
                      onClick={prevWitness}
                      disabled={currentWitnessIndex === 0}
                    >
                      ← Previous
                    </button>
                    <div className="witness-info">
                      <h3 className="witness-name">{currentWitness?.name}</h3>
                      <p className="witness-count">
                        Witness {currentWitnessIndex + 1} of {availableWitnesses.length}
                      </p>
                    </div>
                    <button 
                      type="button" 
                      className="nav-button next-button"
                      onClick={nextWitness}
                      disabled={currentWitnessIndex === availableWitnesses.length - 1}
                    >
                      Next →
                    </button>
                  </div>
                  
                  <div className="witness-testimony-container">
                    {renderTestimony()}
                    
                    {highlightedText && (
                      <div className="highlighted-text-container">
                        <p className="highlighted-text">"{highlightedText}"</p>
                        <button 
                          type="button" 
                          className="add-quote-button"
                          onClick={addQuote}
                        >
                          Add Quote
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="selected-quotes-container">
                    <h3 className="quotes-heading">Selected Quotes</h3>
                    {selectedQuotes.length === 0 ? (
                      <p className="no-quotes">No quotes selected yet. Highlight text above to add quotes.</p>
                    ) : (
                      <ul className="quotes-list">
                        {selectedQuotes.map((quote, index) => (
                          <li key={index} className="quote-item">
                            <p className="quote-text">"{quote.text}" - {quote.witnessName}</p>
                            <button 
                              type="button" 
                              className="remove-quote-button"
                              onClick={() => removeQuote(index)}
                              aria-label="Remove quote"
                            >
                              x
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                
                {error && <p className="error-message">{error}</p>}
              </div>
              
              <button 
                type="submit"
                className="continue-button"
                disabled={selectedQuotes.length === 0}
              >
                Continue
              </button>
            </form>
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