# Breaking News Leaderboard

A React application that displays a leaderboard of news articles ranked by view count. The leaderboard updates automatically every minute.

## Features

- Auto-updating leaderboard that refreshes every minute
- Displays top reporters ranked by article views
- Auto-scrolling functionality with pause/resume control
- Update logs showing data refresh history
- Responsive design for various screen sizes

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:

   ```
   git clone [repository-url]
   cd breaking-news-leaderboard
   ```

2. Install dependencies:

   ```
   npm install
   ```

   or

   ```
   yarn install
   ```

3. Configure environment variables:

   Create a `.env` file in the root directory with the following variables:

   ```
   REACT_APP_API_BASE_URL=https://x26n-hsrb-jurx.n7d.xano.io/api:uO-MKMoA
   REACT_APP_FETCH_INTERVAL=60000
   ```

### Running Locally

Start the development server:

```
npm start
```

or

```
yarn start
```

The application will be available at http://localhost:3000

### Building for Production

Build the application for production:

```
npm run build
```

or

```
yarn build
```

This creates a `build` directory with optimized production files.

## Deployment

### Deploying to Vercel

This project is configured for easy deployment to Vercel.

1. Install Vercel CLI:

   ```
   npm install -g vercel
   ```

2. Login to Vercel:

   ```
   vercel login
   ```

3. Deploy:
   ```
   vercel
   ```

For production deployment:

```
vercel --prod
```

### Environment Variables on Vercel

Make sure to configure the same environment variables on Vercel that you have in your `.env` file:

- `REACT_APP_API_BASE_URL`: The base URL for the API
- `REACT_APP_FETCH_INTERVAL`: Refresh interval in milliseconds

## API Integration

The application integrates with a Xano backend API. The leaderboard data is fetched from the `/fetchLeaderboard` endpoint.

## Project Structure

- `src/components/` - React components
- `src/services/` - API services and utilities
- `src/styles/` - SCSS stylesheets
- `public/` - Static assets

## License

© 2023 Breaking News
