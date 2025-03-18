const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch'); // node-fetch version 2 compatible with CommonJS

// API configuration - update with your Xano API details
const API_BASE_URL = 'https://x26n-hsrb-jurx.n7d.xano.io/api:uO-MKMoA'; // Replace with your actual Xano API endpoint
// Serial port configuration - update this to match your ESP32 port
const SERIAL_PORT = '/dev/cu.usbserial-0001'; // Example: COM3 for Windows, /dev/ttyUSB0 for Linux
const BAUD_RATE = 115200;

// Audio directory path - update this to the correct path
const AUDIO_DIR = path.join(__dirname, 'audio');
console.log(`Audio directory: ${AUDIO_DIR}`);

// Music file paths
const MUSIC_FILES = {
    'director_correct': path.join(AUDIO_DIR, 'Station3_Director_01.wav'),
    'director_default': path.join(AUDIO_DIR, 'Station3_Director_01A.wav'),
    'football_correct': path.join(AUDIO_DIR, 'Station3_Football_01.wav'),
    'football_default': path.join(AUDIO_DIR, 'Station3_Football_01A.wav'),
    'neighbor_correct': path.join(AUDIO_DIR, 'Station3_Neighbor_01.wav'),
    'neighbor_default': path.join(AUDIO_DIR, 'Station3_Neighbor_01A.wav'),
    'intro_reminder': path.join(AUDIO_DIR, 'breaking-news-tape-before-game-reminder.mp3'),
    'tony_intro': path.join(AUDIO_DIR, 'Station3_Tony_01.wav'),
    'tony_second': path.join(AUDIO_DIR, 'Station3_Tony_02.wav'),
    'session_end': path.join(AUDIO_DIR, 'timer-expired.wav'),
    'default': path.join(AUDIO_DIR, 'Station3_Neighbor_01A.wav') // Default music for unknown cards
};

// Verify audio files exist
console.log("Checking audio files...");
for (const [key, filePath] of Object.entries(MUSIC_FILES)) {
    if (fs.existsSync(filePath)) {
        console.log(`✓ Found: ${key} -> ${filePath}`);
    } else {
        console.error(`✗ Missing: ${key} -> ${filePath}`);
    }
}

// Define correct reader-UID matches and their associated music
const CORRECT_MATCHES = {
    '1|21ED8F49': MUSIC_FILES['neighbor_correct'],  // Reader 1 - Neighbor
    '2|51E98F49': MUSIC_FILES['director_correct'],  // Reader 2 - Director
    '3|41EB8F49': MUSIC_FILES['football_correct']   // Reader 3 - Football
};

// Map reader numbers to correct match indices
const READER_TO_INDEX = {
    '1': 3, // Reader 1 corresponds to index 1 in the array
    '2': 2, // Reader 2 corresponds to index 2 in the array
    '3': 1  // Reader 3 corresponds to index 3 in the array
};

// Define default music for specific UIDs when on wrong readers
const UID_DEFAULT_MUSIC = {
    '51E98F49': MUSIC_FILES['director_default'], // Director card on wrong reader
    '41EB8F49': MUSIC_FILES['football_default'], // Football card on wrong reader
    '21ED8F49': MUSIC_FILES['neighbor_default']  // Neighbor card on wrong reader
};

// Track current state and last detection times
const readerStates = {
    '1': { lastTime: 0, uid: null, active: false, removalTime: 0, lastRemoval: 0 },
    '2': { lastTime: 0, uid: null, active: false, removalTime: 0, lastRemoval: 0 },
    '3': { lastTime: 0, uid: null, active: false, removalTime: 0, lastRemoval: 0 },
    '4': { lastTime: 0, uid: null, active: false, removalTime: 0, lastRemoval: 0 }
};

// Game session state
let currentActiveReader = null;
let currentMusicFile = null;
let lastSwitchTime = 0; // Track when we last switched readers
let currentAudioProcess = null;
let isAudioPlaying = false;
let audioStartTime = 0; // Track when audio playback started
let currentPlayer = null; // To store the current player data
let gameSessionActive = false; // Flag to track if a game session is active
let gameSessionStartTime = 0; // When the game session started
let gameSessionEndTime = 0; // When the game session will end
let correctMatchesTracked = []; // Array to track which readers had correct matches
let audioQueue = []; // Queue for sequential audio playback
let processingAudioQueue = false; // Flag to track if we're processing the audio queue
const GAME_SESSION_DURATION = 20; // 2 minutes in seconds
const AUDIO_GRACE_PERIOD = 5.0; // Grace period in seconds after audio starts before allowing interruption

