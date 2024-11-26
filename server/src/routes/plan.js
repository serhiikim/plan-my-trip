import express from 'express';
import { db } from '../services/db.js';
import { generateTravelPlan } from '../services/openai.js';
import { ObjectId } from 'mongodb';
import { locationService } from '../services/location.js';

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

// In your route handler
router.post('/:itineraryId/reprocess-locations', async (req, res) => {
  try {
    const itineraryId = new ObjectId(req.params.itineraryId);
    
    // Get the itinerary
    const itinerary = await db.collection('itineraries').findOne({ 
      _id: itineraryId 
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    console.log('Found itinerary:', {
      id: itinerary._id,
      planId: itinerary.planId
    });

    const enrichedItinerary = await locationService.enrichPlanWithLocations(itinerary);

    // Update the itinerary with enriched data
    await db.collection('itineraries').updateOne(
      { _id: itineraryId },
      { 
        $set: { 
          dailyPlans: enrichedItinerary.dailyPlans,
          updatedAt: new Date()
        }
      }
    );

    res.json({ 
      message: 'Location enrichment completed',
      itineraryId: itineraryId
    });
  } catch (error) {
    console.error('Failed to reprocess locations:', error);
    res.status(500).json({ message: 'Failed to reprocess locations' });
  }
});

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

    // Find the plan
    const plan = await db.collection('plans').findOne({ _id: planId });

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Convert planId to ObjectId for the itinerary query
    const itinerary = await db.collection('itineraries').findOne({ 
      planId: new ObjectId(planId)
    });

    // Return different responses based on plan status
    if (plan.status === 'error') {
      return res.status(500).json({ 
        message: 'Failed to generate itinerary',
        error: plan.errorMessage 
      });
    }

    if (plan.status === 'collecting_data') {
      return res.status(400).json({ 
        message: 'Plan data is still being collected' 
      });
    }

    if (!itinerary && plan.status === 'generated') {
      return res.status(404).json({ 
        message: 'Itinerary not found' 
      });
    }

    res.json({
      status: plan.status,
      plan,
      itinerary
    });
  } catch (error) {
    console.error('Failed to fetch itinerary:', error);
    res.status(500).json({ message: 'Failed to fetch itinerary' });
  }
});

// Generate itinerary for a plan
router.post('/:planId/generate', validateObjectId, async (req, res) => {
  try {
    const planId = req.validatedPlanId;
    const userId = new ObjectId(req.user.userId); // Get userId

    const plan = await db.collection('plans').findOne({ _id: planId });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const existingItinerary = await db.collection('itineraries').findOne({ planId });
    if (existingItinerary) {
      return res.status(400).json({ message: 'Itinerary already exists for this plan' });
    }

    const generatedPlan = await generateTravelPlan(plan);
    const enrichedPlan = await locationService.enrichPlanWithLocations(generatedPlan, plan);

    const itineraryData = {
      planId,
      userId, // Add userId
      ...enrichedPlan,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('itineraries').insertOne(itineraryData);

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

    res.json({ 
      message: 'Itinerary generated successfully',
      itineraryId: result.insertedId 
    });
  } catch (error) {
    console.error('Failed to generate itinerary:', error);
    
    // Update plan status to error
    await db.collection('plans').updateOne(
      { _id: req.validatedPlanId },
      { 
        $set: {
          status: 'error',
          errorMessage: error.message,
          updatedAt: new Date()
        }
      }
    );

    res.status(500).json({ message: 'Failed to generate itinerary' });
  }
});

// Regenerate itinerary
router.post('/:planId/regenerate', async (req, res) => {
  try {
    const planId = new ObjectId(req.params.planId);
    const userId = new ObjectId(req.user.userId); // Get userId
    const { instructions } = req.body;

    const plan = await db.collection('plans').findOne({ _id: planId });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    await db.collection('itineraries').deleteOne({ planId });

    const planData = {
      ...plan,
      regenerationInstructions: instructions || null
    };

    const generatedPlan = await generateTravelPlan(planData);
    const enrichedPlan = await locationService.enrichPlanWithLocations(generatedPlan, plan);

    await db.collection('itineraries').insertOne({
      planId,
      userId, // Add userId
      ...enrichedPlan,
      regenerationInstructions: instructions || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update plan status
    await db.collection('plans').updateOne(
      { _id: planId },
      { 
        $set: {
          status: 'generated',
          regenerationInstructions: instructions || null,
          updatedAt: new Date()
        }
      }
    );

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
    const userId = new ObjectId(req.user.userId); // Convert to ObjectId
    const planData = {
      ...req.body,
      userId,  // Now it will be stored as ObjectId
      status: 'pending_generation',
      createdAt: new Date(),
      updatedAt: new Date()
    };

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