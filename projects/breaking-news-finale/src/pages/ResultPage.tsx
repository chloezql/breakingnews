import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { EVIDENCE_ITEMS } from '../types/evidence';
import { witnessTapes } from '../types/tapes';
import { getSuspect } from '../types/suspects';
import './ResultPage.scss';

// Import OpenAI
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Helper function to shuffle an array
const shuffleArray = <T extends any>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export function ResultPage() {
  const { gameState, updateGameState, moveToNextStage } = useGame();
  const [full, setFull] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isStoryReady, setIsStoryReady] = useState(false);
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const generationAttempted = React.useRef(false);

  // Generate the news story when the component mounts
  useEffect(() => {
    // Only generate if we haven't already attempted generation
    if (!generationAttempted.current) {
      console.log('Generating news story - first attempt');
      generationAttempted.current = true;
      generateNewsStory();
    }
    
    // This effect should only run once when the component mounts
  }, []);

  // Get images from the player's selected evidence
  const getSelectedEvidenceImages = () => {
    if (!gameState.evidence_list || gameState.evidence_list.length === 0) {
      console.log('No evidence list found in game state');
      setEvidenceImages([]);
      return;
    }

    // Get all evidence items selected by the player
    const selectedEvidence = gameState.evidence_list
      .map(id => {
        const evidence = EVIDENCE_ITEMS.find(e => e.id === id);
        if (evidence) {
          console.log(`Found evidence item: ${evidence.name}, image: ${evidence.image}`);
        }
        return evidence;
      })
      .filter(e => e && e.image) as { id: number; image: string }[];
    
    if (selectedEvidence.length === 0) {
      console.log('No valid evidence items with images found');
      setEvidenceImages([]);
      return;
    }
    
    let imagesToShow: string[];
    
    if (selectedEvidence.length <= 3) {
      // If 3 or fewer evidence items, use all of them
      imagesToShow = selectedEvidence.map(e => e.image);
    } else {
      // If more than 3, randomly select 2-3 items
      const numToShow = Math.floor(Math.random() * 2) + 2; // Random number between 2-3
      const shuffledEvidence = shuffleArray(selectedEvidence).slice(0, numToShow);
      imagesToShow = shuffledEvidence.map(e => e.image);
    }
    
    console.log(`Selected ${imagesToShow.length} evidence images:`, imagesToShow);
    setEvidenceImages(imagesToShow);
  };

  // Function to generate a news story based on the user's input
  const generateNewsStory = async () => {
    setIsGenerating(true);
    console.log('Generating news story...');
    try {
      // Get evidence details
      const evidenceDetails = gameState.evidence_list 
        ? gameState.evidence_list.map(id => {
            const evidence = EVIDENCE_ITEMS.find(e => e.id === id);
            return evidence 
              ? `${evidence.name}: ${evidence.description}` 
              : '';
          }).filter(Boolean).join('\n')
        : '';
      
      // Get tape details
      const tapeDetails = gameState.tape
        ? witnessTapes.find(t => t.id.toString() === gameState.tape)?.content || ''
        : '';
      
      // Get suspect details
      const suspectDetails = gameState.selected_suspect
        ? (() => {
            const suspect = getSuspect(gameState.selected_suspect);
            return suspect 
              ? `Name: ${suspect.name}\nRelationship: ${suspect.relationship}\nBackground: ${suspect.background.join(', ')}`
              : '';
          })()
        : '';

      // Create the prompt for OpenAI
      const prompt = `You are a skilled newspaper journalist writing a breaking news story. 
      Write a concise news article based on the following information:

      Headline: ${gameState.headline || "Breaking News"}
      Reporter's Angle: ${gameState.story_angle || ""}

      ${evidenceDetails ? `Key Evidence:\n${evidenceDetails}` : ''}

      ${tapeDetails ? `Witness Testimony:\n${tapeDetails}` : ''}

      ${suspectDetails ? `Suspect Information:\n${suspectDetails}` : ''}

      Write the story in a journalistic style with:
      - A strong opening paragraph that hooks the reader
      - Integration of key evidence, witness quotes, and suspect information
      - Professional and objective tone
      - 3-4 short paragraphs for readability
      - Focus on the most impactful details
      - Don't print headline, just the content of the story
      - You are trying to make the story to attract more readers, go viral or get more clicks
      - The story should maintain journalistic integrity while highlighting the chosen angle.
      Remember: Keep it under 250 words total.`;

      // If OpenAI API key is available, use it to generate the story
      if (process.env.REACT_APP_OPENAI_API_KEY) {
        console.log('Generating story with OpenAI...');
        
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4",
          temperature: 0.7,
          max_tokens: 1000,
        });

        const generatedStory = completion.choices[0].message.content || '';
        console.log('Generated story:', generatedStory);
        setFull(generatedStory);
        updateGameState({ full_article_generated: generatedStory });
        getSelectedEvidenceImages();
      } else {
        // Fallback if no API key is available
        console.log('No OpenAI API key found, using fallback story generation');
        
        // Create a simple story based on the user's input
        const fallbackStory = `In a shocking development today, ${gameState.story_angle} 
        
        Local authorities have confirmed the incident and are investigating further. "We are taking this matter very seriously," said Police Chief Johnson.
        
        ${tapeDetails ? `One witness stated, "${tapeDetails}"` : 'Witnesses at the scene described the events as "unprecedented" and "alarming."'} Community members are advised to stay informed as this story develops.
        
        ${suspectDetails ? `Authorities are currently questioning ${getSuspect(gameState.selected_suspect || '')?.name || 'a person of interest'} in connection with the case.` : 'This is a developing story, and more details will be provided as they become available.'}`;
        
        setFull(fallbackStory);
        updateGameState({ full_article_generated: fallbackStory });
        getSelectedEvidenceImages();
      }
    } catch (error) {
      console.error('Error generating news story:', error);
      
      // Fallback in case of error
      const errorStory = `In a shocking development today, ${gameState.story_angle} 
      
      Local authorities have confirmed the incident and are investigating further. "We are taking this matter very seriously," said Police Chief Johnson.
      
      Witnesses at the scene described the events as "unprecedented" and "alarming." Community members are advised to stay informed as this story develops.
      
      This is a developing story, and more details will be provided as they become available.`;
      
      setFull(errorStory);
      updateGameState({ full_article_generated: errorStory });
      getSelectedEvidenceImages();
    } finally {
      setIsGenerating(false);
      setIsStoryReady(true);
    }
  };

  // Handle printing the newspaper
  const handlePrint = () => {
     // Optional: Add a class to the body to trigger print-specific styles
      document.body.classList.add('printing');
      
      // Print the page
      window.print();
      
      // Remove the class after printing
      setTimeout(() => {
        document.body.classList.remove('printing');
      }, 500);
  };

  // Navigate to the rating page
  const goToRatingPage = () => {
    moveToNextStage();
  };

  return (
    <div className="result-page page-container">
      <div className="breaking-news-logo">
        <img src="/breaking-news-logo.png" alt="Breaking News" />
      </div>
      
      <div className="newspaper">
        <div className="newspaper-header">
          <h1>Global Daily Courier</h1>
          <div className="date-line">WEDNESDAY, MARCH 19, 2025</div>
        </div>
        
        <div className="headline">
          {gameState.headline || "Breaking News Headline"}
        </div>
        
        <div className="byline">
          Reported By: {gameState.player_name || "Anonymous Reporter"} &nbsp;&nbsp;&nbsp;Date: {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
        </div>
        
        <div className="story-content">
          {isGenerating ? (
            <div className="loading-animation">
              <div className="typewriter">
                <div className="line"></div>
                <div className="line"></div>
                <div className="line"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Main story content */}
              <div className="main-column">
                {evidenceImages.length > 0 && (
                  <div className="main-image">
                    <img 
                      src={`/${evidenceImages[0]}`} 
                      alt="Evidence" 
                      className="evidence-img"
                      onError={(e) => {
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.classList.add('no-image');
                        }
                      }}
                    />
                  </div>
                )}
                {full.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              
              {/* Additional content and images */}
              <div className="secondary-content">
                {evidenceImages.slice(1).map((image, index) => (
                  <div key={index} className="evidence-inline">
                    <img 
                      src={`/${image}`} 
                      alt={`Evidence ${index + 2}`}
                      className="evidence-img"
                      onError={(e) => {
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.classList.add('no-image');
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Additional stories section */}
        <div className="additional-stories">
          <div className="story-box">
          <div className="mini-headline">Level Up: GDC Invades the City!</div>
            <div className="mini-content">
              Gamers and developers unite! The city is buzzing as the Game Developer Conference rolls into town, transforming every pixel and polygon into a playground of possibility. From indie to AAA, our streets are now live levels waiting to be explored. Don’t blink—you might just miss a secret side quest!
            </div>

          </div>
          <div className="story-box">
            <div className="price-comparison">
              <div className="price-item">
                <span className="price">$Scan the QR code to keep track of the leaderboard</span>
                <span className="item"></span>
              </div>
              <div className="price-item">
                {/* place a qr code placeholder here */}
                <img src="/qr_placeholder.png" alt='' className="qr-code" style={{ width: '120px', height: '120px',  marginTop: '10px' }} />
                <span className="price"></span>
                <span className="item"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isStoryReady && (
        <div className="congratulations">
          <h2>Your Story Is Published!</h2>
          <p>Your breaking news story has been published in the Global Daily Courier.</p>
          <div className="action-buttons">
            <button className="print-button" onClick={handlePrint}>
              Print Newspaper
            </button>
            <button className="print-button" onClick={goToRatingPage}>
              See Your Ratings
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 