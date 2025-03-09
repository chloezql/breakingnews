import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { resetGameState } from '../services/gameState';
import { truth } from '../types/truth';
import './RatingPage.scss';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface Scores {
  viral: number;
  truth: number;
  creativity: number;
  overall: number;
  feedback: string;
}

export function RatingPage() {
  const { gameState, updateGameState } = useGame();
  const [scores, setScores] = useState<Scores | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [ratingAttempted, setRatingAttempted] = useState(false);

  useEffect(() => {
    // Only proceed if we haven't attempted to get ratings yet
    if (ratingAttempted) {
      return;
    }

    let isMounted = true; // Track if component is mounted

    // Always generate new ratings
    getRating();
    if (isMounted) {
      setRatingAttempted(true); // Mark that we've attempted to get ratings
    }

    // Cleanup function
    return () => {
      isMounted = false; // Mark component as unmounted
    };
  }, [ratingAttempted]); // Only depend on ratingAttempted

  // Submit score to Xano when ratings are available
  useEffect(() => {
    const submitScore = async () => {
      if (scores && gameState.id && !scoreSubmitted) {
        try {
          // Calculate average score from all ratings
          const averageScore = Math.round(
            (scores.viral + scores.truth + scores.creativity) / 3
          );
          
          console.log(`Score calculated: ${averageScore} for player ${gameState.id}`);
          
          // We're not actually submitting the score to Xano in this version
          // Just mark it as submitted for the UI
          setScoreSubmitted(true);
        } catch (error) {
          console.error('Error handling score:', error);
        }
      }
    };
    
    submitScore();
  }, [scores, gameState.id, scoreSubmitted]);

  // Generate ratings based on the story using OpenAI
  const getRating = async () => {
    // Prevent multiple executions only if already loading
    if (loading || ratingAttempted) {
      console.log('Rating already in progress, skipping');
      return;
    }
    
    setLoading(true);
    console.log('Getting ratings - this should only happen once');
    
    try {
      if (!gameState.full_article_generated || !gameState.headline || !gameState.story_angle) {
        throw new Error("Missing story content");
      }

      // If OpenAI API key is available, use it to generate ratings
      if (process.env.REACT_APP_OPENAI_API_KEY) {
        console.log('Generating ratings with OpenAI...');
        console.log(gameState.full_article_generated);
        
        const storyContent = `
          Headline: ${gameState.headline}
          Angle: ${gameState.story_angle}
          Article: ${gameState.full_article_generated}
        `;
        
        const truthContent = truth.content;
        console.log(truthContent);

        
        const prompt = `
          You are an expert news editor evaluating a reporter's story. 
          Please evaluate the following news story on a scale of 40-100 for these criteria:
          
          1. Viral Potential: How likely is this story to be shared widely? Consider catchiness, emotional impact, and relevance.
          2. Truth Factor: How closely does this align with the actual facts of the case? Compare with the truth provided below. It doesn't have to be 100% accurate, but you should see if their suspected killer and death cause are close to the truth. If they got the killer wrong but the main plot correct, that's still a good score. A good score is 70% or higher.
          3. Creativity: How original and engaging is the storytelling? Consider writing style, angle, and presentation.
          4. Overall Score: A holistic assessment of the story's quality.
          
          Also provide brief, constructive feedback (max 100 words) on the story's strengths and areas for improvement. DO NOT reveal the actual truth in your feedback - only evaluate how close the story is to it.
          
          REPORTER'S STORY:
          ${storyContent}
          
          THE ACTUAL TRUTH (for comparison only, DO NOT reveal this in feedback):
          ${truthContent}
          
          IMPORTANT: Format your response ONLY as a valid JSON object with these exact fields:
          {
            "viral": [number between 1-100],
            "truth": [number between 1-100],
            "creativity": [number between 1-100],
            "overall": [number between 1-100],
            "feedback": [string with feedback]
          }
          
          DO NOT include any text outside of the JSON object. Your entire response must be parseable as JSON.
        `;
        
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-3.5-turbo",
          temperature: 0.7,
        });

        const responseText = completion.choices[0].message.content || '';
        console.log('OpenAI response:', responseText);
        
        try {
          // Try to extract JSON from the response text
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : responseText;
          const newScores = JSON.parse(jsonString) as Scores;
          
          // Ensure all scores are within 1-100 range
          const validateScore = (score: number) => Math.min(100, Math.max(1, Math.round(score)));
          
          const validatedScores: Scores = {
            viral: validateScore(newScores.viral),
            truth: validateScore(newScores.truth),
            creativity: validateScore(newScores.creativity),
            overall: validateScore(newScores.overall),
            feedback: newScores.feedback || generateFallbackFeedback()
          };
          
          setScores(validatedScores);
          updateGameState({ ratings: validatedScores });
          
          // Trigger animations after a short delay
          setTimeout(() => setShowScores(true), 500);
          setTimeout(() => setShowFeedback(true), 1000);
        } catch (parseError) {
          console.error('Error parsing OpenAI response:', parseError);
          // Fall back to random scores
          fallbackToRandomScores();
        }
      } else {
        // Fallback if no API key is available
        console.log('No OpenAI API key found, using fallback score generation');
        fallbackToRandomScores();
      }
    } catch (error) {
      console.error('Error generating ratings:', error);
      fallbackToRandomScores();
    } finally {
      setLoading(false);
    }
  };

  // Fallback to random scores if API call fails
  const fallbackToRandomScores = () => {
    // Generate random scores between 60-95
    const getRandomScore = () => Math.floor(Math.random() * 36) + 60;
    
    const newScores: Scores = {
      viral: getRandomScore(),
      truth: getRandomScore(),
      creativity: getRandomScore(),
      overall: getRandomScore(),
      feedback: generateFallbackFeedback()
    };
    
    setScores(newScores);
    updateGameState({ ratings: newScores });
    
    // Trigger animations after a short delay
    setTimeout(() => setShowScores(true), 500);
    setTimeout(() => setShowFeedback(true), 1000);
  };

  // Generate fallback feedback if API call fails
  const generateFallbackFeedback = (): string => {
    const feedbackOptions = [
      "Your story has strong potential for virality due to its timely nature and emotional impact. The headline is attention-grabbing, though it could be more concise. Your reporting style is clear and engaging, making complex information accessible to readers. Consider adding more specific details in future stories to enhance credibility.",
      "Excellent work on creating a compelling narrative! Your story balances factual reporting with human interest elements effectively. The headline immediately draws readers in, and your writing style maintains engagement throughout. For future stories, consider incorporating more diverse perspectives.",
      "Your reporting demonstrates good journalistic instincts. The story has a clear angle and presents information in a logical sequence. The headline effectively communicates the core news value. To improve, consider strengthening your story with more specific data points and expert quotes.",
      "Your story shows promise with a strong news angle and clear writing style. The headline captures attention, though it could be more specific. Your reporting covers the essential facts but would benefit from more context and background information. Consider developing a more distinctive voice in your writing."
    ];
    
    // Return a random feedback option
    return feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
  };

  const handleStartNewGame = () => {
    const newState = resetGameState();
    window.location.reload(); // Reload the page to apply the new state
  };

  return (
    <div className="rating-page page-container">
      <h1>Your Story Performance</h1>
      
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Analyzing your story...</p>
        </div>
      ) : (
        <>
          <div className="scores-container">
            {scores && (
              <>
                <div className={`score-card ${showScores ? 'show' : ''}`}>
                  <h2>Viral Potential</h2>
                  <div className="score-circle">
                    <svg className="circular-chart" viewBox="0 0 36 36">
                      <path
                        className="circle-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#eee"
                        strokeWidth="2"
                      />
                      <path
                        className="score-value"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#ff6b6b"
                        strokeWidth="2"
                        strokeDasharray={`${scores.viral}, 100`}
                      />
                    </svg>
                    <div className="percentage">{scores.viral}%</div>
                  </div>
                </div>
                
                <div className={`score-card ${showScores ? 'show' : ''}`}>
                  <h2>Truth Factor</h2>
                  <div className="score-circle">
                    <svg className="circular-chart" viewBox="0 0 36 36">
                      <path
                        className="circle-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#eee"
                        strokeWidth="2"
                      />
                      <path
                        className="score-value"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#4ecdc4"
                        strokeWidth="2"
                        strokeDasharray={`${scores.truth}, 100`}
                      />
                    </svg>
                    <div className="percentage">{scores.truth}%</div>
                  </div>
                </div>
                
                <div className={`score-card ${showScores ? 'show' : ''}`}>
                  <h2>Creativity</h2>
                  <div className="score-circle">
                    <svg className="circular-chart" viewBox="0 0 36 36">
                      <path
                        className="circle-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#eee"
                        strokeWidth="2"
                      />
                      <path
                        className="score-value"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#ffd166"
                        strokeWidth="2"
                        strokeDasharray={`${scores.creativity}, 100`}
                      />
                    </svg>
                    <div className="percentage">{scores.creativity}%</div>
                  </div>
                </div>
                
                <div className={`score-card ${showScores ? 'show' : ''}`}>
                  <h2>Overall Score</h2>
                  <div className="score-circle">
                    <svg className="circular-chart" viewBox="0 0 36 36">
                      <path
                        className="circle-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#eee"
                        strokeWidth="2"
                      />
                      <path
                        className="score-value"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#118ab2"
                        strokeWidth="2"
                        strokeDasharray={`${scores.overall}, 100`}
                      />
                    </svg>
                    <div className="percentage">{scores.overall}%</div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {scores && (
            <div className={`feedback ${showFeedback ? 'show' : ''}`}>
              <h2>Editor's Feedback</h2>
              <p>{scores.feedback}</p>
              
              {gameState.player_name && (
                <div className="player-info">
                  <p>Player: {gameState.player_name || 'Anonymous'}</p>
                  <p className="card-id">Card ID: {gameState.id_card_no || 'Unknown'}</p>
                  {scoreSubmitted && <p className="score-submitted">Score calculated!</p>}
                </div>
              )}
              
              <button 
                className="new-game-button"
                onClick={handleStartNewGame}
              >
                Start New Game
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 