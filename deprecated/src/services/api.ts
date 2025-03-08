// API service for Xano database interactions
export interface Player {
  id: string;
  name?: string;
  email?: string;
  created_at?: string;
  rfid_card?: string;  // Add RFID card field
}

// Existing functions ...

// New function to authenticate via RFID
export const authenticateWithRFID = async (rfidCode: string) => {
  const url = `https://x26n-hsrb-jurx.n7d.xano.io/api:uO-MKMoA/auth/rfid`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rfid_code: rfidCode })
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = await response.json();
    return data.player as Player;
  } catch (error) {
    console.error('RFID Authentication error:', error);
    throw error;
  }
}; 