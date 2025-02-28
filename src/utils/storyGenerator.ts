import OpenAI from 'openai';
import { GameState } from '../types/GameTypes';
import { AVAILABLE_SUSPECTS } from '../constants/evidence';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generateStory(gameState: GameState): Promise<string> {
  const selectedSuspect = AVAILABLE_SUSPECTS.find(s => s.id === gameState.selectedSuspect);
  const suspectInterviews = selectedSuspect ? 
    gameState.suspectInterviews[selectedSuspect.id] : null;

  const prompt = `You are a skilled newspaper journalist writing a breaking news story. 
  Write a concise news article based on the following information:

  Headline: ${gameState.headline}
  Reporter's Angle: ${gameState.storyText}

  Key Evidence:
  ${gameState.selectedEvidence.map(evidence => 
    `${evidence.name}: ${evidence.description}`
  ).join('\n')}

  Witness Testimonies:
  ${gameState.selectedWitnesses.map(witness =>
    `Name: ${witness.name}
    Identity: ${witness.identity}
    Description: ${witness.description}`
  ).join('\n')}

  ${selectedSuspect ? `
  Prime Suspect Interview:
  Name: ${selectedSuspect.name}
  Role: ${selectedSuspect.role}
  Interview Excerpt:
  ${suspectInterviews?.questions.map((q, i) => 
    `Q: ${q}\nA: ${suspectInterviews.answers[i]}`
  ).join('\n')}
  ` : ''}

  Write the story in a journalistic style with:
  - A strong opening paragraph that hooks the reader
  - Integration of key evidence, witness quotes, and suspect responses
  - Professional and objective tone
  - STRICT LIMIT OF 300 WORDS
  - 3-4 short paragraphs for readability
  - Focus on the most impactful details
  - Don't print headline, just the content of the story
  - You are trying to make the story to attract more readers, go viral or get more clicks
  - The story should maintain journalistic integrity while highlighting the chosen angle.
  Remember: Keep it under 200 words total.`;

  try {
    console.log('Generating story with prompt:', prompt);
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating story:', error);
    return 'Error generating story. Please try again.';
  }
} 