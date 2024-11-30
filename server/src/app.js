import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './services/db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import plansRoutes from './routes/plan.js';
import { authMiddleware } from './middleware/auth.js';
import placesRoutes from './routes/places.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create API router
const apiRouter = express.Router();

// API Routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/chat', authMiddleware, chatRoutes);
apiRouter.use('/plans', authMiddleware, plansRoutes);
apiRouter.use('/places', authMiddleware, placesRoutes);

// Mount all routes under /api
app.use('/api', apiRouter);

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3003;

// Initialize the database connection and start server
async function startServer() {
  try {
    await db.connect();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at /api/*`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Cleanup on server shutdown
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

async function cleanup() {
  console.log('Cleaning up...');

  // Close database connection
  try {
    await db.client?.close();
  } catch (error) {
    console.error('Error closing database connection:', error);
  }

  process.exit(0);
}

startServer();