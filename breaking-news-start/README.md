# Breaking News - Start Page

This is the start page for the Breaking News interactive investigation game.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

The application will run on http://localhost:3000.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
│   └── StartPage.tsx  # Main start page
├── services/       # Services for game state and navigation
├── types/          # TypeScript type definitions
└── App.tsx         # Main application component
```

## Connecting to Other Game Modules

This is part of a multi-project game. The other modules should be running on:

- Intro: http://localhost:3001
- Evidence Selection: http://localhost:3002
- Witness Selection: http://localhost:3003
- Suspect Interview: http://localhost:3004
- Finale: http://localhost:3005