// Constants for timing - adjusted to match Arduino timing
const CARD_REMOVAL_THRESHOLD = 1.0; // Match Arduino's STABLE_READ_TIME (1000ms)
const DEBOUNCE_THRESHOLD = 0.8; // Match Arduino's DEBOUNCE_DELAY (800ms)
const READER_SWITCH_THRESHOLD = 1.0; // Minimum time between reader switches (1000ms)
const LOOP_DELAY = 100; // Main loop delay (100ms, half of Arduino's 200ms)

// API Functions

// Find player by card ID
async function findPlayerByCardId(cardId) {
    try {
        console.log(`Calling API to find player with card ID: ${cardId}`);
        // Try both possible endpoint paths
        let url = `${API_BASE_URL}/player_by_card_id/${encodeURIComponent(cardId)}`;
        console.log(`Trying API URL: ${url}`);

        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // If the first endpoint fails, try an alternative format
        if (!response.ok && response.status === 404) {
            console.log('First endpoint attempt failed, trying alternative format');
            url = `${API_BASE_URL}/players/by-card-id/${encodeURIComponent(cardId)}`;
            console.log(`Trying alternate API URL: ${url}`);

            response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
        }

        // Handle response
        if (!response.ok) {
            // Try to get error details from the response
            let errorDetails;
            try {
                errorDetails = await response.text();
                console.error(`API error details: ${errorDetails}`);
            } catch (e) {
                errorDetails = 'No error details available';
            }

            throw new Error(`Player not found: ${response.status} ${response.statusText} - ${errorDetails}`);
        }

        const data = await response.json();
        console.log('Found player data structure:', JSON.stringify(data, null, 2));

        // Extract the player ID based on different possible structures
        let playerId = null;
        let playerData = null;

        // Handle different possible API response structures
        if (Array.isArray(data) && data.length > 0) {
            // If response is an array, use the first item
            playerData = data[0];
            console.log('Using first player from array response');
        } else if (typeof data === 'object') {
            // If response is a single object
            playerData = data;
        }

        // Check different possible ID field names
        if (playerData) {
            // Try different common ID field names
            if (playerData.id !== undefined) {
                playerId = playerData.id;
            } else if (playerData._id !== undefined) {
                playerId = playerData._id;
            } else if (playerData.player_id !== undefined) {
                playerId = playerData.player_id;
            } else if (playerData.playerId !== undefined) {
                playerId = playerData.playerId;
            } else {
                // If we can't find a standard ID field, log all keys
                console.log('Unable to find ID field. Available fields:', Object.keys(playerData));

                // As a fallback, use any field that contains "id" in its name
                const possibleIdFields = Object.keys(playerData).filter(key =>
                    key.toLowerCase().includes('id'));

                if (possibleIdFields.length > 0) {
                    playerId = playerData[possibleIdFields[0]];
                    console.log(`Using ${possibleIdFields[0]} as ID field with value: ${playerId}`);
                }
            }
        }

        // Create a normalized player object with a guaranteed id field
        const normalizedPlayer = {
            id: playerId,
            rawData: playerData
        };

        console.log('Normalized player:', JSON.stringify(normalizedPlayer, null, 2));
        return normalizedPlayer;
    } catch (error) {
        console.error('Error finding player:', error.message);
        return null;
    }
}

// Update tape selection for a player
async function updateTapeSelection(playerId, tapeIds) {
    try {
        console.log(`Updating tape selection for player ${playerId} with tapes: ${tapeIds}`);
        let url = `${API_BASE_URL}/update-tape-selection/${playerId}`;
        console.log(`Trying API URL: ${url}`);

        let response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ tape: [...tapeIds] })
        });

        // If the first endpoint fails, try an alternative format
        if (!response.ok && response.status === 404) {
            console.log('First endpoint attempt failed, trying alternative format');
            url = `${API_BASE_URL}/players/update-tape-selection/${playerId}`;
            console.log(`Trying alternate API URL: ${url}`);

            response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ tape: [...tapeIds] })
            });
        }

        if (!response.ok) {
            // Try to get error details from the response
            let errorDetails;
            try {
                errorDetails = await response.text();
                console.error(`API error details: ${errorDetails}`);
            } catch (e) {
                errorDetails = 'No error details available';
            }

            throw new Error(`Error updating tape selection: ${response.status} ${response.statusText} - ${errorDetails}`);
        }

        const data = await response.json();
        console.log('Tape selection updated successfully:', JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error('Error updating tape selection:', error.message);
        return null;
    }
}

