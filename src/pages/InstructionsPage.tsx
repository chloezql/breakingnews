import React from 'react';
import './InstructionsPage.scss';

export interface InstructionsPageProps {
  onBackToGame: () => void;
}

export const InstructionsPage: React.FC<InstructionsPageProps> = ({ onBackToGame }) => {
  return (
    <div data-component="InstructionsPage">
      <div className="content-top">
        <div className="content-title">
          <img src="./volley-logo-black.png" width="24" height="24" />
          <span>yes sire</span>
          <span className="separator">|</span>
          <a href="#" onClick={(e) => { e.preventDefault(); onBackToGame(); }} className="game-sheet-link">back to game</a>
        </div>
      </div>
      
      <div className="instructions-page">
        <h1>DUSKHOLLOW PRIORY</h1>
        
        <h2>SETTING</h2>
        <p>A century ago, when the moon hung blood-red in the sky, the monks of Duskhollow Priory performed their final ritual to seal the Ashen Crown of Malakar and themselves within.
        <br />
        Perhaps you'll find the Ashen Crown and uncover the truth that lies within these haunted halls—or perhaps you'll join the whispers that drift through its shadowed corridors.</p>

        <h2>CHARACTER CREATION</h2>
        <p>You can choose your character's attributes, or ask the DM to randomly assign them.</p>
        
        <div className="character-choices">
          <div className="choice-column">
            <h3>1. Choose your DESCRIPTOR:</h3>
            <ul>
              <li>Seasoned</li>
              <li>Untested</li>
              <li>Mysterious</li>
              <li>Cursed</li>
              <li>Noble</li>
              <li>Outcast</li>
            </ul>
          </div>

          <div className="choice-column">
            <h3>2. Choose your ROLE:</h3>
            <ul>
              <li>Warrior</li>
              <li>Mage</li>
              <li>Rogue</li>
              <li>Cleric</li>
              <li>Ranger</li>
              <li>Bard</li>
            </ul>
          </div>
        </div>

        <h2>STATS</h2>
        <p>You have two stats:</p>
        <ul>
          <li><strong>WIT</strong> (starts at 3): Mental challenges, magic, perception, cunning</li>
          <li><strong>BRAWN</strong> (starts at 3): Physical challenges, combat, endurance, strength</li>
        </ul>

        <p>Each ranges from 1-6</p>
        <ul>
          <li>1: Critically weakened/corrupted</li>
          <li>6: Masterful command</li>
        </ul>

        <h2>ACTIONS</h2>
        <p>When attempting an action, roll 1d6:</p>
        <ul>
          <li>If using WIT: Success on roll ≤ current WIT</li>
          <li>If using BRAWN: Success on roll ≤ current BRAWN</li>
        </ul>

        <p>Common Actions:</p>
        <ul>
          <li>Investigate (WIT)</li>
          <li>Fight (BRAWN)</li>
          <li>Cast Ritual (WIT)</li>
          <li>Climb/Jump (BRAWN)</li>
          <li>Decode Symbols (WIT)</li>
          <li>Break Through (BRAWN)</li>
        </ul>

        <h2>CHANGING STATS</h2>
        <p>Your stats change based on your successes and failures:</p>
        <ul>
          <li>On SUCCESS: The used stat increases by 1</li>
          <li>On FAILURE: The used stat decreases by 1</li>
          <li>On PERFECT MATCH (roll equals stat): Gain supernatural insight</li>
        </ul>

        <p>Corruption Rules:</p>
        <ul>
          <li>If WIT reaches 1: Your mind breaks from forbidden knowledge</li>
          <li>If BRAWN reaches 1: The shadows begin consuming your form</li>
          <li>Shhh... This is a well-known secret:You can try to save yourself from corruption by praying to St. Dustfeather Hollobone, the patron saint of the Duskhollow Priory</li>
          <li>If either stat reaches 6: You master that aspect but risk corruption</li>
        </ul>

        <h2>THE END</h2>
        <p>The game ends when:</p>
        <ul>
          <li>You uncover the Priory's final secret (complete objectives)</li>
          <li>You succumb to corruption (either stat reaches 1)</li>
          <li>You flee the Priory (voluntary exit)</li>
        </ul>
      </div>
    </div>
  );
}; 