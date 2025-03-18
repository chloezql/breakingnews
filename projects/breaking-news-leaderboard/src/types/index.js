/**
 * Player data type definitions
 */

/**
 * @typedef {Object} Player
 * @property {string} id - Player unique identifier
 * @property {string} [player_name] - Player name
 * @property {string} [id_card_no] - Player ID card number
 * @property {string} [headline] - Headline created by the player
 * @property {number[]} [evidence_list] - List of evidence IDs selected by the player
 * @property {number[]} [tape] - List of tape IDs
 * @property {number[]} [selected_suspect] - List of suspect IDs selected by the player
 * @property {string} [full_article_generated] - Full generated article text
 * @property {number} [view_count] - Number of views for the article
 * @property {string[]} [hashtags] - Array of hashtags associated with the article
 * @property {string} [created_at] - Timestamp when the player data was created
 * @property {string} [updated_at] - Timestamp when the player data was last updated
 * @property {number} [trending] - Trending indicator (positive or negative percentage)
 */

// Export type definitions for JSDoc support
export const TYPES = {
    Player: 'Player'
}; 