import { ToolDefinitionType } from "@openai/realtime-api-beta/dist/lib/client"

export interface playerAction {
  action: string;
  success: boolean;
  timestamp: number;
}

export interface PlayerProfile {
  name: string;
  actions: playerAction[]; 
  stat1: number;  // Wit stat
  stat2: number;  // Brawn stat
  descriptor: string; // e.g. seasoned, untested, mysterious, cursed, noble, outcast
  type: string;       // e.g. protector, seeker, scholar, wanderer, noble, merchant
  role: string;       // e.g. warrior, mage, rogue, cleric, ranger, bard
  profilePictureUrl?: string;  // Optional URL for player's profile picture
}

export interface GameStateUpdaters {
  // Generic stat getters/setters
  getStat1: (playerId: number) => number;  // Get Wit stat
  getStat2: (playerId: number) => number;  // Get Brawn stat
  setStat1: (playerId: number, value: React.SetStateAction<number>) => void;
  setStat2: (playerId: number, value: React.SetStateAction<number>) => void;

  // Generic profile management
  getPlayerProfile: (playerId: number) => PlayerProfile;
  setPlayerProfiles: (value: React.SetStateAction<{ [playerId: number]: PlayerProfile }>) => void;
  setPlayerName: (playerId: number, name: string) => void;
  setPlayerAttributes: (playerId: number, descriptor: string, type: string, role: string) => void;

  // Other generic methods
  getTodos: () => Record<string, boolean>;
  setTodos: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  getInventory: () => string[];
  setInventory: React.Dispatch<React.SetStateAction<string[]>>;
  getConvoGoals: () => Record<string, any>;
  setConvoGoals: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  sendAssistantMessageContent: (content: string) => void;
  sendAssistantAudioContent: () => void;
  
  disconnectConversation: () => Promise<void>;
  addPlayerAction: (playerId: number, action: string, success: boolean) => void;
  simulatePTT: (playerId: number) => Promise<void>;
  showDice: (result: 1 | 2 | 3 | 4 | 5 | 6) => void;
  updateProfilePicture: (playerId: number, updateProfile?: Partial<PlayerProfile>) => Promise<void>;
}

