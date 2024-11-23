// server/src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './services/db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js'; // Add this
import { authMiddleware } from './middleware/auth.js'; // Add this

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/chat', authMiddleware, chatRoutes); // Add this

const PORT = process.env.PORT || 3001;

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