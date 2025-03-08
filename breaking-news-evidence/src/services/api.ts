// API service for Xano database interactions
export interface Player {
  id: string;
  name?: string;
  email?: string;
  created_at?: string;
}


export const fetchPlayerData = async (playerId: string) => {
  const url = `https://x26n-hsrb-jurx.n7d.xano.io/api:uO-MKMoA/players/${playerId}`;

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
  // Real API call
  const url = `https://x26n-hsrb-jurx.n7d.xano.io/api:uO-MKMoA/players/${playerId}`;

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