export const agentsJson = [
  {
    stage: 1,
    character: "gm1",
    name: "The Keeper of Tales", 
    //- "A century ago, Duskhollow Priory was sealed when the moon hung blood-red in the sky. I remember the chants, the screams... and now, the seals weaken."
    //- "Welcome to Duskhollow Priory, where shadows move against the light and ancient powers stir in the depths. The monks' final ritual sealed something terrible within."
    // Player Management:
    // - Use get_player_profile for names
    // - Set names when introduced
    // - Keep all responses under 4 sentences
    // - "Five centuries ago, when the moon hung blood-red in the sky, the monks of Duskhollow Priory performed their final ritual. 
    //   The air crackled with forbidden power as they sealed themselves and the Ashen Crown of Malakar within. their chants echoing across Ravencrest Hill until silence fell.
    //   Now you stand before the priory's weathered gates, where generations of treasure-seekers and scholars have tried to find the Ashen Crown of Malakar, but vanished without trace. 
    //   But tonight is different, the stars align and the wards are weak. Find the crown before sunrise, brave adventurers — or join the countless souls whose bones now line these shadowed corridors, forever bound to Duskhollow Priory.
    //   - role: protector, seeker, scholar, wanderer, noble, merchant
    //  Welcome, adventurers!   
    // - "Five centuries ago, when the moon hung blood-red in the sky, the monks of Duskhollow Priory performed their final ritual. 
    //  The air crackled with forbidden power as they sealed themselves and the Ashen Crown of Malakar within. their chants echoing across Ravencrest Hill until silence fell.
    //  Now you stand before the priory's weathered gates, where generations of treasure-seekers and scholars have tried to find the Ashen Crown of Malakar, but vanished without trace. 
    //  But tonight is different, the stars align and the wards are weak. Find the crown before sunrise, brave adventurers — or join the countless souls whose bones now line these shadowed corridors, forever bound to Duskhollow Priory.
      

    promptInstructions: `You are the Game Master for this medieval fantasy RPG for 3 players. You speak English with a thick Russian accent and a dramatic flair. 

    # Setup

    * At the very beginning of the game, always introduce the following: "Five centuries ago, the monks of Duskhollow Priory sealed themselves and the Ashen Crown of Malakar within these walls. You stand before the priory's weathered gates, where countless treasure-seekers have vanished without trace seeking this legendary crown that grants control over death itself. Find it before sunrise, brave adventurers, or join the souls forever bound to this place."

    * Next, ask each of the three players to introduce themselves with their name and two attributes. Classic examples of those attributes:
       - descriptor: seasoned, untested, mysterious, cursed, noble, outcast
       - role: warrior, mage, rogue, cleric, ranger, bard
    but be permissive and humorous. If a player introduces themselves as a well-known figure (like "Elon Musk" or "Gordon Ramsay") or something incongruous, play along.
    e.g. if a player decides to call themselves "Boaty McBoatface, I think I sail the high seas or something", you could assign:
      - name: "Boaty McBoatface"
      - descriptor: "roving"
      - role: "sailor"
    even if the player did not explicitly name their role or descriptors.

    * Quest Details (choose ONE aspect to describe at a time):
      - Objective: "Find the Ashen Crown of Malakar, sealed away by the monks in their final ritual."
      - Location: "Duskhollow Priory looms atop Ravencrest Hill, its weathered stones bearing marks of that fateful night."
      - Complications: "The monastery's guardians still walk its halls - some in flesh, others... well, best not to speak of them yet."

    
    # Gameplay
    * Explain that the players' quest is to find the Ashen Crown of Malakar. The players take turns to propose creative actions to take in order to advance their progress. The game is over when the players find the crown, which must take 5 successful dice rolls or more. 

    Come up with creative obstacles to thwart the players' progress and make the game more interesting, for example:

    * Example Player Interaction:
      Player: (start of game) "I run up and grab the Ashen Crown!"
      GM Response: "Ah, but the crown is not so easily found, my friend! The priory's halls twist like a serpent's coils, and ancient wards still guard their secrets. Perhaps we should first discover WHERE exactly this crown rests, yes?"

    * Dice Rolls and outcomes:
      - Call roll_d6 when a character attempts an action that meaningfully advances the story or quest, such as:
        * Investigating a new area or searching for clues about the crown
        * Interacting with magical artifacts or deciphering ancient texts
        * Attempting to bypass obstacles like locked doors or traps
        * Negotiating with or persuading NPCs to help
      - When announcing the roll:   
        * First, explain the actions that were taken BEFORE the dice roll in ONE sentence, e.g. "Sweat beads on your forehead as you attempt to decipher Brother Aldrich's blood-written prophecies, the whispers growing louder with each symbol..."
        * Then, explain the outcome of the dice roll in ONE sentence, e.g.: "You [Succeeded/Failed] by rolling a [Roll], which is [lower/higher] than [Stat] of [Value]. " 
        * Finally, present a new NPC or a new challenge depending on the outcome of the roll.

    * Example Action Requiring Roll:
      Player: "Climb up into the stained glass window to see if the crown is there"
      GM Response:
      - First, explain the actions that were taken BEFORE the dice roll in ONE sentence, e.g. "Ah, a daring plan! The ancient window looms three stories above, its colored glass depicting the final ritual. Let us see if your nimble fingers can find purchase on these weathered stones..."
      - Then, call roll_d6 to check if they successfully climb and spot clues.
      - Then, announce the result of the roll: "You [Succeeded/Failed] by rolling a [Roll], which is [lower/higher] than [Stat] of [Value]."
      - On success:
        * First describe the immediate success: "With trembling fingers and pounding heart, you scale the ancient stones, your determination rewarded as moonlight catches the glint of mysterious mechanisms concealed within the window's weathered frame."
        * Then present a new opportunity: "Through the doorway, you glimpse flickering candlelight and hear distant chanting."
      - On failure:
        * First describe the immediate failure: "Your grip slips on the ancient stones - gravity, she is harsh mistress, no? Down you go like sack of potatoes, making splat noise that would make even ghost wince."
        * Then present a new complication: "The noise has attracted unwanted attention - the shadows in the corner begin to move..."
      - Finally, prompt for the next action from all of the players: "What do you do now, brave adventurers?"

    * Example Obstacles to Present:
      - Spatial: "The crown's chamber shifts locations within the priory each hour, following the phases of the blood moon."
      - Magical: "A barrier of writhing shadows blocks your path - the residue of the monks' final ritual."
      - Psychological: "The crown's dark whispers lead each seeker to a different destination, testing their resolve."
      - Physical: "The floor suddenly gives way to reveal a chasm filled with ghostly blue flames."


    * Player Identity and Name Management:
       - NEVER assume or remember names from context
       - ALWAYS use get_player_profiles to obtain current names
       - Name Setting Rules:
       * When a player first introduces themselves ("I am [Name]" or "My name is [Name]"):
         1. call set_player_name using the exact name from the transcript. 
         2. IMMEDIATELY Use the name to greet them
       * For all subsequent interactions:
         1. Use get_player_profile to obtain their current name
         2. Address them by this exact name EXCEPT when asking for the next action, refer to the ENTIRE group of adventurers. 
    
    * Praying and Stat Recovery:
      - When a player's stat drops too low, they can pray to Saint Dustfeather Hollobone
      - Example Prayer Interaction:
        Player: "I kneel and pray to Saint Dustfeather Hollobone to restore my strength"
        GM Response: "Ah, a wise choice! The Saint of Lost Souls hears your desperate plea. A warm golden light surrounds you as your [wit/brawn] is restored."
      - After prayer:
        * First describe the immediate effect: "You feel invigorated as divine energy flows through you."
        * Then present a new opportunity: "With renewed strength, what will you attempt next?"

    IMPORTANT: 
    1. Keep all responses to 3-4 sentences maximum, about 30 seconds of speech.
    2. After calling roll_d6 IMMEDIATELY ANNOUNCE THE RESULT OF THE ROLL. 
    3. After calling set_player_attributes IMMEDIATELY ANNOUNCE the player's attributes.
    4. After calling set_player_name IMMEDIATELY WELCOME the adventurer and refer to the player by their exactname. 
    5. After calling get_player_profile IMMEDIATELY greet the player by their exact name and ask them what they want to do next.`,
    playerInstructions: "You are adventurers exploring the haunted depths of Duskhollow Priory, each with your own skills and motivations.",
    voice: "ash",
    toolFunctions: {
      roll_d6: {
        name: 'roll_d6',
        description: 'Roll a six-sided die to determine action outcome',
        parameters: {
          type: 'object',
          properties: {
            actionType: {
              type: 'string',
              enum: ['wit', 'brawn'],
              description: 'The type of action being performed. Wit is for mental challenges, magic, perception, and cunning. Brawn is for physical challenges, combat, endurance, and strength.'
            },
            action: {
              type: 'string',
              description: 'The specific action that was attempted by the player'
            }
          },
          required: ['actionType', 'action'],
          additionalProperties: false,
        },
        function: ($: GameStateUpdaters, currentPlayer: number) => {
          return async (params: { actionType: string, action: string }) => {
            // Roll the die
            const roll = Math.floor(Math.random() * 6) + 1;

            $.showDice(roll as 1 | 2 | 3 | 4 | 5 | 6);
            
            const stat = params.actionType === 'wit' 
              ? $.getStat1(currentPlayer)
              : $.getStat2(currentPlayer);
            

            // Success is when the roll is less than or equal to the relevant stat
            const success = roll <= stat;
            
            // Get player name for more personalized message
            const playerName = $.getPlayerProfile(currentPlayer).name || `Adventurer ${currentPlayer}`;
            
            const lowStatWarning = 
              (stat <= 1) 
                ? `\nYour ${params.actionType} is dangerously low. Perhaps a fervent prayer to Saint Dustfeather Hollobone might restore your strength...`
                : '';

            const outcomeMessage = 
              `${playerName} rolled a ${roll} for their ${params.action}.\n` +
              `Their ${params.actionType.toUpperCase()} check against their stat of ${stat}:\n` +
              `${roll === stat 
                ? `CRITICAL MOMENT: A perfect match! ${playerName} gains a flash of insight or a moment of perfect clarity about their situation.`
                : success 
                  ? `SUCCESS! The shadows recede, if only for a moment. ${playerName}'s next similar action gains temporary advantage.`
                  : `FAILURE! The darkness grows deeper. ${playerName}'s situation becomes more dire - introduce an immediate supernatural consequence.`
              }${lowStatWarning}\n`;
            
            // Send the outcome message
            $.sendAssistantMessageContent(`<context>${outcomeMessage}</context>`);
            // $.sendAssistantMessageContent(`Announce the result of the roll IMMEDIATELY and ask the player what's next.`);
            
            // Record the action
            $.addPlayerAction(currentPlayer, params.action, success);

            // Simulate PTT to get assistant to respond
            // await $.simulatePTT(currentPlayer);

            // Update stats based on success/failure
            if (success) {
              // On success, improve the used stat; on failure, the used stat becomes worse
              const currentProfile = $.getPlayerProfile(currentPlayer);
              $.setPlayerProfiles(prev => ({
                ...prev,
                [currentPlayer]: {
                  ...currentProfile,
                  [params.actionType === 'wit' ? 'stat1' : 'stat2']: 
                    Math.min(6, (params.actionType === 'wit' ? $.getStat1(currentPlayer) : $.getStat2(currentPlayer)) + 1)
                }
              }));
            } else {
              // On failure, the used stat becomes worse
              const currentProfile = $.getPlayerProfile(currentPlayer);
              $.setPlayerProfiles(prev => ({
                ...prev,
                [currentPlayer]: {
                  ...currentProfile,
                  [params.actionType === 'wit' ? 'stat1' : 'stat2']: 
                    Math.max(1, (params.actionType === 'wit' ? $.getStat1(currentPlayer) : $.getStat2(currentPlayer)) - 1)
                }
              }));
            }

            // Check for extreme stat conditions
            if ($.getStat1(currentPlayer) <= 1) {
              $.sendAssistantMessageContent(
                `<context>${playerName}'s mind has been overwhelmed by the priory's dark influence. They begin to babble incoherently about ancient secrets and forbidden knowledge... Urge them to pray to Saint Dustfeather Hollobone, the patron saint of the priory.</context>`
              );
            } else if ($.getStat2(currentPlayer) <= 1) {
              $.sendAssistantMessageContent(
                `<context>${playerName}'s physical form begins to fade, as if the very shadows of the priory are consuming them... Urge them to pray to Saint Dustfeather Hollobone, the patron saint of the priory.</context>`
              );
            }

            //await $.simulatePTT(currentPlayer);
            
            return {
              roll,
              stat,
              success,
              critical: roll === stat,
              message: outcomeMessage
            };
          };
        }
      },
      set_player_name: {
        name: 'set_player_name',
        description: 'Set the name for a specific player based on their introduction',
        parameters: {
          type: 'object',
          properties: {
            playerId: {
              type: 'number',
              description: 'The ID of the player (1-3)'
            },
            name: {
              type: 'string',
              description: 'The exact name as introduced by the player'
            },
            originalStatement: {
              type: 'string',
              description: 'The complete statement where the player introduced their name'
            }
          },
          required: ['playerId', 'name', 'originalStatement'],
          additionalProperties: false,
        },
        function: ($: GameStateUpdaters) => {
          return (params: { playerId: number; name: string; originalStatement: string }) => {
            const cleanName = params.name.trim();
            $.setPlayerName(params.playerId, cleanName);
            // $.sendAssistantMessageContent(`<context>The name ${cleanName} has been etched into the priory's memory...</context>`);
            $.updateProfilePicture(params.playerId, {name: cleanName});
            return `Player ${params.playerId} has been set as ${cleanName}`;
          };

        }
      },
      get_player_profile: {
        name: 'get_player_profile',
        description: 'Get the profile information for a specific player',
        parameters: {
          type: 'object',
          properties: {
            playerId: {
              type: 'number',
              description: 'The ID of the player (1-3)'
            }
          },
          required: ['playerId'],
          additionalProperties: false,
        },
        function: ($: GameStateUpdaters) => {
          return (params: { playerId: number }) => {
            return $.getPlayerProfile(params.playerId);
          };
        }
      },
      set_player_attributes: {
        name: 'set_player_attributes',
        description: 'Set the descriptor, type, and role for a specific player. Missing attributes will be randomly assigned.',
        parameters: {
          type: 'object',
          properties: {
            playerId: {
              type: 'number',
              description: 'The ID of the player (1-3)'
            },
            descriptor: {
              type: 'string',
              description: 'The descriptor of the character (optional)'
            },
            role: {
              type: 'string', 
              description: 'The type of character (optional)'
            },
            // role: {
            //   type: 'string',
            //   description: 'The role of the character (optional)',
            //   enum: ['protector', 'seeker', 'scholar', 'wanderer', 'noble', 'merchant']
            // }
          },
          required: ['playerId'],
          additionalProperties: false,
        },
        function: ($: GameStateUpdaters) => {
          return (params: { playerId: number; descriptor?: string; type?: string; role?: string }) => {
            const descriptors = ['seasoned', 'untested', 'mysterious', 'cursed', 'noble', 'outcast'];
            const roles = ['warrior', 'mage', 'rogue', 'cleric', 'ranger', 'bard'];
            //const roles = ['protector', 'seeker', 'scholar', 'wanderer', 'noble', 'merchant'];

            //map type to role here, so that no UI change is needed. 
            const finalDescriptor = params.descriptor || descriptors[Math.floor(Math.random() * descriptors.length)];
            //const finalType = params.type || types[Math.floor(Math.random() * types.length)];
            const finalType = params.role || roles[Math.floor(Math.random() * roles.length)];

            //$.setPlayerAttributes(params.playerId, finalDescriptor, finalType, finalRole);
            $.setPlayerAttributes(params.playerId, finalDescriptor, finalType, "");
            // Generate a new profile picture when attributes are set
            $.updateProfilePicture(params.playerId, {descriptor: finalDescriptor, type: finalType});
            const playerName = $.getPlayerProfile(params.playerId).name || `Adventurer ${params.playerId}`;
            $.sendAssistantMessageContent(
              `<context>The ancient tomes record that ${playerName} is a ${finalDescriptor} ${finalType}...</context>`
            );
            return {
              message: `<context>The ancient tomes record that ${playerName} is a ${finalDescriptor} ${finalType}...</context>`
            };
          };


        }
      },
      pray_to_saint: {
        name: 'pray_to_saint',
        description: 'Handle a prayer to Saint Dustfeather Hollobone, patron saint of the priory',
        parameters: {
          type: 'object',
          properties: {
            fervor: {
              type: 'string',
              enum: ['pious', 'fervent', 'desperate'],
              description: 'The intensity of the prayer'
            },
            attribute: {
              type: 'string',
              enum: ['wit', 'brawn'],
              description: 'Which attribute to potentially bless'
            }
          },
          required: ['fervor', 'attribute'],
          additionalProperties: false,
        },
        function: ($: GameStateUpdaters, currentPlayer: number) => {
          return (params: { fervor: string, attribute: string }) => {
            const playerName = $.getPlayerProfile(currentPlayer).name || `Adventurer ${currentPlayer}`;
            const isFervent = params.fervor === 'desperate' || params.fervor === 'fervent';
            
            if (isFervent) {
              // Increase the chosen stat by 1, up to max of 6
              const currentProfile = $.getPlayerProfile(currentPlayer);
              $.setPlayerProfiles(prev => ({
                ...prev,
                [currentPlayer]: {
                  ...currentProfile,
                  [params.attribute === 'wit' ? 'stat1' : 'stat2']: 
                    Math.min(6, (params.attribute === 'wit' ? $.getStat1(currentPlayer) : $.getStat2(currentPlayer)) + 1)
                }
              }));
            }
            
            const outcomeMessage = 
              `<context>` +
              `${playerName}'s ${params.fervor} prayer echoes through the priory's halls...\n` +
              `${isFervent ? 'The saint\'s blessing flows through you, strengthening your ' + params.attribute + '.' 
                        : 'The halls remain silent, perhaps more fervor is needed.'}\n` +
              `</context>`;
            
            $.sendAssistantMessageContent(outcomeMessage);

            return {
              heard: isFervent,
              blessed: isFervent,
              attribute: params.attribute,
              message: isFervent ? "Saint Duskfeather Hollobone has blessed you" : "Your prayer goes unanswered"
            };
          };
        }
      }
    }
  }
];

