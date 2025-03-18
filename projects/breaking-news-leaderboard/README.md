# Breaking News Leaderboard

A leaderboard application for the Breaking News game that displays the most viral headlines and their performance metrics.

## Overview

The Breaking News Leaderboard is a React application that displays a leaderboard of breaking news headlines created by players in the Breaking News game. It shows metrics like view counts, trending status, and hashtags associated with each headline.

## Features

- Display a list of headlines ranked by popularity/view count
- Show trending status for each headline
- Display relevant hashtags
- Responsive design for mobile and desktop
- Visual indicators for top performers (medals for top 3)

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm or yarn

### Installation

1. Clone the repository

```
git clone <repository-url>
cd breaking-news-leaderboard
```

2. Install dependencies

```
npm install
```

3. Start the development server

```
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

- `/src/components` - React components
- `/src/styles` - SCSS styling files
- `/src/services` - API communication and services
- `/src/types` - TypeScript type definitions

## Future Enhancements

- Live updating leaderboard with WebSockets
- User authentication to view personal rankings
- Filtering and sorting options
- Detailed view of each headline's performance
- Integration with social media platforms

## License

This project is licensed under the MIT License - see the LICENSE file for details.
