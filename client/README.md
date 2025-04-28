# Plan My Trip - Client Application

This is the client-side application for the Plan My Trip project, built with React and Vite.

## Features

- Modern React application with Vite as the build tool
- Google Maps integration for location services
- Mapbox/MapLibre GL for interactive maps
- Tailwind CSS for styling
- React Query for data fetching
- Beautiful drag-and-drop functionality
- Date picker and calendar components
- Toast notifications
- Google OAuth integration
- Responsive design

## Prerequisites

- Node.js (v20 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository
2. Navigate to the client directory:
   ```bash
   cd client
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables

The application requires the following environment variables:

- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID
- `VITE_API_URL`: Backend API URL
- `VITE_TARGOMO_API_KEY`: Targomo API key for location services

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint to check code quality

## Docker Deployment

The application can be deployed using Docker. Build the image with:

```bash
docker build --build-arg VITE_GOOGLE_CLIENT_ID=your_client_id \
             --build-arg VITE_API_URL=your_api_url \
             --build-arg VITE_TARGOMO_API_KEY=your_targomo_key \
             -t plan-my-trip-client .
```

Run the container:

```bash
docker run -p 4173:4173 plan-my-trip-client
```

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Mapbox GL/MapLibre GL
- React Query
- Radix UI Components
- Framer Motion
- React Router
- ESLint
- Docker

## Project Structure

- `src/`: Source code directory
- `public/`: Static assets
- `dist/`: Production build output
- `node_modules/`: Dependencies
- Configuration files:
  - `vite.config.js`: Vite configuration
  - `tailwind.config.js`: Tailwind CSS configuration
  - `postcss.config.js`: PostCSS configuration
  - `eslint.config.js`: ESLint configuration
  - `Dockerfile`: Docker configuration
