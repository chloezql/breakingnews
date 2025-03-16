const WebSocket = require('ws');
const { exec } = require('child_process');
const path = require('path');

// WebSocket server details
const WS_SERVER = 'wss://breaking-news-ws-server-production.up.railway.app';
const TARGET_DEVICE_ID = 'esp32-003';

// Audio directory path - update this to the correct path
const AUDIO_DIR = path.join(__dirname, 'audio');

// Music file paths
const MUSIC_FILES = {
    'director_correct': path.join(AUDIO_DIR, 'Station3_Director_01.wav'),
    'director_default': path.join(AUDIO_DIR, 'Station3_Director_01A.wav'),
    'football_correct': path.join(AUDIO_DIR, 'Station3_Football_01.wav'),
    'football_default': path.join(AUDIO_DIR, 'Station3_Football_01A.wav'),
    'neighbor_correct': path.join(AUDIO_DIR, 'Station3_Neighbor_01.wav'),
    'neighbor_default': path.join(AUDIO_DIR, 'Station3_Neighbor_01A.wav'),
    'default': path.join(AUDIO_DIR, 'Station3_Neighbor_01A.wav') // Default music for unknown cards
};

// Define correct reader-UID matches and their associated music
const CORRECT_MATCHES = {
    '2|51E98F49': MUSIC_FILES['director_correct'], // Director card on Reader 2
    '3|41EB8F49': MUSIC_FILES['football_correct'], // Football card on Reader 3
    '1|21ED8F49': MUSIC_FILES['neighbor_correct']  // Neighbor card on Reader 1
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

let currentActiveReader = null;
let currentMusicFile = null;
let lastSwitchTime = 0; // Track when we last switched readers
let currentAudioProcess = null;

// Constants for timing - adjusted to match Arduino timing
const CARD_REMOVAL_THRESHOLD = 1.0; // Match Arduino's STABLE_READ_TIME (1000ms)
const DEBOUNCE_THRESHOLD = 0.8; // Match Arduino's DEBOUNCE_DELAY (800ms)
const READER_SWITCH_THRESHOLD = 1.0; // Minimum time between reader switches (1000ms)
const LOOP_DELAY = 100; // Main loop delay (100ms, half of Arduino's 200ms)

// Helper function to determine the appropriate music file for a reader/UID combination
function getMusicFile(reader, uid) {
    const key = `${reader}|${uid}`;
    if (CORRECT_MATCHES[key]) {
        console.log("Correct reader-UID match!");
        return CORRECT_MATCHES[key];
    } else if (UID_DEFAULT_MUSIC[uid]) {
        console.log("Known UID but wrong reader");
        return UID_DEFAULT_MUSIC[uid];
    } else {
        console.log("Unknown UID");
        return MUSIC_FILES['default'];
    }
}

// Play music for the given reader and UID
function playMusicForReader(reader, uid) {
    const musicFile = getMusicFile(reader, uid);

    // Stop any currently playing audio
    if (currentAudioProcess) {
        exec(`kill ${currentAudioProcess.pid}`);
    }

    // Play the audio file using afplay (macOS) or another appropriate player
    // For Windows, you might use 'start' command, for Linux 'aplay' or similar
    const audioProcess = exec(`afplay "${musicFile}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error playing audio: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Audio stderr: ${stderr}`);
            return;
        }
        console.log("Audio playback completed");

        // Reset active reader when audio finishes naturally
        if (currentActiveReader) {
            currentActiveReader = null;
            currentMusicFile = null;
        }
    });

    currentAudioProcess = audioProcess;
    console.log(`Playing: ${musicFile}`);
    return musicFile;
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

