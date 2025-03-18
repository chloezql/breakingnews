import React from 'react';
import '../styles/LeaderboardEntry.scss';
import { formatNumber } from '../services/api';

const LeaderboardEntry = ({ rank, entry }) => {
    const medalClass = rank <= 3 ? `medal medal-${rank}` : '';

    // Default hashtags if none provided
    const hashtags = entry.hashtags || ['#BreakingNews', '#AstraAcademy', '#Investigation'];

    return (
        <div className={`leaderboard-entry ${rank % 2 === 0 ? 'even' : 'odd'}`}>
            <div className="rank">
                {rank <= 3 ? (
                    <div className={medalClass}>
                        {rank}
                    </div>
                ) : (
                    <span>{rank}</span>
                )}
            </div>

            <div className="views">
                <i className="fas fa-eye"></i> {formatNumber(entry.view_count)}
            </div>

            <div className="headline">
                <h3>{entry.headline || "Untitled Headline"}</h3>
                <div className="hashtags">
                    {Array.isArray(hashtags) ?
                        hashtags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="hashtag">{tag}</span>
                        )) :
                        <span className="hashtag">#BreakingNews</span>
                    }
                </div>
            </div>

            <div className="reporter">
                {entry.player_name || "Anonymous Reporter"}
            </div>
        </div>
    );
};

export default LeaderboardEntry; 