// server/src/services/db.js
import { MongoClient } from 'mongodb';

class DatabaseService {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = await MongoClient.connect(process.env.MONGODB_URI);
      this.db = this.client.db('travel_planner'); // Specify database name
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  collection(name) {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db.collection(name);
  }

  async findUser(email) {
    return this.collection('users').findOne({ email });
  }

  async createUser(userData) {
    return this.collection('users').insertOne(userData);
  }

  async updateUser(email, update) {
    return this.collection('users').updateOne(
      { email },
      { $set: update }
    );
  }

  async createMessage(messageData) {
    return this.collection('messages').insertOne(messageData);
  }

  async getMessages(userId) {
    return this.collection('messages')
      .find({ userId })
      .sort({ createdAt: 1 })
      .toArray();
  }
}

// Create and export a single instance
export const db = new DatabaseService();