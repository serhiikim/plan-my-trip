// server/src/routes/auth.js
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    // Check if user exists in database
    let user = await db.findUser(payload.email);
    
    if (!user) {
      // Create new user if they don't exist
      const result = await db.createUser({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        googleId: payload.sub,
      });
      
      user = {
        _id: result.insertedId,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      };
    } else {
      // Update existing user's information
      await db.updateUser(payload.email, {
        name: payload.name,
        picture: payload.picture,
        lastLogin: new Date()
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
});

export default router;