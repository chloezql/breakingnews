// API service for Xano database interactions
export interface Player {
  id: string;
  player_name?: string;
  id_card_no?: string;
  created_at?: string;
}
// https://x26n-hsrb-jurx.n7d.xano.io/api:uO-MKMoA/players
const API_BASE_URL = 'https://x26n-hsrb-jurx.n7d.xano.io/api:uO-MKMoA';
/**
 * Find a player by their card ID
 * @param cardId The RFID card ID to search for
 * @returns The player object if found, null otherwise
 */
export const findPlayerByCardId = async (cardId: string): Promise<Player | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/player_by_card_id/${encodeURIComponent(cardId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Player not found');
    }

    const data = await response.json();
    console.log('Found player by card ID:', data);
    
    // Return the first player if it's an array, or the player object directly
    return Array.isArray(data) && data.length > 0 ? data[0] : data;
  } catch (error) {
    console.error('Error finding player:', error);
    return null;
  }
};

/**
 * Update a player's card ID to empty
 * @param playerId The ID of the player to update
 * @returns The updated player object if successful, null otherwise
 */
export const updatePlayerCardId = async (playerId: string): Promise<Player | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/update_player_card_id/${playerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_card_no: "" // Set card ID to empty
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update player');
    }

    const data = await response.json();
    console.log('Updated player card ID:', data);
    return data;
  } catch (error) {
    console.error('Error updating player card ID:', error);
    return null;
  }
};

/**
 * Create a new player with the scanned card ID
 * @param cardId The RFID card ID to assign to the new player
 * @returns The created player object if successful, null otherwise
 */
export const createNewPlayer = async (cardId: string): Promise<Player | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_card_no: cardId, 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create player');
    }

    const data = await response.json();
    console.log('Created new player:', data);
    return data;
  } catch (error) {
    console.error('Error creating new player:', error);
    return null;
  }
}; 