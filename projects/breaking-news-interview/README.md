# Breaking News Interview Application

This is an interactive interview simulation application where users can interview suspects in a criminal investigation.

## Project Structure

The project has been reorganized to follow a more modular architecture, making it easier to maintain and extend.

### Component Structure

```
src/
├── components/
│   ├── Interview/
│   │   ├── ChatContainer.tsx      # Displays conversation messages
│   │   ├── DebugInfo.tsx          # Shows debug information
│   │   ├── ErrorDisplay.tsx       # Displays error messages
│   │   ├── SessionTimer.tsx       # Shows countdown timer
│   │   └── SuspectImage.tsx       # Displays suspect images
│   └── common/                    # Shared components
├── hooks/
│   └── interview/
│       ├── useAudioHandling.ts    # Audio playback management
│       └── useInputHandling.ts    # Input field interactions
├── types/
│   └── InterviewTypes.ts          # Shared type definitions
└── pages/
    └── InterviewPageWithRFID.tsx  # Main page component
```

### Component Responsibilities

- **InterviewPageWithRFID**: Main container that orchestrates the overall interview flow
- **ChatContainer**: Handles displaying the conversation between the reporter and suspect
- **DebugInfo**: Displays current state for debugging purposes
- **ErrorDisplay**: Shows error messages in a consistent format
- **SessionTimer**: Displays and manages the countdown timer
- **SuspectImage**: Displays the correct suspect image based on ID

### Custom Hooks

- **useAudioHandling**: Manages audio playback with proper event handling
- **useInputHandling**: Manages input field state and validation logic

## Flow States

The application has four main states:

1. **Pre-Scan**: Initial state waiting for RFID card scan
2. **Post-Scan**: After card scan, waiting for session to start
3. **Interview**: Active interview session with two submodes:
   - **Input Mode**: For entering suspect IDs
   - **Call Mode**: For active conversations with suspects
4. **Ending**: Session conclusion

## Installation and Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Add your OpenAI API key to the `.env` file
5. Start the development server:

```bash
npm start
```

## Deployment to Vercel

This project is configured for easy deployment to Vercel, with special handling for the OpenAI Realtime API Beta package.

### Prerequisites

- A Vercel account
- An OpenAI API key with access to the Realtime API

### Automatic Deployment

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add the following environment variables in the Vercel project settings:
   - `REACT_APP_OPENAI_API_KEY`: Your OpenAI API key
   - `REACT_APP_API_BASE_URL`: The base URL for the API
   - `REACT_APP_WS_URL`: The WebSocket server URL

### Manual Deployment

1. Install the Vercel CLI:

```bash
npm install -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy the project:

```bash
vercel
```

## Usage Instructions

1. Scan your reporter ID card
2. Press 6 to start the interview session
3. Enter a suspect ID followed by a dot (e.g., "7298.")
4. Interview the suspect
5. Press 0 to end the call
6. Repeat steps 3-5 for other suspects
7. Session ends after 5 minutes or when all suspects are interviewed

## Available Suspect IDs

- 7298: Dr. Hart
- 4692: Kevin
- 5746: Lucy

## Development Guidelines

When making changes:

1. Keep components small and focused on a single responsibility
2. Use the existing hooks for audio and input handling
3. Maintain type safety with the shared type definitions
4. Update documentation when adding new features

## Credits

Developed by the Breaking News team.
