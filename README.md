# Breaking News Game

A collection of interactive game modules for the Breaking News experience.

## Project Structure

```
breaking-news/
├── projects/
│   ├── breaking-news-evidence/    # Evidence collection module
│   ├── breaking-news-finale/      # Game finale module
│   ├── breaking-news-interview/   # Suspect interview module
│   └── breaking-news-start/       # Game start module
├── deprecated/                    # Old root-level React app
└── readme/                        # Documentation assets
```

## Getting Started

1. Install dependencies for all projects:

   ```bash
   npm run install:all
   ```

2. Start individual modules:
   - Evidence Collection: `npm run start:evidence`
   - Game Finale: `npm run start:finale`
   - Suspect Interview: `npm run start:interview`
   - Game Start: `npm run start:start`

Each module runs on a different port, allowing them to run simultaneously if needed.

## Module Descriptions

### Evidence Collection (breaking-news-evidence)

Module for collecting and managing evidence in the game.

### Game Finale (breaking-news-finale)

The final stage of the game where players conclude their investigation.

### Suspect Interview (breaking-news-interview)

Interactive module for interviewing suspects and gathering information.

### Game Start (breaking-news-start)

The initial module where players begin their investigation.

## Development

Each module is a standalone React application with its own dependencies and configuration. Navigate to individual project directories for specific development instructions.
