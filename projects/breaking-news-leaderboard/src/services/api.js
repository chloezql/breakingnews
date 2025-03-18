/**
 * API Service for interacting with the Xano database
 */

// Get base URL from environment variables or use default
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://x26n-hsrb-jurx.n7d.xano.io/api:uO-MKMoA';
// Get fetch interval from environment variables or use default (60 seconds)
const FETCH_INTERVAL = parseInt(process.env.REACT_APP_FETCH_INTERVAL || '60000', 10);

/**
 * Fetch leaderboard data
 * @returns {Promise<Array>} Array of leaderboard entries
 */
export const fetchLeaderboard = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
};

/**
 * Get the configured fetch interval in milliseconds
 * @returns {number} Fetch interval in milliseconds
 */
export const getFetchInterval = () => FETCH_INTERVAL;

/**
 * Format a number with commas for thousands
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format a date string into a more readable format
 * @param {string} dateString - ISO date string 
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return '';

    // Get time difference in seconds
    const secondsAgo = Math.floor((new Date() - date) / 1000);

    if (secondsAgo < 5) return 'just now';
    if (secondsAgo < 60) return `${secondsAgo} sec ago`;

    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo} min ago`;

    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo} hr ago`;

    const daysAgo = Math.floor(hoursAgo / 24);
    if (daysAgo < 7) return `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;

    // Fall back to actual date for older entries
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
};

/**
 * Fetch recent entries sorted by creation date
 * @param {number} limit - Number of recent entries to fetch
 * @returns {Promise<Array<import('../types').Player>>}
 */
export const fetchRecentEntries = async (limit = 5) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/recent_entries?limit=${limit}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching recent entries:', error);
        return [];
    }
};

/**
 * Submit a new player entry to the database
 * @param {import('../types').Player} playerData - Player data to submit
 * @returns {Promise<import('../types').Player>}
 */
export const submitPlayerEntry = async (playerData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/player`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(playerData),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error submitting player entry:', error);
        throw error;
    }
}; 