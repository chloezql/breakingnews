# Breaking News Finale

A React-based interactive game where players create and publish their own breaking news stories.

## Overview

Breaking News Finale is an interactive web application that simulates the experience of being a news reporter. Players go through four main stages:

1. **Angle Generation**: Create a breaking news story by typing or using speech recognition
2. **Reporter Info**: Add a headline and reporter name to the story
3. **Result**: See the generated news article in a newspaper format
4. **Rating**: Receive feedback and ratings on the story's viral potential, truth factor, and creativity

## Features

- Speech-to-text functionality for story creation
- Interactive newspaper layout
- Word count tracking
- Animated score presentation
- Print functionality for the newspaper
- Persistent game state using localStorage

## Technologies Used

- React
- TypeScript
- SCSS for styling
- Web Speech API for speech recognition

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Create a `.env` file based on `.env.example` and fill in your environment variables:

```bash
cp .env.example .env
```

### Running the Application

```bash
npm start
# or
yarn start
```

The application will be available at http://localhost:3000

## Deployment to Vercel

This project is configured for easy deployment to Vercel.

### Automatic Deployment

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Vercel will automatically detect the React app configuration
4. Add the environment variables in the Vercel project settings:
   - `REACT_APP_API_BASE_URL`
   - `REACT_APP_WS_URL`
   - `REACT_APP_OPENAI_API_KEY`

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

## Project Structure

- `/src`
  - `/components` - Reusable UI components
  - `/context` - React context for game state management
  - `/pages` - Main game pages
  - `/services` - Game state and navigation services
  - `/types` - TypeScript type definitions
  - `/constants` - Game constants and data

## Game Flow

1. Start at the Angle Generation page
2. Create your breaking news story (limited to 90 words)
3. Add a headline and your name as the reporter
4. View your published story in newspaper format
5. Receive ratings and feedback on your story

## License

MIT