// Game session management

// Start a new game session
function startGameSession() {
    gameSessionActive = true;
    gameSessionStartTime = Date.now() / 1000;
    gameSessionEndTime = gameSessionStartTime + GAME_SESSION_DURATION;
    correctMatchesTracked = [];
    console.log(`Game session started at ${new Date(gameSessionStartTime * 1000).toISOString()}`);
    console.log(`Game session will end at ${new Date(gameSessionEndTime * 1000).toISOString()}`);
}

// End the current game session and update the player's tape selection
async function endGameSession() {
    if (!gameSessionActive) return;

    gameSessionActive = false;
    console.log(`Game session ended at ${new Date().toISOString()}`);
    console.log(`Correct matches achieved: ${correctMatchesTracked.join(', ')}`);

    // Block all readers
    const blockedReaders = {};
    for (const readerId in readerStates) {
        blockedReaders[readerId] = true;
        console.log(`Blocking reader ${readerId} at end of session`);
    }

    // Clear audio queue and stop current audio before playing timer sound
    audioQueue = [];
    stopAudio();
    console.log("Cleared audio queue and stopped current audio for session end sound");

    if (currentPlayer && currentPlayer.id) {
        // Send the tracked correct matches to the API
        await updateTapeSelection(currentPlayer.id, correctMatchesTracked);
    } else {
        console.log("No player data available to update tape selection");
    }

    // Reset game state
    currentPlayer = null;
    correctMatchesTracked = [];
    currentActiveReader = null;
    currentMusicFile = null;

    // Play the closing announcement with direct approach to ensure it plays
    // Try using an MP3 player first which might have better compatibility
    playSessionEndSound();
}

// Track a correct match
function trackCorrectMatch(readerId) {
    if (!gameSessionActive) return;

    // Convert reader ID to its corresponding index
    const matchIndex = READER_TO_INDEX[readerId];

    if (matchIndex && !correctMatchesTracked.includes(matchIndex)) {
        console.log(`Tracking correct match for reader ${readerId} as index ${matchIndex}`);
        correctMatchesTracked.push(matchIndex);
        // Sort the array to keep it in order
        correctMatchesTracked.sort((a, b) => a - b);
        console.log(`Updated correct matches: ${correctMatchesTracked.join(', ')}`);
    }
}

// Audio management

// Queue audio for sequential playback
function queueAudio(audioFile) {
    audioQueue.push(audioFile);
    console.log(`Added ${audioFile} to audio queue. Queue length: ${audioQueue.length}`);

    // Start processing the queue if not already processing
    if (!processingAudioQueue && !isAudioPlaying) {
        processAudioQueue();
    }
}

// Process the audio queue
async function processAudioQueue() {
    if (audioQueue.length === 0 || isAudioPlaying || processingAudioQueue) {
        return;
    }

    processingAudioQueue = true;

    // Get the next audio file from the queue
    const nextAudio = audioQueue.shift();
    console.log(`Processing next audio in queue: ${nextAudio}`);

    // Play the audio and wait for it to complete
    return new Promise((resolve) => {
        // Start playback
        startAudioPlayback(nextAudio);

        // Check if playback has completed every 500ms
        const checkInterval = setInterval(() => {
            if (!isAudioPlaying) {
                clearInterval(checkInterval);
                processingAudioQueue = false;
                console.log(`Finished playing ${nextAudio}`);

                // Process the next item in the queue
                setTimeout(() => {
                    processAudioQueue();
                }, 500);

                resolve();
            }
        }, 500);
    });
}

