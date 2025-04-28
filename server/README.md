# Plan My Trip - Server Application

This is the backend server for the Plan My Trip project, built with Node.js and Express.

## Features

- RESTful API architecture
- MongoDB database integration
- Google Maps services integration
- OpenAI integration for chat functionality
- JWT-based authentication
- CORS support
- Health check endpoint
- Error handling middleware
- Graceful shutdown handling

## API Endpoints

The server exposes the following API routes under `/api`:

- `/auth`: Authentication endpoints
- `/chat`: Chat-related endpoints (protected)
- `/plans`: Trip planning endpoints (protected)
- `/places`: Places and location endpoints (protected)
- `/health`: Health check endpoint

## Prerequisites

- Node.js (v20 or higher)
- npm (comes with Node.js)
- MongoDB database
- Google Maps API key
- OpenAI API key

## Installation

1. Clone the repository
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```
PORT=3003
MONGODB_URI=your_mongodb_connection_string
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
```

## Available Scripts

- `npm start`: Start the server in production mode
- `npm run dev`: Start the server in development mode with hot reloading
- `npm run migrate`: Run database migrations

## Docker Deployment

The server can be deployed using Docker. Build the image with:

```bash
docker build -t plan-my-trip-server .
```

Run the container:

```bash
docker run -p 3003:3003 \
  -e MONGODB_URI=your_mongodb_connection_string \
  -e GOOGLE_MAPS_API_KEY=your_google_maps_api_key \
  -e OPENAI_API_KEY=your_openai_api_key \
  -e JWT_SECRET=your_jwt_secret \
  plan-my-trip-server
```

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Google Maps Services
- OpenAI API
- JWT Authentication
- CORS
- Docker

## Project Structure

- `src/`: Source code directory
  - `app.js`: Main application file
  - `routes/`: API route handlers
  - `services/`: Service layer (database, external APIs)
  - `middleware/`: Custom middleware
  - `scripts/`: Utility scripts (e.g., migrations)
- `node_modules/`: Dependencies
- `Dockerfile`: Docker configuration

## Error Handling

The server includes comprehensive error handling:
- All errors are logged to the console
- Production errors return a generic message
- Development errors include detailed error information
- Graceful shutdown handling for database connections

## Security

- JWT-based authentication for protected routes
- CORS configuration for cross-origin requests
- Environment variables for sensitive data
- Protected API endpoints 