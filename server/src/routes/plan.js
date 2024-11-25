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
router.get('/:planId/itinerary', validateObjectId, async (req, res) => {
  try {
    const planId = req.validatedPlanId;
    const userId = new ObjectId(req.user.userId);

    // Find itinerary with userId check
    const itinerary = await db.collection('itineraries').findOne({ 
      planId,
      userId
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Get the plan for additional info
    const plan = await db.collection('plans').findOne({ _id: planId });

    // If coordinates data is missing, enrich the itinerary
    if (!itinerary.dailyPlans[0]?.activities[0]?.locationData) {
      const enrichedItinerary = await locationService.enrichPlanWithLocations(itinerary);
      
      // Update the stored itinerary with location data
      await db.collection('itineraries').updateOne(
        { _id: itinerary._id },
        { $set: { 
          dailyPlans: enrichedItinerary.dailyPlans,
          updatedAt: new Date()
        }}
      );

      res.json({
        status: plan?.status || 'generated',
        plan,
        itinerary: enrichedItinerary
      });
    } else {
      res.json({
        status: plan?.status || 'generated',
        plan,
        itinerary
      });
    }
  } catch (error) {
    console.error('Failed to fetch itinerary:', error);
    res.status(500).json({ message: 'Failed to fetch itinerary' });
  }
});


// Generate itinerary for a plan
router.post('/:planId/generate', validateObjectId, async (req, res) => {
  try {
    const planId = req.validatedPlanId;
    const userId = new ObjectId(req.user.userId);

    // Check if plan exists
    const plan = await db.collection('plans').findOne({ _id: planId });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check if itinerary already exists
    const existingItinerary = await db.collection('itineraries').findOne({ planId });
    if (existingItinerary) {
      return res.status(400).json({ message: 'Itinerary already exists for this plan' });
    }

    // Generate itinerary using OpenAI
    const generatedPlan = await generateTravelPlan(plan);

    // Enrich with location data
    const enrichedPlan = await locationService.enrichPlanWithLocations(generatedPlan);

    // Store the generated itinerary
    const itineraryData = {
      planId,
      userId, // Include userId
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

// Add the locations endpoint
router.get('/locations/:itineraryId', async (req, res) => {
  try {
    const itineraryId = new ObjectId(req.params.itineraryId);

    const queueStatus = await db.collection('geocoding_queue')
      .find({ itineraryId })
      .toArray();

    const locationCache = await db.collection('location_cache')
      .find({ itineraryId })
      .toArray();

    res.json({
      locations: locationCache,
      processingStatus: {
        total: queueStatus.length,
        completed: queueStatus.filter(item => item.status === 'completed').length,
        pending: queueStatus.filter(item => item.status === 'pending').length
      }
    });
  } catch (error) {
    console.error('Failed to fetch location details:', error);
    res.status(500).json({ message: 'Failed to fetch location details' });
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