// Helper function to determine the appropriate music file for a reader/UID combination
function getMusicFile(reader, uid) {
    const key = `${reader}|${uid}`;
    console.log(`Checking key: ${key}`);

    // Only track correct matches during an active game session
    if (gameSessionActive && CORRECT_MATCHES[key]) {
        console.log("Correct reader-UID match during game session!");
        trackCorrectMatch(reader);
        return CORRECT_MATCHES[key];
    } else if (CORRECT_MATCHES[key]) {
        console.log("Correct reader-UID match, but no active game session");
        return CORRECT_MATCHES[key];
    } else if (UID_DEFAULT_MUSIC[uid]) {
        console.log("Known UID but wrong reader");
        return UID_DEFAULT_MUSIC[uid];
    } else {
        console.log("Unknown UID");
        return MUSIC_FILES['default'];
    }
}

// Function to safely stop audio playback
function stopAudio() {
    if (!currentAudioProcess) return;

    console.log("Stopping current audio playback");

    try {
        // Different process termination based on platform
        if (process.platform === 'darwin') {  // macOS
            exec(`kill ${currentAudioProcess.pid}`);
        } else if (process.platform === 'win32') {  // Windows
            exec(`taskkill /pid ${currentAudioProcess.pid} /f`);
        } else {  // Linux and others
            process.kill(currentAudioProcess.pid, 'SIGTERM');
        }
    } catch (err) {
        console.error(`Error stopping audio: ${err.message}`);
    }

    currentAudioProcess = null;
    isAudioPlaying = false;
}

// Play music for the given reader and UID
function playMusicForReader(reader, uid) {
    // If not in a game session and this is not reader 4, don't play anything
    if (!gameSessionActive && reader !== '4') {
        console.log(`Reader ${reader} - No active game session, ignoring`);
        return false;
    }

    const musicFile = getMusicFile(reader, uid);

    // Verify file exists before playing
    if (!fs.existsSync(musicFile)) {
        console.error(`Audio file does not exist: ${musicFile}`);
        return false;
    }

    // If we're processing a queue, add this to the queue instead of playing immediately
    if (processingAudioQueue || isAudioPlaying) {
        queueAudio(musicFile);
        return true;
    }

    // Stop any currently playing audio
    stopAudio();

    // Wait a brief moment to ensure previous audio is fully stopped
    setTimeout(() => {
        startAudioPlayback(musicFile);
    }, 100);

    return true;
}

// Start audio playback with appropriate player for the platform
function startAudioPlayback(musicFile) {
    console.log(`Attempting to play: ${musicFile}`);

    try {
        let audioProcess;

        // Choose appropriate audio player based on OS
        if (process.platform === 'darwin') {  // macOS
            audioProcess = spawn('afplay', [musicFile]);
            console.log(`Started afplay with PID: ${audioProcess.pid}`);
        } else if (process.platform === 'win32') {  // Windows
            audioProcess = spawn('powershell', [
                '-c',
                `(New-Object Media.SoundPlayer "${musicFile}").PlaySync()`
            ]);
            console.log(`Started Windows Media.SoundPlayer with PID: ${audioProcess.pid}`);
        } else {  // Linux and others
            audioProcess = spawn('aplay', [musicFile]);
            console.log(`Started aplay with PID: ${audioProcess.pid}`);
        }

        // Set up process event handlers
        audioProcess.stdout.on('data', (data) => {
            console.log(`Audio process stdout: ${data}`);
        });

        audioProcess.stderr.on('data', (data) => {
            console.error(`Audio process stderr: ${data}`);
        });

        audioProcess.on('error', (err) => {
            console.error(`Failed to start audio player: ${err.message}`);
            isAudioPlaying = false;
            currentAudioProcess = null;
            audioStartTime = 0;
            tryAlternativePlayer(musicFile);
        });

        audioProcess.on('close', (code, signal) => {
            console.log(`Audio process closed with code ${code} and signal ${signal}`);
            isAudioPlaying = false;
            currentAudioProcess = null;
            audioStartTime = 0;

            // Process the next item in the audio queue if there is one
            if (audioQueue.length > 0) {
                setTimeout(() => {
                    processAudioQueue();
                }, 500);
            }
        });

        currentAudioProcess = audioProcess;
        isAudioPlaying = true;
        currentMusicFile = musicFile;
        audioStartTime = Date.now() / 1000; // Set audio start time
        console.log(`Audio playback started at ${new Date().toISOString()}`);

        return true;
    } catch (err) {
        console.error(`Failed to start audio playback: ${err.message}`);
        isAudioPlaying = false;
        currentAudioProcess = null;
        audioStartTime = 0;
        tryAlternativePlayer(musicFile);
        return false;
    }
}

