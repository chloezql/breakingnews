import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { EVIDENCE_ITEMS } from '../constants/evidence';
import { witnessTapes } from '../types/tapes';
import { getSuspect } from '../types/suspects';
import { getRandomJoke } from '../constants/jokes';
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
  const [dailyJoke, setDailyJoke] = useState({ setup: '', punchline: '' });
  const generationAttempted = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const articleReadyRef = useRef(false);
  const videoEndedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Add refs to store the latest values for view count and hashtags
  const viewCountRef = useRef<number>(0);
  const hashtagsRef = useRef<string[]>([]);

  // Log the full game state for debugging
  useEffect(() => {
    console.log('ResultPage - Full Game State:', JSON.stringify(gameState, null, 2));
    
    // Set a random joke when the component mounts
    setDailyJoke(getRandomJoke());
  }, []);

  // Generate the news story when the component mounts
  useEffect(() => {
    // Only generate if we haven't already attempted generation
    if (!generationAttempted.current) {
      console.log('Generating news story - first attempt');
      generationAttempted.current = true;
      generateNewsStory();
    }

    // Set a safety timeout to show the article if generation takes too long
    const safetyTimeout = setTimeout(() => {
      if (!showArticle) {
        console.log('Safety timeout triggered - showing article regardless of state');
        if (videoRef.current && !videoEndedRef.current) {
          videoRef.current.pause();
        }
        proceedToShowArticle();
      }
    }, 30000); // 30 seconds max wait time

    timeoutRef.current = safetyTimeout;
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Watch for article ready state
  useEffect(() => {
    if (isStoryReady && !articleReadyRef.current) {
      console.log('Article generation completed - videoEnded:', videoEndedRef.current);
      console.log('Final view count after generation:', finalViewCount);
      console.log('Hashtags after generation:', hashtags);
      
      // Update the refs with current values
      viewCountRef.current = finalViewCount;
      hashtagsRef.current = hashtags;
      
      // Ensure we have valid values before proceeding
      if (finalViewCount <= 0) {
        const defaultCount = Math.floor(Math.random() * 90000) + 10000;
        console.log('No valid view count found before showing article, using default:', defaultCount);
        setFinalViewCount(defaultCount);
        setViewCount(defaultCount);
        viewCountRef.current = defaultCount;
      }
      
      if (!hashtags.length) {
        const defaultHashtags = ['#BreakingNews', '#AstraAcademy', '#Investigation', '#ArtWorld', '#Justice'];
        console.log('No hashtags found before showing article, using defaults:', defaultHashtags);
        setHashtags(defaultHashtags);
        hashtagsRef.current = defaultHashtags;
      }
      
      articleReadyRef.current = true;
      
      if (videoEndedRef.current) {
        // If video has already ended, proceed to show article
        proceedToShowArticle();
      } else if (videoRef.current) {
        // If video is still playing but we've been waiting a while, skip to end
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        
        if (duration - currentTime > 2) { // If more than 2 seconds left
          console.log('Article ready but video still playing - skipping to end');
          // Skip to near the end of the video
          videoRef.current.currentTime = Math.max(duration - 0.5, 0);
        }
      }
    }
  }, [isStoryReady, finalViewCount, hashtags]);

  // Function to proceed to showing the article
  const proceedToShowArticle = () => {
    console.log('Proceeding to show article - videoEnded:', videoEndedRef.current, 'articleReady:', articleReadyRef.current);
    
    // Get the latest values from refs
    const currentViewCount = viewCountRef.current;
    const currentHashtags = [...hashtagsRef.current];
    
    console.log('Current view count value:', currentViewCount, 'Hashtags:', currentHashtags);
    
    // Double-check we have a valid view count
    let viewCountToUse = currentViewCount;
    if (currentViewCount <= 0) {
      viewCountToUse = Math.floor(Math.random() * 90000) + 10000;
      console.log('No valid view count found at show time, using default:', viewCountToUse);
      setFinalViewCount(viewCountToUse);
      setViewCount(viewCountToUse);
      viewCountRef.current = viewCountToUse;
    }
    
    // Double-check we have hashtags
    let hashtagsToUse = currentHashtags;
    if (!currentHashtags.length) {
      hashtagsToUse = ['#BreakingNews', '#AstraAcademy', '#Investigation', '#ArtWorld', '#Justice'];
      console.log('No hashtags found at show time, using defaults:', hashtagsToUse);
      setHashtags(hashtagsToUse);
      hashtagsRef.current = hashtagsToUse;
    }
    
    setVideoEnded(true);
    setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setShowArticle(true);
        console.log('Article is now visible, preparing to show view count animation');
        
        // After article is shown and centered for 2 seconds, show view count
        setTimeout(() => {
          // Use the stored value to ensure consistency
          console.log('Starting view count animation with value:', viewCountToUse);
          
          setShowViewCount(true);
          // Initialize with all digits hidden
          setRevealedDigits([-1, -1, -1, -1, -1]);
          
          // Reveal digits one by one with delays
          const digits = viewCountToUse.toString().padStart(5, '0').split('').map(Number);
          console.log('Revealing view count digits:', digits, 'from viewCountToUse:', viewCountToUse);
          
          // Schedule the digit reveals
          const revealDigit = (position: number, value: number, delay: number) => {
            setTimeout(() => {
              console.log(`Revealing digit at position ${position}: ${value}`);
              setRevealedDigits(prev => {
                const newDigits = [...prev];
                newDigits[position] = value;
                return newDigits;
              });
              
              // After all digits are revealed, show hashtags
              if (position === 0) {
                setTimeout(() => {
                  console.log('All digits revealed, showing hashtags');
                  setShowHashtags(true);
                  playConfetti();
                }, 1000);
              }
            }, delay);
          };
          
          // Reveal digits from right to left
          revealDigit(4, digits[4], 300);  // Last digit
          revealDigit(3, digits[3], 600);  // 4th digit
          revealDigit(2, digits[2], 900);  // 3rd digit
          revealDigit(1, digits[1], 1200); // 2nd digit
          revealDigit(0, digits[0], 1500); // 1st digit
          
        }, 2000);
      }, 500);
    }, 500);
  };

  // Handle video playback and animations
  useEffect(() => {
    if (videoRef.current) {
      // When the video ends, fade it out and show the article
      const handleVideoEnd = () => {
        console.log('Video playback ended - isStoryReady:', isStoryReady, 'articleReadyRef:', articleReadyRef.current);
        videoEndedRef.current = true;
        
        if (articleReadyRef.current) {
          // If article is already ready, proceed to show it
          proceedToShowArticle();
        } else {
          // If article is not ready yet, set videoEnded flag and wait
          setVideoEnded(true);
          console.log('Video ended but article not ready yet - waiting for article generation');
        }
      };

      videoRef.current.addEventListener('ended', handleVideoEnd);
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('ended', handleVideoEnd);
        }
      };
    }
  }, [videoRef]);

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
      // Prepare all the data needed for generation
      const articleData = prepareArticleData();
      const prompt = createArticlePrompt(articleData);
      console.log('Article generation prompt created');
      
      let generatedStory = '';
      let generatedHashtags: string[] = [];
      let generatedViewCount = 0;
      
      // Try to generate with OpenAI if API key is available
      if (process.env.REACT_APP_OPENAI_API_KEY) {
        try {
          console.log('Generating story with OpenAI...');
          generatedStory = await generateStoryWithOpenAI(prompt);
          console.log('Story generated successfully, length:', generatedStory.length);
          
          // Generate hashtags and view count
          generatedHashtags = await generateHashtags(generatedStory);
          generatedViewCount = await generateViewCount(generatedStory);
          
          console.log('Generation complete with values:', {
            storyLength: generatedStory.length,
            hashtags: generatedHashtags,
            viewCount: generatedViewCount
          });
        } catch (apiError) {
          console.error('OpenAI API error:', apiError);
          // Fall back to default generation
          const fallback = generateFallbackStory(articleData);
          generatedStory = fallback.story;
          generatedHashtags = fallback.hashtags;
          generatedViewCount = fallback.viewCount;
        }
      } else {
        // No API key available, use fallback
        console.log('No OpenAI API key found, using fallback story generation');
        const fallback = generateFallbackStory(articleData);
        generatedStory = fallback.story;
        generatedHashtags = fallback.hashtags;
        generatedViewCount = fallback.viewCount;
      }
      
      // Update state with generated content
      setArticle(generatedStory);
      setHashtags(generatedHashtags);
      hashtagsRef.current = generatedHashtags; // Update the hashtags ref
      setViewCount(generatedViewCount);
      setFinalViewCount(generatedViewCount);
      viewCountRef.current = generatedViewCount; // Update the view count ref
      updateGameState({ full_article_generated: generatedStory });
      
      // Update player results in the database
      try {
        await updatePlayerResults(gameState.id, {
          view_count: generatedViewCount,
          hashtags: generatedHashtags,
          full_article_generated: generatedStory,
          headline: gameState.headline,
          player_name: gameState.player_name,
        });
        console.log('Successfully updated player results with view count:', generatedViewCount);
      } catch (updateError) {
        console.error('Error updating player results:', updateError);
      }
      
      // Get evidence images
      getSelectedEvidenceImages();
      
    } catch (error) {
      console.error('Unexpected error in story generation:', error);
      
      // Use error fallback values
      const errorHashtags = ['#BreakingNews', '#AstraAcademy', '#Investigation', '#ArtWorld', '#Justice'];
      const errorViewCount = Math.floor(Math.random() * 90000) + 10000;
      const errorStory = createErrorStory();
      
      // Update state with fallback values
      setArticle(errorStory);
      setHashtags(errorHashtags);
      hashtagsRef.current = errorHashtags; // Update the hashtags ref
      setViewCount(errorViewCount);
      setFinalViewCount(errorViewCount);
      viewCountRef.current = errorViewCount; // Update the view count ref
      updateGameState({ full_article_generated: errorStory });
      
      console.log('Using error fallback values:', {
        viewCount: errorViewCount,
        hashtags: errorHashtags,
        storyLength: errorStory.length
      });
      
      // Try to update player results with error fallback values
      try {
        await updatePlayerResults(gameState.id, {
          view_count: errorViewCount,
          hashtags: errorHashtags,
          full_article_generated: errorStory,
          headline: gameState.headline,
          player_name: gameState.player_name,
        });
      } catch (updateError) {
        console.error('Error updating player results with error fallback values:', updateError);
      }
      
      // Get evidence images
      getSelectedEvidenceImages();
    } finally {
      // Update state to indicate story is ready
      setIsGenerating(false);
      setIsStoryReady(true);
      console.log('Article generation complete or failed. isGenerating:', false, 'isStoryReady:', true);
    }
  };

  // Helper function to prepare article data
  const prepareArticleData = () => {
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

    // Get witness quotes text
    const witnessQuotes = gameState.article_witness_quotes || [];
    const witnessQuotesText = witnessQuotes.length > 0 
      ? witnessQuotes.map(quote => `"${quote}"`).join('\n')
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
      
    return {
      headline: gameState.headline || "Breaking News",
      playerName: gameState.player_name || "Anonymous Reporter",
      deathCause: gameState.article_death_cause || "Unknown",
      method: gameState.article_method || "Unknown",
      motive: gameState.article_motive || "Unknown",
      evidenceDetails,
      witnessQuotesText,
      suspectDetails,
      interrogationText,
      style: gameState.article_style || "",
      suspectIds
    };
  };

  // Helper function to create article prompt
  const createArticlePrompt = (data: any) => {
    return `You are a skilled newspaper journalist writing a breaking news story for a major publication.
      
    # ARTICLE DETAILS
    Headline: "${data.headline}"
    Reporter: ${data.playerName}
    Death Cause: ${data.deathCause}
    Method: ${data.method}
    Motive: ${data.motive}
    
    # EVIDENCE
    ${data.evidenceDetails ? `${data.evidenceDetails}` : 'No specific evidence provided.'}
    
    # WITNESS STATEMENTS
    ${data.witnessQuotesText ? `${data.witnessQuotesText}` : 'No witness statements provided.'}
    
    # SUSPECT INFORMATION
    ${data.suspectDetails ? `${data.suspectDetails}` : 'No suspect information provided.'}
    
    # INTERROGATION FINDINGS
    ${data.interrogationText ? `${data.interrogationText}` : 'No interrogation findings provided.'}
    
    # WRITING GUIDELINES
    - Your article style should build around the following keywords: ${data.style}
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
  };

  // Helper function to generate story with OpenAI
  const generateStoryWithOpenAI = async (prompt: string) => {
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
    
    return generatedStory;
  };

  // Helper function to generate fallback story
  const generateFallbackStory = (data: any) => {
    const fallbackStory = `In a shocking development today at Astra Academy of Art, ${data.deathCause || "a tragic incident occurred"}.
    
    Local authorities have confirmed the incident and are investigating further. "We are taking this matter very seriously," said Police Chief Johnson.
    
    ${data.witnessQuotesText ? `One witness stated, ${data.witnessQuotesText.split('\n')[0]}` : 'Witnesses at the scene described the events as "unprecedented" and "alarming."'} Community members are advised to stay informed as this story develops.
    
    ${data.suspectIds.length > 0 
      ? `Authorities are currently questioning ${
          (() => {
            const suspectId = data.suspectIds[0];
            const suspect = getSuspect(suspectId);
            return suspect?.name || 'a person of interest';
          })()
        } in connection with the case.` 
      : 'This is a developing story, and more details will be provided as they become available.'}`;
    
    const fallbackHashtags = ['#BreakingNews', '#AstraAcademy', '#Investigation', '#ArtWorld', '#Justice'];
    const fallbackViewCount = Math.floor(Math.random() * 90000) + 10000;
    
    console.log('Generated fallback story with values:', {
      storyLength: fallbackStory.length,
      hashtags: fallbackHashtags,
      viewCount: fallbackViewCount
    });
    
    // Update the refs directly here as well for extra safety
    hashtagsRef.current = fallbackHashtags;
    viewCountRef.current = fallbackViewCount;
    
    return {
      story: fallbackStory,
      hashtags: fallbackHashtags,
      viewCount: fallbackViewCount
    };
  };

  // Helper function to create error story
  const createErrorStory = () => {
    return `In a shocking development today at Astra Academy of Art, a student was found dead under mysterious circumstances.
    
    Local authorities have confirmed the incident and are investigating further. "We are taking this matter very seriously," said Police Chief Johnson.
    
    Witnesses at the scene described the events as "unprecedented" and "alarming." Community members are advised to stay informed as this story develops.
    
    This is a developing story, and more details will be provided as they become available.`;
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
      
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: hashtagPrompt }],
        model: "gpt-3.5-turbo",
        temperature: 0.8,
        max_tokens: 150,
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
          const finalHashtags = parsedResponse.slice(0, 5); // Limit to 5 hashtags
          setHashtags(finalHashtags);
          hashtagsRef.current = finalHashtags; // Update the ref
          return finalHashtags;
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
            const finalHashtags = hashtagArray.slice(0, 5); // Limit to 5 hashtags
            setHashtags(finalHashtags);
            hashtagsRef.current = finalHashtags; // Update the ref
            return finalHashtags;
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
          const finalHashtags = extractedHashtags.slice(0, 5); // Limit to 5 hashtags
          setHashtags(finalHashtags);
          hashtagsRef.current = finalHashtags; // Update the ref
          return finalHashtags;
        } else {
          console.log('No hashtags found in text');
        }
        
        // Last resort: manually create hashtags from the article
        console.log('Creating fallback hashtags based on article content...');
        const fallbackHashtags = createFallbackHashtags(articleText);
        setHashtags(fallbackHashtags);
        hashtagsRef.current = fallbackHashtags; // Update the ref
        return fallbackHashtags;
      }
    } catch (error) {
      console.error('Error generating hashtags:', error);
      // Fallback hashtags
      const defaultHashtags = ['#BreakingNews', '#AstraAcademy', '#Investigation', '#ArtWorld', '#Justice'];
      setHashtags(defaultHashtags);
      hashtagsRef.current = defaultHashtags; // Update the ref
      return defaultHashtags;
    }
    
    // If we somehow get here without returning, use default hashtags
    const defaultHashtags = ['#BreakingNews', '#AstraAcademy', '#Investigation', '#ArtWorld', '#Justice'];
    setHashtags(defaultHashtags);
    hashtagsRef.current = defaultHashtags; // Update the ref
    return defaultHashtags;
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
        console.log('Found 5-digit view count:', count);
        setFinalViewCount(count);
        setViewCount(count); // Also set viewCount for backward compatibility
        viewCountRef.current = count; // Update the ref
        return count;
      }
      
      // If no 5-digit number, try to extract any number
      const anyNumberMatch = responseText.match(/\b\d+\b/);
      if (anyNumberMatch) {
        const num = parseInt(anyNumberMatch[0], 10);
        // Ensure it's a 5-digit number
        let finalCount = num;
        if (num < 10000) {
          finalCount = num + 10000; // Make it at least 5 digits
        } else if (num > 99999) {
          finalCount = Math.floor(num % 100000); // Take last 5 digits
          if (finalCount < 10000) finalCount += 10000; // Ensure it's 5 digits
        }
        console.log('Adjusted view count to 5 digits:', finalCount, 'from original:', num);
        setFinalViewCount(finalCount);
        setViewCount(finalCount); // Also set viewCount for backward compatibility
        viewCountRef.current = finalCount; // Update the ref
        return finalCount;
      }
      
      // If no number found, generate a random one
      const randomCount = Math.floor(Math.random() * 90000) + 10000;
      console.log('Using random view count:', randomCount);
      setFinalViewCount(randomCount);
      setViewCount(randomCount); // Also set viewCount for backward compatibility
      viewCountRef.current = randomCount; // Update the ref
      return randomCount;
      
    } catch (error) {
      console.error('Error generating view count:', error);
      // Fallback view count
      const fallbackCount = Math.floor(Math.random() * 90000) + 10000;
      console.log('Using fallback view count due to error:', fallbackCount);
      setFinalViewCount(fallbackCount);
      setViewCount(fallbackCount); // Also set viewCount for backward compatibility
      viewCountRef.current = fallbackCount; // Update the ref
      return fallbackCount;
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
        <div className={`newspaper ${showViewCount ? 'blur-background' : ''}`}>
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
              <div className="main-column">
                {/* Main image (first evidence image) */}
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
                
                {/* First paragraph */}
                {article.split('\n\n')[0] && (
                  <p>{article.split('\n\n')[0]}</p>
                )}
                
                {/* Second evidence image */}
                {evidenceImages.length > 1 && (
                  <div className="evidence-inline">
                    <img 
                      src={`/images/evidence/${evidenceImages[1]}`} 
                      alt="Evidence 2" 
                      className="evidence-img"
                      onError={(e) => {
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.classList.add('no-image');
                        }
                      }}
                    />
                  </div>
                )}
                
                {/* Middle paragraphs */}
                {article.split('\n\n').slice(1, -1).map((paragraph, index) => (
                  <p key={index + 1}>{paragraph}</p>
                ))}
                
                {/* Third evidence image */}
                {evidenceImages.length > 2 && (
                  <div className="evidence-inline">
                    <img 
                      src={`/images/evidence/${evidenceImages[2]}`} 
                      alt="Evidence 3" 
                      className="evidence-img"
                      onError={(e) => {
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.classList.add('no-image');
                        }
                      }}
                    />
                  </div>
                )}
                
                {/* Last paragraph */}
                {article.split('\n\n').length > 1 && (
                  <p>{article.split('\n\n')[article.split('\n\n').length - 1]}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Additional stories section */}
          <div className="additional-stories">
            <div className="story-box news-story">
              <div className="mini-headline">Level Up: GDC Invades the City!</div>
              <div className="mini-content">
                Gamers and developers unite! The city is buzzing as the Game Developer Conference rolls into town, transforming every pixel and polygon into a playground of possibility. From indie to AAA, our streets are now live levels waiting to be explored. Don't blink—you might just miss a secret side quest!
              </div>
            </div>
            
            <div className="story-box daily-joke">
              <div className="mini-headline">Daily Joke</div>
              <div className="mini-content">
                <p><strong>{dailyJoke.setup}</strong></p>
                <p>{dailyJoke.punchline}</p>
              </div>
            </div>
            
            <div className="story-box qr-section">
              <div className="mini-headline">Scan for Leaderboard</div>
              <div className="price-comparison">
                <div className="price-item">
                  <span className="price">Track your story's performance</span>
                </div>
                <div className="price-item">
                  <img src="/website-qr.png" alt="Leaderboard QR Code" className="qr-code" style={{ width: '100px', height: '100px', marginTop: '10px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 