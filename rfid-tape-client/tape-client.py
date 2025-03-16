import serial
import pygame
import time

# Initialize Pygame mixer for playing sounds
pygame.mixer.init()

# Set up the serial port connection (Update the port name for your Arduino)
SERIAL_PORT = "/dev/cu.usbserial-0001"  # Change this based on your system
BAUD_RATE = 115200  # Ensure this matches your Arduino's baud rate

ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)

# Music file paths
MUSIC_FILES = {
    'director_correct': '/Users/kathy/Downloads/Bounce/Station3_Director_01.wav',
    'director_default': '/Users/kathy/Downloads/Bounce/Station3_Director_01A.wav',
    'football_correct': '/Users/kathy/Downloads/Bounce/Station3_Football_01.wav',
    'football_default': '/Users/kathy/Downloads/Bounce/Station3_Football_01A.wav',
    'neighbor_correct': '/Users/kathy/Downloads/Bounce/Station3_Neighbor_01.wav',
    'neighbor_default': '/Users/kathy/Downloads/Bounce/Station3_Neighbor_01A.wav',
    'default': '/Users/kathy/Downloads/Bounce/Station3_Neighbor_01A.wav'  # Default music for unknown cards
}

# Define correct reader-UID matches and their associated music
CORRECT_MATCHES = {
    ('Reader 2', '51E98F49'): MUSIC_FILES['director_correct'],  # Director card on Reader 2
    ('Reader 3', '41EB8F49'): MUSIC_FILES['football_correct'],  # Football card on Reader 3
    ('Reader 1', '21ED8F49'): MUSIC_FILES['neighbor_correct']   # Neighbor card on Reader 1
}

# Define default music for specific UIDs when on wrong readers
UID_DEFAULT_MUSIC = {
    '51E98F49': MUSIC_FILES['director_default'],  # Director card on wrong reader
    '41EB8F49': MUSIC_FILES['football_default'],  # Football card on wrong reader
    '21ED8F49': MUSIC_FILES['neighbor_default']   # Neighbor card on wrong reader
}

# Track current state and last detection times
reader_states = {
    'Reader 1': {'last_time': 0, 'uid': None, 'active': False, 'removal_time': 0, 'last_removal': 0},
    'Reader 2': {'last_time': 0, 'uid': None, 'active': False, 'removal_time': 0, 'last_removal': 0},
    'Reader 3': {'last_time': 0, 'uid': None, 'active': False, 'removal_time': 0, 'last_removal': 0}
}
current_active_reader = None
current_music_file = None
last_switch_time = 0  # Track when we last switched readers

# Constants for timing - adjusted to match Arduino timing
CARD_REMOVAL_THRESHOLD = 1.0  # Match Arduino's STABLE_READ_TIME (1000ms)
DEBOUNCE_THRESHOLD = 0.8  # Match Arduino's DEBOUNCE_DELAY (800ms)
READER_SWITCH_THRESHOLD = 1.0  # Minimum time between reader switches (1000ms)
LOOP_DELAY = 0.1  # Main loop delay (100ms, half of Arduino's 200ms)

print("Listening for RFID scans...")

def get_music_file(reader, uid):
    """Helper function to determine the appropriate music file for a reader/UID combination"""
    if (reader, uid) in CORRECT_MATCHES:
        music_file = CORRECT_MATCHES[(reader, uid)]
        print("Correct reader-UID match!")
    elif uid in UID_DEFAULT_MUSIC:
        music_file = UID_DEFAULT_MUSIC[uid]
        print("Known UID but wrong reader")
    else:
        music_file = MUSIC_FILES['default']
        print("Unknown UID")
    return music_file

def play_music_for_reader(reader, uid):
    """Play music for the given reader and UID"""
    music_file = get_music_file(reader, uid)
    pygame.mixer.music.stop()
    pygame.mixer.music.load(music_file)
    pygame.mixer.music.play()
    print(f"Playing: {music_file}")
    return music_file

def get_most_recent_active_reader():
    """Get the most recently active reader that still has a card"""
    most_recent_reader = None
    most_recent_time = 0
    
    for reader, state in reader_states.items():
        if state['active'] and state['last_time'] > most_recent_time:
            most_recent_time = state['last_time']
            most_recent_reader = reader
    
    return most_recent_reader

try:
    while True:
        current_time = time.time()
        new_reading_detected = False

        # First priority: Check for new readings
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8').strip()
            
            if "Card removed" in line:
                reader_part = line.split(" - ")[0].strip()
                # Debounce card removal signals
                if (current_time - reader_states[reader_part]['last_removal']) > DEBOUNCE_THRESHOLD:
                    print(f"{reader_part} - Card removed")
                    reader_states[reader_part]['active'] = False
                    reader_states[reader_part]['uid'] = None
                    reader_states[reader_part]['removal_time'] = current_time
                    reader_states[reader_part]['last_removal'] = current_time
                    
                    # If this was the current active reader, check if we should switch to another active reader
                    if reader_part == current_active_reader:
                        most_recent_reader = get_most_recent_active_reader()
                        if most_recent_reader and most_recent_reader != current_active_reader:
                            print(f"Switching to most recent active reader: {most_recent_reader}")
                            current_music_file = play_music_for_reader(most_recent_reader, reader_states[most_recent_reader]['uid'])
                            current_active_reader = most_recent_reader
                            last_switch_time = current_time
                
            elif "Card UID:" in line:
                try:
                    reader_part = line.split("-")[0].strip()
                    uid = line.split(":")[-1].strip()
                    print(f"Detected on {reader_part} - UID: {uid}")

                    # Update reader state
                    reader_states[reader_part]['last_time'] = current_time
                    reader_states[reader_part]['active'] = True
                    reader_states[reader_part]['uid'] = uid

                    # Check if this should become the active reader
                    should_switch = False
                    if current_active_reader is None:
                        should_switch = True
                    elif reader_part != current_active_reader:
                        # Only switch if this is the most recent reader and enough time has passed
                        if current_time - last_switch_time > READER_SWITCH_THRESHOLD:
                            should_switch = True
                            print(f"Reader switch threshold passed, allowing switch to {reader_part}")

                    if should_switch:
                        print(f"Switching playback to {reader_part}")
                        current_music_file = play_music_for_reader(reader_part, uid)
                        current_active_reader = reader_part
                        last_switch_time = current_time
                        new_reading_detected = True
                    else:
                        print(f"Continuous card presence on {reader_part}")

                except IndexError:
                    print("Received malformed data:", line)

        # Second priority: Check if we should stop music due to card removal
        if not new_reading_detected and current_active_reader:
            active_state = reader_states[current_active_reader]
            if (not active_state['active'] and 
                current_time - active_state['removal_time'] > CARD_REMOVAL_THRESHOLD):
                print(f"Card removed for over {CARD_REMOVAL_THRESHOLD} seconds, stopping music")
                pygame.mixer.music.stop()
                current_active_reader = None
                current_music_file = None

        # Check if music has finished playing naturally
        if not pygame.mixer.music.get_busy() and current_active_reader:
            current_active_reader = None
            current_music_file = None

        time.sleep(LOOP_DELAY)  # Add a small sleep to prevent CPU overuse

except KeyboardInterrupt:
    print("Program terminated by user.")
finally:
    ser.close()