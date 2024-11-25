// server/src/scripts/migrate.js
import { db } from '../services/db.js';
import { ObjectId } from 'mongodb';

const runMigrations = async () => {
  console.log('Starting migrations...');

  try {
    await db.connect();

    // Create indexes
    console.log('Creating indexes...');
    await Promise.all([
      db.collection('plans').createIndex({ userId: 1 }),
      db.collection('itineraries').createIndex({ userId: 1 }),
      db.collection('itineraries').createIndex({ planId: 1 }),
      db.collection('itineraries').createIndex({ userId: 1, planId: 1 })
    ]);

    // Migrate plan userIds
    const plans = await db.collection('plans').find({}).toArray();
    let planCounter = 0;
    
    for (const plan of plans) {
      if (typeof plan.userId === 'string') {
        await db.collection('plans').updateOne(
          { _id: plan._id },
          { $set: { userId: new ObjectId(plan.userId) } }
        );
        planCounter++;
      }
    }

    // Add userId to itineraries
    const itineraries = await db.collection('itineraries').find({
      $or: [
        { userId: { $exists: false } },
        { userId: { $type: "string" } }
      ]
    }).toArray();
    
    let itineraryCounter = 0;
    for (const itinerary of itineraries) {
      const plan = await db.collection('plans').findOne({ 
        _id: new ObjectId(itinerary.planId)
      });
      
      if (plan?.userId) {
        await db.collection('itineraries').updateOne(
          { _id: itinerary._id },
          { $set: { userId: new ObjectId(plan.userId) } }
        );
        itineraryCounter++;
      }
    }

    console.log(`Migration completed: ${planCounter} plans, ${itineraryCounter} itineraries`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();