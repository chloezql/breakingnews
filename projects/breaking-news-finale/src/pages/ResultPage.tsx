import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { EVIDENCE_ITEMS } from '../constants/evidence';
import { witnessTapes } from '../types/tapes';
import { getSuspect } from '../types/suspects';
import './ResultPage.scss';

// Import confetti library
import confetti from 'canvas-confetti';

// Import OpenAI
import OpenAI from 'openai';
import { updatePlayerResults } from 'services/api';

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
  const { gameState, updateGameState } = useGame();
  const [article, setArticle] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isStoryReady, setIsStoryReady] = useState(false);
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [viewCount, setViewCount] = useState<number>(0);
  const [showArticle, setShowArticle] = useState(false);
  const [showViewCount, setShowViewCount] = useState(false);
  const [showHashtags, setShowHashtags] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [confettiPlayed, setConfettiPlayed] = useState(false);
  const [revealedDigits, setRevealedDigits] = useState<number[]>([]);
  const [finalViewCount, setFinalViewCount] = useState<number>(0);
  const generationAttempted = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Log the full game state for debugging
  useEffect(() => {
    console.log('ResultPage - Full Game State:', JSON.stringify(gameState, null, 2));
  }, [gameState]);

  // Generate the news story when the component mounts
  useEffect(() => {
    // Only generate if we haven't already attempted generation
    if (!generationAttempted.current) {
      console.log('Generating news story - first attempt');
      generationAttempted.current = true;
      generateNewsStory();
    }
  }, []);

  // Handle video playback and animations
  useEffect(() => {
    if (isStoryReady && videoRef.current) {
      // When the video ends, fade it out and show the article
      const handleVideoEnd = () => {
        setVideoEnded(true);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            setShowArticle(true);
            // After article is shown and centered for 2 seconds, show view count
            setTimeout(() => {
              setShowViewCount(true);
              // Initialize with all digits hidden
              setRevealedDigits([-1, -1, -1, -1, -1]);
              
              // Reveal digits one by one with delays
              const finalDigits = finalViewCount.toString().padStart(5, '0').split('').map(Number);
              
              setTimeout(() => {
                setRevealedDigits(prev => [prev[0], prev[1], prev[2], prev[3], finalDigits[4]]);
                setTimeout(() => {
                  setRevealedDigits(prev => [prev[0], prev[1], prev[2], finalDigits[3], prev[4]]);
                  setTimeout(() => {
                    setRevealedDigits(prev => [prev[0], prev[1], finalDigits[2], prev[3], prev[4]]);
                    setTimeout(() => {
                      setRevealedDigits(prev => [prev[0], finalDigits[1], prev[2], prev[3], prev[4]]);
                      setTimeout(() => {
                        setRevealedDigits(prev => [finalDigits[0], prev[1], prev[2], prev[3], prev[4]]);
                        // After all digits are revealed, show hashtags
                        setTimeout(() => {
                          setShowHashtags(true);
                          playConfetti()
                        }, 1000);
                      }, 300);
                    }, 300);
                  }, 300);
                }, 300);
              }, 300);
            }, 2000);
          }, 500);
        }, 500);
      };

      videoRef.current.addEventListener('ended', handleVideoEnd);
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('ended', handleVideoEnd);
        }
      };
    }
  }, [isStoryReady, videoRef, finalViewCount]);

  // Get images from the player's selected evidence
  const getSelectedEvidenceImages = () => {
    if (!gameState.article_evidence_ids || gameState.article_evidence_ids.length === 0) {
      console.log('No evidence list found in game state');
      setEvidenceImages([]);
      return;
    }

    // Get all evidence items selected by the player for the article
    const selectedEvidence = gameState.article_evidence_ids
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
    
    const imagesToShow = selectedEvidence.map(e => e.image);
    console.log(`Selected ${imagesToShow.length} evidence images:`, imagesToShow);
    setEvidenceImages(imagesToShow);
  };

  // Function to generate a news story based on the user's input
  const generateNewsStory = async () => {
    setIsGenerating(true);
    console.log('Generating news story...');
    try {
      // Log key game state properties used for article generation
      console.log('Article generation - key inputs:', {
        headline: gameState.headline,
        player_name: gameState.player_name,
        death_cause: gameState.article_death_cause,
        method: gameState.article_method,
        motive: gameState.article_motive,
        evidence_ids: gameState.article_evidence_ids,
        witness_quotes: gameState.article_witness_quotes,
        suspect_ids: gameState.article_suspect_ids,
        style: gameState.article_style
      });
      
      // Get evidence details
      const evidenceDetails = gameState.article_evidence_ids 
        ? gameState.article_evidence_ids.map(id => {
            const evidence = EVIDENCE_ITEMS.find(e => e.id === id);
            return evidence 
              ? `${evidence.name}: ${evidence.description}` 
              : '';
          }).filter(Boolean).join('\n')
        : '';

      // Get witness quotes text with the format "[Witness Name] mentioned [Suspect Name] in their statement : Quote"
      const getWitnessQuotesText = (witnessQuotes: string[]) => {
        // with the format "[Witness Name] mentioned [Suspect Name] in their statement : Quote"
        return witnessQuotes.map(quote => {
          const [witnessName, suspectName, quoteText] = quote.split(':');
          return `${witnessName} mentioned ${suspectName} in their statement : ${quoteText}`;
        }).join('\n');
      };
      
      // Get witness quotes
      const witnessQuotes = gameState.article_witness_quotes || [];
      const witnessQuotesText = witnessQuotes.length > 0 
        ? getWitnessQuotesText(witnessQuotes)
        : '';

      // Get suspect details
      const suspectIds = gameState.article_suspect_ids || [];
      const suspectDetails = suspectIds.length > 0
        ? suspectIds.map(id => {
            const suspect = getSuspect(id);
            if (suspect) {
              console.log(`Found suspect: ${suspect.name} with ID ${id}`);
              return `Name: ${suspect.name}, background: ${suspect.info}`;
            } else {
              console.log(`Could not find suspect with ID ${id}`);
              return '';
            }
          }).filter(Boolean).join('\n')
        : '';

      // Get interrogation findings
      const interrogationFindings = gameState.article_interrogation_findings || {};
      const interrogationText = Object.keys(interrogationFindings).length > 0
        ? Object.entries(interrogationFindings).map(([suspectId, finding]) => {
            const suspect = getSuspect(Number(suspectId));
            if (suspect) {
              console.log(`Found suspect for interrogation: ${suspect.name} with ID ${suspectId}`);
              return `${suspect.name}'s Statement: ${finding}`;
            } else {
              console.log(`Could not find suspect for interrogation with ID ${suspectId}`);
              return '';
            }
          }).filter(Boolean).join('\n')
        : '';

      // Create the structured prompt for OpenAI
      const prompt = `You are a skilled newspaper journalist writing a breaking news story for a major publication.
      
      # ARTICLE DETAILS
      Headline: "${gameState.headline || "Breaking News"}"
      Reporter: ${gameState.player_name || "Anonymous Reporter"}
      Death Cause: ${gameState.article_death_cause || "Unknown"}
      Method: ${gameState.article_method || "Unknown"}
      Motive: ${gameState.article_motive || "Unknown"}
      
      # EVIDENCE
      ${evidenceDetails ? `${evidenceDetails}` : 'No specific evidence provided.'}
      
      # WITNESS STATEMENTS
      ${witnessQuotesText ? `${witnessQuotesText}` : 'No witness statements provided.'}
      
      # SUSPECT INFORMATION
      ${suspectDetails ? `${suspectDetails}` : 'No suspect information provided.'}
      
      # INTERROGATION FINDINGS
      ${interrogationText ? `${interrogationText}` : 'No interrogation findings provided.'}
      
      # WRITING GUIDELINES
      - Your article style should build around the following keywords: ${gameState.article_style}
      - Begin with a strong, attention-grabbing lead paragraph
      - Incorporate evidence, witness quotes, and suspect information naturally
      - Maintain an objective tone while highlighting the chosen angle
      - Structure the article in 4-5 short paragraphs for readability
      - Include at least one direct quote from a witness if available
      - Focus on the most impactful details that support the headline
      - Do not include the headline in the article text
      - Aim for 250-300 words total
      
      # IMPORTANT
      - This is a breaking news story about a death at an art academy
      - The article should be factual but engaging enough to attract readers
      - Write in a way that could potentially go viral while maintaining journalistic integrity`;

      console.log('Article generation prompt:', prompt);

      // If OpenAI API key is available, use it to generate the story
      if (process.env.REACT_APP_OPENAI_API_KEY) {
        console.log('Generating story with OpenAI...');
        
        try {
          const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4",
            temperature: 0.7,
            max_tokens: 1000,
          });
  
          console.log('OpenAI API response received:', {
            status: 'success',
            model: completion.model,
            usage: completion.usage,
            finish_reason: completion.choices[0].finish_reason
          });
  
          const generatedStory = completion.choices[0].message.content || '';
          console.log('Generated story length:', generatedStory.length);
          console.log('Generated story preview:', generatedStory.substring(0, 100) + '...');
          
          setArticle(generatedStory);
          updateGameState({ full_article_generated: generatedStory });
          
          // Generate hashtags
          await generateHashtags(generatedStory);
          
          // Generate view count
          await generateViewCount(generatedStory);
          
          // Update player results
          await updatePlayerResults(gameState.id, {
            view_count: finalViewCount,
            hashtags: hashtags,
            full_article_generated: generatedStory,
            headline: gameState.headline,
            player_name: gameState.player_name,
          });
          
          // Get evidence images
          getSelectedEvidenceImages();
        } catch (apiError) {
          console.error('OpenAI API error:', apiError);
          throw apiError;
        }
      } else {
        // Fallback if no API key is available
        console.log('No OpenAI API key found, using fallback story generation');
        
        // Create a simple story based on the user's input
        const fallbackStory = `In a shocking development today at Astra Academy of Art, ${gameState.article_death_cause || "a tragic incident occurred"}.
        
        Local authorities have confirmed the incident and are investigating further. "We are taking this matter very seriously," said Police Chief Johnson.
        
        ${witnessQuotesText ? `One witness stated, ${witnessQuotesText.split('\n')[0]}` : 'Witnesses at the scene described the events as "unprecedented" and "alarming."'} Community members are advised to stay informed as this story develops.
        
        ${suspectIds.length > 0 
          ? `Authorities are currently questioning ${
              (() => {
                const suspectId = suspectIds[0];
                const suspect = getSuspect(suspectId);
                return suspect?.name || 'a person of interest';
              })()
            } in connection with the case.` 
          : 'This is a developing story, and more details will be provided as they become available.'}`;
        
        setArticle(fallbackStory);
        updateGameState({ full_article_generated: fallbackStory });
        
        // Set fallback hashtags and view count
        setHashtags(['#BreakingNews', '#AstraAcademy', '#Investigation', '#ArtWorld', '#Justice']);
        setViewCount(Math.floor(Math.random() * 90000) + 10000);
        
        // Get evidence images
        getSelectedEvidenceImages();
      }
    } catch (error) {
      console.error('Error generating news story:', error);
      
      // Fallback in case of error
      const errorStory = `In a shocking development today at Astra Academy of Art, a student was found dead under mysterious circumstances.
      
      Local authorities have confirmed the incident and are investigating further. "We are taking this matter very seriously," said Police Chief Johnson.
      
      Witnesses at the scene described the events as "unprecedented" and "alarming." Community members are advised to stay informed as this story develops.
      
      This is a developing story, and more details will be provided as they become available.`;
      
      setArticle(errorStory);
      updateGameState({ full_article_generated: errorStory });
      
      // Set fallback hashtags and view count
      setHashtags(['#BreakingNews', '#AstraAcademy', '#Investigation', '#ArtWorld', '#Justice']);
      setViewCount(Math.floor(Math.random() * 90000) + 10000);
      
      // Get evidence images
      getSelectedEvidenceImages();
    } finally {
      setIsGenerating(false);
      setIsStoryReady(true);
      console.log('Article generation complete. isGenerating:', false, 'isStoryReady:', true);
    }
  };

  // Generate hashtags based on the article
  const generateHashtags = async (articleText: string) => {
    console.log('Starting hashtag generation...');
    try {
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        throw new Error('No OpenAI API key found');
      }

      const hashtagPrompt = `Based on the following news article, generate 4-5 viral hashtags that would be used on social media. 
      Each hashtag should start with # and be a single word or short phrase with no spaces (use camelCase or hyphenation if needed).
      Make them catchy, relevant to the story, and likely to trend.
      
      Article:
      ${articleText}
      
      Format your response as a JSON array of strings, like this: ["#Hashtag1", "#Hashtag2", "#Hashtag3", "#Hashtag4"]`;

      console.log('Hashtag generation prompt:', hashtagPrompt);
      
      try {
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: hashtagPrompt }],
          model: "gpt-3.5-turbo",
          temperature: 0.8,
          max_tokens: 150,
        });
  
        console.log('Hashtag API response received:', {
          status: 'success',
          model: completion.model,
          usage: completion.usage,
          finish_reason: completion.choices[0].finish_reason
        });
  
        const responseText = completion.choices[0].message.content || '';
        console.log('Hashtag response text:', responseText);
        
        // Improved regex to extract JSON array from response
        // This pattern looks for an array of strings in the response
        try {
          console.log('Attempting to parse entire response as JSON...');
          // First try to parse the entire response as JSON
          const parsedResponse = JSON.parse(responseText);
          if (Array.isArray(parsedResponse)) {
            console.log('Successfully parsed response as JSON array:', parsedResponse);
            setHashtags(parsedResponse.slice(0, 5)); // Limit to 5 hashtags
            return;
          } else {
            console.log('Response parsed as JSON but is not an array:', parsedResponse);
          }
        } catch (e) {
          console.log('Failed to parse entire response as JSON, trying regex extraction...', e);
          // If that fails, try to extract the array using regex
          const jsonMatch = responseText.match(/\[\s*"[^"]*"(?:\s*,\s*"[^"]*")*\s*\]/);
          if (jsonMatch) {
            console.log('Found JSON-like pattern with regex:', jsonMatch[0]);
            try {
              const hashtagArray = JSON.parse(jsonMatch[0]) as string[];
              console.log('Successfully parsed extracted JSON:', hashtagArray);
              setHashtags(hashtagArray.slice(0, 5)); // Limit to 5 hashtags
              return;
            } catch (parseError) {
              console.error('Error parsing extracted JSON:', parseError);
            }
          } else {
            console.log('No JSON-like pattern found with regex');
          }
          
          // If all else fails, extract hashtags directly from text
          console.log('Attempting to extract hashtags directly from text...');
          const hashtagRegex = /#[a-zA-Z0-9]+/g;
          const extractedHashtags = responseText.match(hashtagRegex);
          if (extractedHashtags && extractedHashtags.length > 0) {
            console.log('Extracted hashtags directly from text:', extractedHashtags);
            setHashtags(extractedHashtags.slice(0, 5)); // Limit to 5 hashtags
            return;
          } else {
            console.log('No hashtags found in text');
          }
          
          // Last resort: manually create hashtags from the article
          console.log('Creating fallback hashtags based on article content...');
          const fallbackHashtags = createFallbackHashtags(articleText);
          setHashtags(fallbackHashtags);
          return;
        }
      } catch (apiError) {
        console.error('OpenAI API error during hashtag generation:', apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Error generating hashtags:', error);
      // Fallback hashtags
      setHashtags(['#BreakingNews', '#AstraAcademy', '#Investigation', '#ArtWorld', '#Justice']);
    }
  };

  // Helper function to create fallback hashtags from article text
  const createFallbackHashtags = (articleText: string): string[] => {
    const commonWords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'that', 'this', 'is', 'are', 'was', 'were'];
    
    // Extract potential keywords from the article
    const words = articleText
      .replace(/[^\w\s]/g, '')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));
    
    // Count word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Sort by frequency
    const sortedWords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 5);
    
    // Create hashtags
    const hashtags = sortedWords.map(word => `#${word.charAt(0).toUpperCase() + word.slice(1)}`);
    
    // Add some standard hashtags if we don't have enough
    const standardHashtags = ['#BreakingNews', '#AstraAcademy', '#Investigation', '#ArtWorld', '#Justice'];
    while (hashtags.length < 5) {
      const nextStandard = standardHashtags[hashtags.length];
      if (!hashtags.includes(nextStandard)) {
        hashtags.push(nextStandard);
      }
    }
    
    return hashtags;
  };

  // Generate view count based on the article
  const generateViewCount = async (articleText: string) => {
    try {
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        throw new Error('No OpenAI API key found');
      }

      const viewCountPrompt = `Based on the following news article, estimate how many views it would likely get if published online.       
      Provide ONLY a 5-digit number (between 10000 and 99999) representing the estimated views. No explanation or additional text.
      Consider the headline, content, style, social impact and viral potential. The article is about a death at an art academy.
      
      Article:
      ${articleText}
      `;

      console.log('View count generation prompt:', viewCountPrompt);
      
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: viewCountPrompt }],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 10,
      });

      const responseText = completion.choices[0].message.content || '';
      console.log('View count response:', responseText);
      
      // Improved number extraction
      // First try to extract any 5-digit number
      const fiveDigitMatch = responseText.match(/\b\d{5}\b/);
      if (fiveDigitMatch) {
        const count = parseInt(fiveDigitMatch[0], 10);
        setFinalViewCount(count);
        return;
      }
      
      // If no 5-digit number, try to extract any number
      const anyNumberMatch = responseText.match(/\b\d+\b/);
      if (anyNumberMatch) {
        const num = parseInt(anyNumberMatch[0], 10);
        // Ensure it's a 5-digit number
        if (num < 10000) {
          setFinalViewCount(num + 10000); // Make it at least 5 digits
        } else if (num > 99999) {
          setFinalViewCount(Math.floor(num % 100000)); // Take last 5 digits
        } else {
          setFinalViewCount(num);
        }
        return;
      }
      
      // If no number found, generate a random one
      setFinalViewCount(Math.floor(Math.random() * 90000) + 10000);
      
    } catch (error) {
      console.error('Error generating view count:', error);
      // Fallback view count
      setFinalViewCount(Math.floor(Math.random() * 90000) + 10000);
    }
  };

  // Function to play confetti animation
  const playConfetti = () => {
    if (confettiPlayed) return;
    
    console.log('Playing confetti animation');
    setConfettiPlayed(true);
    
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };
    
    function randomInRange(min: number, max: number): number {
      return Math.random() * (max - min) + min;
    }
    
    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      
      const particleCount = 50 * (timeLeft / duration);
      
      // Since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#fe2f0d', '#ffffff', '#000000'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#fe2f0d', '#ffffff', '#000000'],
      });
    }, 250);
  };

  // Handle printing the newspaper
  const handlePrint = () => {
    // Add a class to the body to trigger print-specific styles
    document.body.classList.add('printing');
    
    // Print the page
    window.print();
    
    // Remove the class after printing
    setTimeout(() => {
      document.body.classList.remove('printing');
    }, 500);
  };

  return (
    <div className="result-page">
      {/* Loading video */}
      <div className={`video-container ${fadeOut ? 'fade-out' : ''} ${videoEnded ? 'hidden' : ''}`}>
        <video 
          ref={videoRef}
          src="/newspaper-rolling.mp4"
          autoPlay
          muted
          playsInline
          className="newspaper-video"
        />
        <div className="loading-text">Generating your article...</div>
      </div>

      {/* Article content */}
      <div className={`article-container ${showArticle ? 'slide-in' : 'hidden'}`}>
        {/* View count overlay */}
        {showViewCount && (
          <div className="view-count-overlay">
            <div className="view-count-container">
              <div className="view-icon">
                <i className="fas fa-eye"></i>
              </div>
              <div className="view-counter">
                <div className="counter-digits">
                  {[0, 1, 2, 3, 4].map((position) => {
                    const isRevealed = revealedDigits[position] !== -1;
                    const displayDigit = isRevealed ? revealedDigits[position] : 0;
                    const digitClass = isRevealed ? "digit revealed" : "digit rolling";
                    
                    return (
                      <div key={position} className="digit-slot">
                        <div className={digitClass} data-position={position}>
                          {displayDigit}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="view-label">VIEWS</div>
              </div>
            </div>
            
            {/* Hashtags */}
            {showHashtags && (
              <div className="hashtags-container">
                {hashtags.map((tag, index) => (
                  <span key={index} className="hashtag">{tag}</span>
                ))}
              </div>
            )}
            
            {/* Print button */}
            {showHashtags && (
              <button className="print-button" onClick={handlePrint}>
                Print to see your full article
              </button>
            )}
          </div>
        )}
        
        {/* Newspaper */}
        <div className="newspaper">
          <div className="newspaper-header">
            <h1>Global Daily Courier</h1>
            <div className="date-line">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              }).toUpperCase()}
            </div>
          </div>
          
          <div className="headline">
            {gameState.headline || "Breaking News Headline"}
          </div>
          
          <div className="byline">
            Reported By: {gameState.player_name || "Anonymous Reporter"} 
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
                        src={`/images/evidence/${evidenceImages[0]}`} 
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
                  {article.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                
                {/* Additional content and images */}
                <div className="secondary-content">
                  {evidenceImages.slice(1).map((image, index) => (
                    <div key={index}>
                      <div className="evidence-inline">
                        <img 
                          src={`/images/evidence/${image}`} 
                          alt={`Evidence ${index + 2}`}
                          className="evidence-img"
                          onError={(e) => {
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.classList.add('no-image');
                            }
                          }}
                        />
                      </div>
                      <div className="evidence-caption">
                        Evidence Photo {index + 2}: Discovered at the scene
                      </div>
                    </div>
                  ))}
                  
                  {/* Add some filler text if there aren't many evidence images */}
                  {evidenceImages.length <= 2 && (
                    <div className="secondary-text">
                      <p>The investigation continues as authorities gather more evidence and interview witnesses. Local residents have expressed shock and concern over the incident at the prestigious art academy.</p>
                      <p>Campus security has been increased, and counseling services are being provided to students and faculty affected by the tragedy.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Additional stories section */}
          <div className="additional-stories">
            <div className="story-box">
              <div className="mini-headline">Level Up: GDC Invades the City!</div>
              <div className="mini-content">
                Gamers and developers unite! The city is buzzing as the Game Developer Conference rolls into town, transforming every pixel and polygon into a playground of possibility. From indie to AAA, our streets are now live levels waiting to be explored. Don't blink—you might just miss a secret side quest!
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
      </div>
    </div>
  );
} 