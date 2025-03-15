// API service for Xano database interactions
export interface Player {
  id: string;
  player_name?: string;
  id_card_no?: string;
  headline?: string;
  evidence_list?: number[];
  tape?: string;
  selected_suspect?: number[];
  full_article_generated?: string;
  view_count?: number,
  hashtags?: string[]
}

const API_BASE_URL = 'https://x26n-hsrb-jurx.n7d.xano.io/api:uO-MKMoA';

export const findPlayerByCardId = async (cardId: string): Promise<Player[] | null> => {
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
    console.log('Found player by card ID:', data); // Log the found player data
    return data;
  } catch (error) {
    console.error('Error finding player:', error);
    return null;
  }
};

export const fetchPlayerData = async (playerId: string) => {
  const url = `${API_BASE_URL}/players/${playerId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // If your API requires authentication, include the token here
        // 'Authorization': `Bearer ${your_api_key}`
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log(data); // Log the player data
    return data; // Return the player data
  } catch (error) {
    console.error('Error fetching player data:', error);
  }
};

// Update this function to use PATCH instead of POST
export const updatePlayerEvidence = async (playerId: string, evidenceIds: number[]) => {
  const url = `${API_BASE_URL}/update_evidence/${playerId}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ evidence_list: [...evidenceIds] })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error details:', errorData);
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Evidence updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating player evidence:', error);
    throw error;
  }
};