// Try alternative audio players if default one fails
function tryAlternativePlayer(musicFile) {
    console.log("Trying alternative audio player...");

    if (process.platform === 'darwin') {
        // Try using 'play' from SoX if available on macOS
        exec('which play', (error, stdout) => {
            if (!error && stdout.trim()) {
                console.log("Found 'play' command, trying to use it...");
                const audioProcess = spawn('play', [musicFile]);
                currentAudioProcess = audioProcess;
                isAudioPlaying = true;
            } else {
                console.error("No alternative audio player found");
            }
        });
    } else if (process.platform === 'win32') {
        // On Windows, try using mplayer if available
        exec('where mplayer', (error, stdout) => {
            if (!error && stdout.trim()) {
                console.log("Found 'mplayer' command, trying to use it...");
                const audioProcess = spawn('mplayer', [musicFile]);
                currentAudioProcess = audioProcess;
                isAudioPlaying = true;
            } else {
                console.error("No alternative audio player found");
            }
        });
    } else {
        // On Linux, try using mplayer if available
        exec('which mplayer', (error, stdout) => {
            if (!error && stdout.trim()) {
                console.log("Found 'mplayer' command, trying to use it...");
                const audioProcess = spawn('mplayer', [musicFile]);
                currentAudioProcess = audioProcess;
                isAudioPlaying = true;
            } else {
                console.error("No alternative audio player found");
            }
        });
    }
}

// Get the most recently active reader that still has a card
function getMostRecentActiveReader() {
    let mostRecentReader = null;
    let mostRecentTime = 0;

    for (const [reader, state] of Object.entries(readerStates)) {
        if (state.active && state.lastTime > mostRecentTime) {
            mostRecentTime = state.lastTime;
            mostRecentReader = reader;
        }
    }

    return mostRecentReader;
}

// Function to clear audio queue
function clearAudioQueue() {
    const queueLength = audioQueue.length;
    audioQueue = [];
    console.log(`Cleared audio queue (${queueLength} items removed)`);
}

// Function to handle card removal
function handleCardRemoval(readerId) {
    const currentTime = Date.now() / 1000; // Current time in seconds

    // Debounce card removal signals
    if ((currentTime - readerStates[readerId].lastRemoval) > DEBOUNCE_THRESHOLD) {
        console.log(`Reader ${readerId} - Card removed (explicit removal event)`);
        readerStates[readerId].active = false;
        readerStates[readerId].uid = null;
        readerStates[readerId].removalTime = currentTime;
        readerStates[readerId].lastRemoval = currentTime;

        // Only stop audio if this was the current active reader
        if (readerId === currentActiveReader) {
            console.log(`Active reader ${readerId} card was removed, handling audio change`);
            const mostRecentReader = getMostRecentActiveReader();

            // Clear audio queue and stop current audio immediately on active reader removal
            clearAudioQueue();
            stopAudio();

            if (mostRecentReader && mostRecentReader !== currentActiveReader) {
                console.log(`Switching to most recent active reader: ${mostRecentReader}`);
                // Immediately play the next reader's audio
                playMusicForReader(mostRecentReader, readerStates[mostRecentReader].uid);
                currentActiveReader = mostRecentReader;
                lastSwitchTime = currentTime;
            } else {
                // No other active readers
                console.log("No other active readers and active reader removed, audio stopped");
                currentActiveReader = null;
                currentMusicFile = null;
            }
        } else {
            console.log(`Non-active reader ${readerId} card was removed, keeping current audio playing`);
        }

        // If Reader 4 card was removed and we have an active game session, don't end it
        // The game session will end on its timer
        if (readerId === '4' && gameSessionActive) {
            console.log("Player ID card removed from Reader 4, but game session continues");
        }
    }
}