// Function to handle card removal
function handleCardRemoval(readerId) {
    const currentTime = Date.now() / 1000; // Current time in seconds

    // Debounce card removal signals
    if ((currentTime - readerStates[readerId].lastRemoval) > DEBOUNCE_THRESHOLD) {
        console.log(`Reader ${readerId} - Card removed`);
        readerStates[readerId].active = false;
        readerStates[readerId].uid = null;
        readerStates[readerId].removalTime = currentTime;
        readerStates[readerId].lastRemoval = currentTime;

        // If this was the current active reader, check if we should switch to another active reader
        if (readerId === currentActiveReader) {
            const mostRecentReader = getMostRecentActiveReader();
            if (mostRecentReader && mostRecentReader !== currentActiveReader) {
                console.log(`Switching to most recent active reader: ${mostRecentReader}`);
                currentMusicFile = playMusicForReader(mostRecentReader, readerStates[mostRecentReader].uid);
                currentActiveReader = mostRecentReader;
                lastSwitchTime = currentTime;
            }
        }
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

    // Check if this should become the active reader
    let shouldSwitch = false;
    if (currentActiveReader === null) {
        shouldSwitch = true;
    } else if (readerId !== currentActiveReader) {
        // Only switch if this is the most recent reader and enough time has passed
        if (currentTime - lastSwitchTime > READER_SWITCH_THRESHOLD) {
            shouldSwitch = true;
            console.log(`Reader switch threshold passed, allowing switch to Reader ${readerId}`);
        }
    }

    if (shouldSwitch) {
        console.log(`Switching playback to Reader ${readerId}`);
        currentMusicFile = playMusicForReader(readerId, uid);
        currentActiveReader = readerId;
        lastSwitchTime = currentTime;
    } else {
        console.log(`Continuous card presence on Reader ${readerId}`);
    }
}

// Set up WebSocket connection
console.log(`Connecting to WebSocket server: ${WS_SERVER}`);
const ws = new WebSocket(WS_SERVER);

ws.on('open', () => {
    console.log('Connected to WebSocket server');
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);

        // Only process messages from our target device
        if (message.deviceId === TARGET_DEVICE_ID) {
            console.log('Received message from target device:', message);

            if (message.type === 'rfid_scan') {
                const readerId = message.readerId.toString();
                const cardId = message.cardId;

                // Handle the card detection
                handleCardDetection(readerId, cardId);
            }
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

ws.on('close', () => {
    console.log('Disconnected from WebSocket server');
    console.log('Attempting to reconnect in 5 seconds...');
    setTimeout(() => {
        console.log('Reconnecting...');
        ws.terminate();
        const newWs = new WebSocket(WS_SERVER);
        ws = newWs;
    }, 5000);
});

// Main loop to check for card removal and manage audio playback
setInterval(() => {
    const currentTime = Date.now() / 1000; // Current time in seconds

    // Check if we should stop music due to card removal
    if (currentActiveReader) {
        const activeState = readerStates[currentActiveReader];
        if (!activeState.active &&
            (currentTime - activeState.removalTime) > CARD_REMOVAL_THRESHOLD) {
            console.log(`Card removed for over ${CARD_REMOVAL_THRESHOLD} seconds, stopping music`);

            // Stop the audio playback
            if (currentAudioProcess) {
                exec(`kill ${currentAudioProcess.pid}`);
                currentAudioProcess = null;
            }

            currentActiveReader = null;
            currentMusicFile = null;
        }
    }

    // Check for card timeouts (simulate card removal for readers that haven't sent updates)
    for (const [readerId, state] of Object.entries(readerStates)) {
        if (state.active && (currentTime - state.lastTime) > CARD_REMOVAL_THRESHOLD) {
            console.log(`Reader ${readerId} - Card timeout (no updates received)`);
            handleCardRemoval(readerId);
        }
    }
}, LOOP_DELAY);

// Handle program termination
process.on('SIGINT', () => {
    console.log("Program terminated by user.");

    // Stop any playing audio
    if (currentAudioProcess) {
        exec(`kill ${currentAudioProcess.pid}`);
    }

    // Close the WebSocket connection
    if (ws.readyState === WebSocket.OPEN) {
        ws.close();
    }

    process.exit(0);
});
