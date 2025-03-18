import React, { useEffect, useState, useRef } from 'react';
import '../styles/LeaderboardPage.scss';
import LeaderboardEntry from './LeaderboardEntry';
import { fetchLeaderboard, formatDate, getFetchInterval } from '../services/api';

// Get the refresh interval from the API service
const REFRESH_INTERVAL = getFetchInterval();

const LeaderboardPage = () => {
    const [leaderboardEntries, setLeaderboardEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const [updateLogs, setUpdateLogs] = useState([]);
    const entriesContainerRef = useRef(null);
    const scrollIntervalRef = useRef(null);
    const logsContainerRef = useRef(null);
    const isResettingRef = useRef(false);

    // Fetch leaderboard data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await fetchLeaderboard();
                const currentTime = new Date();

                // Add log entry
                const logEntry = {
                    time: currentTime,
                    message: `Leaderboard updated with ${data.length} entries`,
                    count: data.length
                };

                setLeaderboardEntries(data);
                setLastUpdated(currentTime);
                setUpdateLogs(prevLogs => {
                    // Keep only the last 10 logs
                    const newLogs = [logEntry, ...prevLogs];
                    return newLogs.slice(0, 10);
                });
                setLoading(false);

                // Log to console as well
                console.log(`[${currentTime.toLocaleTimeString()}] ${logEntry.message}`);
            } catch (err) {
                setError('Failed to load leaderboard data');
                setLoading(false);
                console.error('Error loading data:', err);

                // Add error log
                const errorLog = {
                    time: new Date(),
                    message: `Error updating leaderboard: ${err.message}`,
                    isError: true
                };
                setUpdateLogs(prevLogs => [errorLog, ...prevLogs].slice(0, 10));
            }
        };

        // Initial fetch
        fetchData();

        // Set up a polling interval to refresh data
        const intervalId = setInterval(fetchData, REFRESH_INTERVAL);

        // Clean up the interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    // Setup auto-scroll effect
    useEffect(() => {
        const entriesContainer = entriesContainerRef.current;
        if (!entriesContainer || leaderboardEntries.length === 0) return;

        const handleAutoScroll = () => {
            if (!entriesContainer || !isAutoScrolling || isResettingRef.current) return;

            // Get current scroll position
            const scrollTop = entriesContainer.scrollTop;
            const scrollHeight = entriesContainer.scrollHeight;
            const clientHeight = entriesContainer.clientHeight;

            // Calculate new scroll position (add 1px every 50ms)
            let newScrollTop = scrollTop + 1;

            // Reset to top when reaching bottom (with a 20px buffer)
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                // Prevent multiple resets while animation is in progress
                if (isResettingRef.current) return;
                isResettingRef.current = true;

                // Add a log message when we loop back to top
                console.log("Reached the end of entries, resetting to top");

                // Add to logs
                const loopLog = {
                    time: new Date(),
                    message: "Reached the end of leaderboard, starting from top",
                    isLoop: true
                };

                setUpdateLogs(prevLogs => [loopLog, ...prevLogs].slice(0, 10));

                // Smoothly scroll back to top
                entriesContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });

                // Wait for scrolling animation to complete before checking position again
                setTimeout(() => {
                    isResettingRef.current = false;
                }, 1000);  // Give enough time for scroll animation to complete
                return;
            }

            entriesContainer.scrollTop = newScrollTop;
        };

        // Start auto-scrolling
        if (isAutoScrolling) {
            scrollIntervalRef.current = setInterval(handleAutoScroll, 50);
        }

        return () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }
        };
    }, [leaderboardEntries, isAutoScrolling]);

    // Auto-scroll new logs into view
    useEffect(() => {
        if (logsContainerRef.current && updateLogs.length > 0) {
            logsContainerRef.current.scrollTop = 0;
        }
    }, [updateLogs]);

    // Toggle auto-scroll
    const toggleAutoScroll = () => {
        setIsAutoScrolling(prev => !prev);
    };

    // Toggle update logs visibility
    const [showLogs, setShowLogs] = useState(false);
    const toggleLogs = () => {
        setShowLogs(prev => !prev);
    };

    if (loading && leaderboardEntries.length === 0) {
        return (
            <div className="leaderboard-page">
                <div className="leaderboard-loading">
                    <h2>Loading Breaking News Leaderboard...</h2>
                    <div className="loader"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="leaderboard-page">
                <div className="leaderboard-error">
                    <h2>Error Loading Leaderboard</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-page">
            <div className="leaderboard-header">
                <h1>Breaking News Leaderboard</h1>
                <p>Top reporters ranked by article views</p>
            </div>

            {/* Control buttons */}
            <div className="control-buttons">
                <button
                    className={`log-toggle ${showLogs ? 'active' : ''}`}
                    onClick={toggleLogs}
                >
                    <i className="fas fa-list"></i>
                    {showLogs ? ' Hide Logs' : ' Show Logs'}
                </button>

                <button
                    className={`scroll-toggle ${isAutoScrolling ? 'active' : ''}`}
                    onClick={toggleAutoScroll}
                    aria-label={isAutoScrolling ? "Pause auto-scroll" : "Resume auto-scroll"}
                >
                    <i className={`fas ${isAutoScrolling ? 'fa-pause' : 'fa-play'}`}></i>
                    {isAutoScrolling ? ' Pause Scroll' : ' Auto Scroll'}
                </button>
            </div>

            {/* Update Logs */}
            {showLogs && (
                <div className="update-logs" ref={logsContainerRef}>
                    <h3>Update Logs</h3>
                    {updateLogs.length > 0 ? (
                        <div className="log-entries">
                            {updateLogs.map((log, index) => (
                                <div
                                    key={index}
                                    className={`log-entry ${log.isError ? 'error' : ''} ${log.isLoop ? 'loop' : ''}`}
                                >
                                    <span className="log-time">
                                        {formatDate(log.time)}
                                    </span>
                                    <span className="log-message">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No update logs yet</p>
                    )}
                </div>
            )}

            {/* Leaderboard Entries */}
            <div className="leaderboard-container">
                <div className="leaderboard-table-header">
                    <div className="rank-header">Rank</div>
                    <div className="views-header">Views</div>
                    <div className="headline-header">Headline</div>
                    <div className="reporter-header">Reporter</div>
                </div>

                <div
                    className="leaderboard-entries"
                    ref={entriesContainerRef}
                >
                    {leaderboardEntries.length > 0 ? (
                        leaderboardEntries.map((entry, index) => (
                            <LeaderboardEntry
                                key={entry.id || index}
                                entry={entry}
                                rank={index + 1}
                            />
                        ))
                    ) : (
                        <div className="no-entries">
                            <p>No leaderboard entries yet. Be the first to submit a story!</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="leaderboard-footer">
                <p>Leaderboard updates automatically every minute</p>
                {lastUpdated && (
                    <p className="last-updated">
                        Last updated: {formatDate(lastUpdated)}
                    </p>
                )}
                <p className="copyright">© {new Date().getFullYear()} Breaking News</p>
            </div>
        </div>
    );
};

export default LeaderboardPage; 