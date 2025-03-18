# Breaking News Leaderboard

This is a React application that displays a leaderboard for the Breaking News game.

## Features

- Auto-updating leaderboard that refreshes every minute
- Displays top reporters ranked by article views
- Auto-scrolling functionality with pause/resume control
- Update logs showing data refresh history
- Responsive design for various screen sizes

## Deployment Instructions

### Deploying to Vercel

1. **Create a Vercel Account**

   - If you don't have one already, create an account at [vercel.com](https://vercel.com)

2. **Install Vercel CLI** (optional, for command-line deployment)

   ```
   npm install -g vercel
   ```

3. **Deploy from the Dashboard**

   - Log in to your Vercel account
   - Click "Add New..." > "Project"
   - Import your Git repository or deploy from a local directory
   - Select the "breaking-news-leaderboard" directory
   - Configure the project with these settings:
     - Framework Preset: Create React App
     - Build Command: `npm run build`
     - Output Directory: `build`
     - Install Command: `npm install --legacy-peer-deps`
   - Add Environment Variables:
     - `REACT_APP_API_BASE_URL` = `https://x26n-hsrb-jurx.n7d.xano.io/api:uO-MKMoA`
     - `REACT_APP_FETCH_INTERVAL` = `60000`
   - Click "Deploy"

4. **Deploy using Vercel CLI** (alternative to dashboard)

   - Navigate to the project directory:
     ```
     cd projects/breaking-news-leaderboard
     ```
   - Run the deployment command:
     ```
     vercel
     ```
   - Follow the CLI prompts to complete deployment

5. **Verify Deployment**
   - Once deployment is complete, Vercel will provide a URL
   - Open the URL in your browser to verify the application is working correctly

### Troubleshooting Deployment Issues

If you encounter deployment issues, check the following:

1. **Build Errors**

   - Check Vercel's build logs for specific error messages
   - Ensure all dependencies are properly installed

2. **Environment Variables**

   - Verify that all required environment variables are set correctly in Vercel
   - Double-check that the API_BASE_URL is accessible from the deployed application

3. **API Connections**

   - Confirm that the Xano API endpoint is accessible and responding correctly
   - Test API calls directly using tools like Postman or cURL

4. **CORS Issues**
   - If you see CORS errors, ensure the API is configured to allow requests from your Vercel domain

## Development Setup

To run the project locally:

1. **Install dependencies**

   ```
   npm install --legacy-peer-deps
   ```

2. **Set up environment variables**

   - Create a `.env` file in the project root with:
     ```
     REACT_APP_API_BASE_URL=https://x26n-hsrb-jurx.n7d.xano.io/api:uO-MKMoA
     REACT_APP_FETCH_INTERVAL=60000
     ```

3. **Start the development server**

   ```
   npm start
   ```

4. **Build for production**
   ```
   npm run build
   ```

## Project Structure

- `src/components/` - React components
- `src/services/` - API and utility services
- `src/styles/` - SCSS stylesheets
- `src/types/` - TypeScript type definitions
- `public/` - Static assets

## API Integration

The application connects to a Xano backend API to fetch leaderboard data. The API endpoint is configured via environment variables.

## License

© 2023 Breaking News
