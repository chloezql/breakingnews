const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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
let isAudioPlaying = false;
let audioStartTime = 0; // Track when audio playback started
const AUDIO_GRACE_PERIOD = 5.0; // Grace period in seconds after audio starts before allowing interruption

// Constants for timing - adjusted to match Arduino timing
const CARD_REMOVAL_THRESHOLD = 1.0; // Match Arduino's STABLE_READ_TIME (1000ms)
const DEBOUNCE_THRESHOLD = 0.8; // Match Arduino's DEBOUNCE_DELAY (800ms)
const READER_SWITCH_THRESHOLD = 1.0; // Minimum time between reader switches (1000ms)
const LOOP_DELAY = 100; // Main loop delay (100ms, half of Arduino's 200ms)

// Helper function to determine the appropriate music file for a reader/UID combination
function getMusicFile(reader, uid) {
    const key = `${reader}|${uid}`;
    console.log(`Checking key: ${key}`);
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
    const musicFile = getMusicFile(reader, uid);

    // Verify file exists before playing
    if (!fs.existsSync(musicFile)) {
        console.error(`Audio file does not exist: ${musicFile}`);
        return false;
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

            // Reset active reader when audio finishes naturally
            if (currentActiveReader && code === 0) {
                console.log("Audio playback completed naturally");
                currentActiveReader = null;
                currentMusicFile = null;
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

        // If this was the current active reader, check if we should switch to another active reader
        if (readerId === currentActiveReader) {
            console.log(`Active reader ${readerId} card was removed, handling audio change`);
            const mostRecentReader = getMostRecentActiveReader();
            if (mostRecentReader && mostRecentReader !== currentActiveReader) {
                console.log(`Switching to most recent active reader: ${mostRecentReader}`);
                playMusicForReader(mostRecentReader, readerStates[mostRecentReader].uid);
                currentActiveReader = mostRecentReader;
                lastSwitchTime = currentTime;
            } else {
                // No other active readers, stop audio since we received an explicit removal event
                console.log("No other active readers and received removal event, stopping audio");
                stopAudio();
                currentActiveReader = null;
                currentMusicFile = null;
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
        if (playMusicForReader(readerId, uid)) {
            currentActiveReader = readerId;
            lastSwitchTime = currentTime;
        }
    } else {
        console.log(`Continuous card presence on Reader ${readerId}`);
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

// Main loop to check for card states
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

    // Keep track of the current state by checking for any active readers
    // This is just for logging/debugging and doesn't affect audio playback
    const anyActive = Object.values(readerStates).some(state => state.active);
    if (!anyActive && currentActiveReader !== null) {
        console.log(`No active readers detected, but waiting for explicit removal event before stopping audio`);
    }
}, LOOP_DELAY);

// Handle program termination
process.on('SIGINT', () => {
    console.log("Program terminated by user.");

    // Stop any playing audio
    stopAudio();

    // Close the serial port connection
    port.close();

    // Give a moment for cleanup before exiting
    setTimeout(() => {
        process.exit(0);
    }, 200);
});