// Function to handle Reader 4 scan - player identification
async function handlePlayerScan(cardId) {
    // If we already have a player and game session is active, don't start a new one
    if (currentPlayer && gameSessionActive) {
        console.log(`Game session already active for player ${currentPlayer.id}`);
        return;
    }

    console.log(`Processing player scan with card ID: ${cardId}`);

    // Call the API to get player data
    const playerData = await findPlayerByCardId(cardId);

    if (playerData && playerData.id) {
        currentPlayer = playerData;
        console.log(`Player identified: ${currentPlayer.id}`);

        // Queue up the intro audio sequence
        queueAudio(MUSIC_FILES['intro_reminder']);
        // queueAudio(MUSIC_FILES['tony_intro']);

        // Start a new game session when the intro audio finishes
        const checkForAudioCompletion = setInterval(() => {
            if (audioQueue.length === 0 && !isAudioPlaying) {
                clearInterval(checkForAudioCompletion);
                startGameSession();

                // Set a timer to end the game session after 2 minutes
                setTimeout(() => {
                    endGameSession();
                }, GAME_SESSION_DURATION * 1000);
            }
        }, 1000);
    } else {
        const errorMessage = playerData ? "Player found but ID is missing" : "Player not found with that card ID";
        console.log(errorMessage);
    }
}

// Function to handle card detection
function handleCardDetection(readerId, uid) {
    const currentTime = Date.now() / 1000; // Current time in seconds

    console.log(`Detected on Reader ${readerId} - UID: ${uid}`);

    // Update reader state
    readerStates[readerId].lastTime = currentTime;
    readerStates[readerId].active = true;
    readerStates[readerId].uid = uid;

    // Special handling for Reader 4 - Player identification
    if (readerId === '4') {
        handlePlayerScan(uid);
        return;
    }

    // For readers 1-3, only handle during active game session
    if (!gameSessionActive) {
        console.log(`Reader ${readerId} scan ignored - no active game session`);
        return;
    }

    // ALWAYS stop current audio when a new card is detected on any reader
    if (isAudioPlaying) {
        console.log(`New card detected on Reader ${readerId} - stopping current audio from Reader ${currentActiveReader}`);
        clearAudioQueue();
        stopAudio();
    }

    // Always switch to the new reader when a card is detected
    console.log(`Switching playback to Reader ${readerId}`);
    if (playMusicForReader(readerId, uid)) {
        currentActiveReader = readerId;
        lastSwitchTime = currentTime;
    }
}

// New function to play session end sound with better compatibility
function playSessionEndSound() {
    const sessionEndFile = MUSIC_FILES['session_end'];

    console.log(`Attempting to play session end sound: ${sessionEndFile}`);

    // Try to convert WAV to MP3 if possible (for better compatibility)
    if (process.platform === 'darwin') {
        // For macOS: Try playing directly with afplay first
        try {
            stopAudio(); // Make sure any previous audio is stopped

            console.log("Playing session end sound with afplay");
            const audioProcess = spawn('afplay', [sessionEndFile]);

            audioProcess.stderr.on('data', (data) => {
                console.error(`Session end audio stderr: ${data}`);

                // If afplay fails, try alternative approach
                if (data.toString().includes('Error')) {
                    console.log("afplay failed, trying alternative player...");

                    // Try using the 'play' command from SoX as an alternative
                    exec('which play', (error, stdout) => {
                        if (!error && stdout.trim()) {
                            console.log("Using 'play' command for session end sound");
                            const altProcess = spawn('play', [sessionEndFile]);
                            currentAudioProcess = altProcess;
                            isAudioPlaying = true;
                        } else {
                            // If neither works, try a system alert sound
                            console.log("Using system 'say' command as last resort");
                            exec('say "Game session ended"');
                        }
                    });
                }
            });

            audioProcess.on('close', (code) => {
                console.log(`Session end sound playback ended with code ${code}`);
                isAudioPlaying = false;
                currentAudioProcess = null;
            });

            currentAudioProcess = audioProcess;
            isAudioPlaying = true;

        } catch (error) {
            console.error(`Error playing session end sound: ${error.message}`);
            // Fallback to system notification
            exec('say "Game session ended"');
        }
    } else if (process.platform === 'win32') {
        // Windows fallback to PowerShell alert
        try {
            const audioProcess = spawn('powershell', [
                '-c',
                `(New-Object Media.SoundPlayer "${sessionEndFile}").PlaySync()`
            ]);
            currentAudioProcess = audioProcess;
            isAudioPlaying = true;
        } catch (error) {
            console.error(`Error playing session end sound: ${error.message}`);
            // Try PowerShell beep as fallback
            exec('powershell -c "[Console]::Beep(800,1000)"');
        }
    } else {
        // Linux fallback
        try {
            const audioProcess = spawn('aplay', [sessionEndFile]);
            currentAudioProcess = audioProcess;
            isAudioPlaying = true;
        } catch (error) {
            console.error(`Error playing session end sound: ${error.message}`);
            // Try system bell on Linux
            process.stdout.write('\x07');
        }
    }
}

