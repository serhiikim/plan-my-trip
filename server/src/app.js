// server/src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './services/db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import plansRoutes from './routes/plan.js';  // Add this
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3002',
  credentials: true
}));

app.use(express.json());

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/chat', authMiddleware, chatRoutes);
app.use('/plans', authMiddleware, plansRoutes);  // Add this

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3003;

// Initialize the database connection before starting the server
async function startServer() {
  try {
    await db.connect();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();