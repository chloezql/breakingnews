# Breaking News Evidence App

This is a React application that connects to a WebSocket server for real-time updates and uses an API for data persistence.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example` and fill in your environment variables:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm start
```

## Deployment to Vercel

This project is configured for easy deployment to Vercel.

### Automatic Deployment

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Vercel will automatically detect the React app configuration
4. Add the environment variables in the Vercel project settings:
   - `REACT_APP_API_BASE_URL`
   - `REACT_APP_WS_URL`

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

## Environment Variables

- `REACT_APP_API_BASE_URL`: The base URL for the API
- `REACT_APP_WS_URL`: The WebSocket server URL

## Build

To create a production build:

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.