// Set up Serial port connection
console.log(`Opening serial port: ${SERIAL_PORT} at ${BAUD_RATE} baud`);
const port = new SerialPort({
    path: SERIAL_PORT,
    baudRate: BAUD_RATE
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.on('open', () => {
    console.log('Serial port opened');
    console.log('Waiting for RFID events...');
});

// Process serial data
parser.on('data', (data) => {
    // Parse the serial data from the ESP32
    console.log('Raw data:', data);

    try {
        // Parse JSON data from the ESP32
        const jsonData = JSON.parse(data);
        console.log('Parsed JSON:', jsonData);

        // Check if this is from our target device
        if (jsonData.deviceId === "esp32-003") {
            const readerId = jsonData.readerId.toString();
            console.log(`Processing event from device esp32-003, reader ${readerId}`);

            // Handle card detection
            if (jsonData.type === "rfid_scan") {
                console.log(`RFID scan detected on reader ${readerId} with card ID ${jsonData.cardId}`);
                const cardId = jsonData.cardId;
                handleCardDetection(readerId, cardId);
                return;
            }

            // Handle card removal - this is the ONLY place we stop audio based on card removal
            if (jsonData.type === "rfid_removal") {
                console.log(`RFID removal detected on reader ${readerId}`);
                handleCardRemoval(readerId);
                return;
            }
        } else {
            console.log(`Ignoring message from unknown device: ${jsonData.deviceId}`);
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

port.on('error', (error) => {
    console.error('Serial port error:', error);
});

// Main loop to check for card states and game session timer
let lastTimerLogTime = 0;
const TIMER_LOG_INTERVAL = 5; // Only log timer every 5 seconds

setInterval(() => {
    const currentTime = Date.now() / 1000; // Current time in seconds

    // Update reader states based on timeouts, but DON'T stop audio
    for (const [readerId, state] of Object.entries(readerStates)) {
        if (state.active && (currentTime - state.lastTime) > CARD_REMOVAL_THRESHOLD) {
            console.log(`Reader ${readerId} - Card timeout detected (no updates for ${Math.round(currentTime - state.lastTime)}s), marking inactive but NOT stopping audio`);

            // Mark as inactive but don't call handleCardRemoval which would stop audio
            state.active = false;

            // Only log this once per timeout
            state.lastTime = currentTime;
        }
    }

    // Check if game session has timed out
    if (gameSessionActive) {
        const remainingSeconds = Math.max(0, Math.round(gameSessionEndTime - currentTime));

        // Only log time every TIMER_LOG_INTERVAL seconds to avoid flooding the console
        if (currentTime - lastTimerLogTime >= TIMER_LOG_INTERVAL) {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            console.log(`Game session remaining time: ${minutes}:${seconds.toString().padStart(2, '0')} (${remainingSeconds} seconds)`);
            lastTimerLogTime = currentTime;
        }

        if (currentTime >= gameSessionEndTime) {
            console.log("Game session time limit reached");

            // Force end the game session which will stop all readers and audio
            endGameSession();
        }
    }

    // Keep track of the current state by checking for any active readers
    // This is just for logging/debugging and doesn't affect audio playback
    const anyActive = Object.values(readerStates).some(state => state.active);
    if (!anyActive && currentActiveReader !== null) {
        // Removed noisy logging
        // console.log(`No active readers detected, but waiting for explicit removal event before stopping audio`);
    }
}, LOOP_DELAY);

// Handle program termination
process.on('SIGINT', () => {
    console.log("Program terminated by user.");

    // Stop any playing audio
    stopAudio();

    // If a game session is active, end it and save the data
    if (gameSessionActive) {
        endGameSession();
    }

    // Close the serial port connection
    port.close();

    // Give a moment for cleanup before exiting
    setTimeout(() => {
        process.exit(0);
    }, 200);
});