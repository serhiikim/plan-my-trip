import express from 'express';
import { db } from '../services/db.js';
import { generateTravelPlan } from '../services/openai.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  const { planId } = req.params;
  
  if (!planId || !ObjectId.isValid(planId)) {
    return res.status(400).json({ 
      message: 'Invalid plan ID format'
    });
  }
  
  req.validatedPlanId = new ObjectId(planId);
  next();
};
// plan.js
router.get('/itineraries', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const userId = new ObjectId(req.user.userId);

    // Query itineraries directly by userId
    const pipeline = [
      {
        $match: {
          userId  // Match itineraries owned by user
        }
      },
      {
        $sort: { 
          createdAt: -1
        }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'plans',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan'
        }
      },
      {
        $unwind: '$plan'
      },
      {
        $project: {
          '_id': 1,
          'planId': 1,
          'createdAt': 1,
          'totalCost': 1,
          'destination': '$plan.destination',
          'startDate': { 
            $arrayElemAt: ['$dailyPlans.date', 0]
          },
          'endDate': { 
            $arrayElemAt: ['$dailyPlans.date', -1]
          },
          'numberOfDays': { $size: '$dailyPlans' },
          'totalActivities': {
            $reduce: {
              input: '$dailyPlans',
              initialValue: 0,
              in: { 
                $add: ['$$value', { $size: '$$this.activities' }] 
              }
            }
          }
        }
      }
    ];

    const total = await db.collection('itineraries').countDocuments({ userId });
    const itineraries = await db.collection('itineraries').aggregate(pipeline).toArray();

    res.json({
      itineraries,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch itineraries:', error);
    res.status(500).json({ message: 'Failed to fetch itineraries' });
  }
});
// Get plan's itinerary
router.get('/:planId/itinerary', async (req, res) => {
  try {
    const planId = new ObjectId(req.params.planId);
    const userId = new ObjectId(req.user.userId);

    // Find itinerary directly with userId check
    const itinerary = await db.collection('itineraries').findOne({ 
      planId,
      userId
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Get the plan for additional info
    const plan = await db.collection('plans').findOne({ _id: planId });

    res.json({
      status: plan?.status || 'generated',
      plan,
      itinerary
    });
  } catch (error) {
    console.error('Failed to fetch itinerary:', error);
    res.status(500).json({ message: 'Failed to fetch itinerary' });
  }
});

// Generate itinerary for a plan
router.post('/:planId/generate', async (req, res) => {
  try {
    const planId = new ObjectId(req.params.planId);
    const userId = new ObjectId(req.user.userId);

    const plan = await db.collection('plans').findOne({ _id: planId });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Generate new itinerary
    const generatedPlan = await generateTravelPlan(plan);

    // Always store userId in itinerary
    await db.collection('itineraries').insertOne({
      planId,
      userId,  // Store userId as ObjectId
      ...generatedPlan,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update plan status
    await db.collection('plans').updateOne(
      { _id: planId },
      { 
        $set: {
          status: 'generated',
          updatedAt: new Date()
        }
      }
    );

    res.json({ message: 'Itinerary generated successfully' });
  } catch (error) {
    console.error('Failed to generate itinerary:', error);
    res.status(500).json({ message: 'Failed to generate itinerary' });
  }
});

// Regenerate itinerary
router.post('/:planId/regenerate', async (req, res) => {
  try {
    const planId = new ObjectId(req.params.planId);
    const userId = new ObjectId(req.user.userId);
    const { instructions } = req.body;

    // First check if user owns the existing itinerary
    const existingItinerary = await db.collection('itineraries').findOne({ 
      planId,
      userId
    });

    if (!existingItinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    const plan = await db.collection('plans').findOne({ _id: planId });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Delete existing itinerary
    await db.collection('itineraries').deleteOne({ 
      planId,
      userId
    });

    // Generate and store new itinerary with regeneration instructions
    const generatedPlan = await generateTravelPlan({
      ...plan,
      regenerationInstructions: instructions
    });

    await db.collection('itineraries').insertOne({
      planId,
      userId,
      ...generatedPlan,
      regenerationInstructions: instructions || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ 
      message: 'Itinerary regenerated successfully',
      hasInstructions: !!instructions
    });
  } catch (error) {
    console.error('Failed to regenerate itinerary:', error);
    res.status(500).json({ message: 'Failed to regenerate itinerary' });
  }
});

  router.post('/create', async (req, res) => {
    try {
      const userId = req.user.userId;
      const planData = {
        ...req.body,
        userId,
        status: 'pending_generation', // Changed from 'collecting_data'
        createdAt: new Date(),
        updatedAt: new Date()
      };
  
      // Create plan only
      const result = await db.collection('plans').insertOne(planData);
      const planId = result.insertedId;
      
      res.json({ 
        message: 'Travel plan created successfully',
        planId: planId
      });
    } catch (error) {
      console.error('Failed to create plan:', error);
      res.status(500).json({ message: 'Failed to create travel plan' });
    }
  });

export default router;