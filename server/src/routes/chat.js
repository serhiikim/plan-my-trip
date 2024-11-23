// server/src/routes/chat.js
import express from 'express';
import { db } from '../services/db.js';

const router = express.Router();

router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    // Store user message
    await db.createMessage({
      userId,
      content: message,
      type: 'user',
      createdAt: new Date()
    });

    // TODO: Integrate with OpenAI for response
    const response = "Thanks for sharing! Could you tell me more about what kind of activities you enjoy?";

    // Store assistant response
    await db.createMessage({
      userId,
      content: response,
      type: 'assistant',
      createdAt: new Date()
    });

    res.json({ message: response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Failed to process message' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const userId = req.user.userId;
    const messages = await db.getMessages(userId);
    res.json(messages);
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

export default router;