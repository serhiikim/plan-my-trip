# Plan My Trip

Plan My Trip is an intelligent travel planning application that helps users create personalized travel itineraries with the help of AI. The application combines the power of Google Maps, OpenAI, and custom algorithms to suggest optimal routes, points of interest, and activities based on user preferences.

## Features

- 🗺️ **Interactive Map Interface**: Visualize your trip on an interactive map with Mapbox/MapLibre GL
- 🤖 **AI-Powered Planning**: Get personalized travel recommendations using OpenAI
- 📍 **Smart Location Search**: Find and add points of interest using Google Maps integration
- 📅 **Flexible Itinerary Management**: Drag-and-drop interface for easy trip planning
- 🔐 **Secure Authentication**: Google OAuth integration for seamless login
- 📱 **Responsive Design**: Works seamlessly across desktop and mobile devices
- 🔄 **Real-time Updates**: Instant synchronization of changes across devices

## How It Works

1. **User Authentication**: Users sign in using their Google account
2. **Trip Creation**: Users start by creating a new trip and specifying basic details
3. **AI Assistance**: The system uses OpenAI to suggest activities and points of interest based on:
   - Destination
   - Travel dates
   - User preferences
   - Local events and attractions
4. **Interactive Planning**: Users can:
   - Drag and drop activities to different days
   - Add custom locations
   - Modify suggested itineraries
   - View everything on an interactive map
5. **Optimization**: The system uses Targomo's routing engine to:
   - Optimize daily routes
   - Calculate travel times
   - Suggest the best order of activities

## Architecture

The application follows a modern microservices architecture:

- **Frontend**: React-based client application
  - [Client Documentation](./client/README.md)
- **Backend**: Node.js/Express server
  - [Server Documentation](./server/README.md)

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm
- MongoDB
- Google Maps API key
- OpenAI API key
- Targomo API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/plan-my-trip.git
   cd plan-my-trip
   ```

2. Set up the backend:
   ```bash
   cd server
   npm install
   # Follow server README for environment setup
   ```

3. Set up the frontend:
   ```bash
   cd ../client
   npm install
   # Follow client README for environment setup
   ```

4. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

## Environment Variables

Both client and server require specific environment variables. Please refer to their respective README files for details:
- [Client Environment Variables](./client/README.md#environment-variables)
- [Server Environment Variables](./server/README.md#environment-variables)

## Deployment

The application can be deployed using Docker. Refer to the individual README files for deployment instructions:
- [Client Deployment](./client/README.md#docker-deployment)
- [Server Deployment](./server/README.md#docker-deployment)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Maps Platform
- OpenAI
- Targomo
- Mapbox/MapLibre GL
- All open-source libraries and frameworks used in this project 