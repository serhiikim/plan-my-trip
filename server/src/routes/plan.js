// server/src/routes/plans.js
import express from 'express';
import { db } from '../services/db.js';

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const userId = req.user.userId;
    const planData = {
      ...req.body,
      userId,
      status: 'collecting_data',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('plans').insertOne(planData);
    
    res.json({ 
      message: 'Travel plan data collected successfully',
      planId: result.insertedId 
    });
  } catch (error) {
    console.error('Failed to create plan:', error);
    res.status(500).json({ message: 'Failed to create travel plan' });
  }
});

export default router;