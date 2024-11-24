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

// Get plan's itinerary
router.get('/:planId/itinerary', async (req, res) => {
  try {
    const itineraryId = new ObjectId(req.params.planId); // This is actually the itinerary ID

    // Find the itinerary first
    const itinerary = await db.collection('itineraries').findOne({ _id: itineraryId });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    const planId = itinerary.planId; // Extract the planId from the itinerary

    // Now find the plan using the extracted planId
    const plan = await db.collection('plans').findOne({ _id: planId });

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
  
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
        plan,
        itinerary,
        status: plan.status
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

    // Store the generated itinerary
    const itineraryData = {
      planId,
      ...generatedPlan,
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
  
      // Get the plan
      const plan = await db.collection('plans').findOne({ _id: planId });
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
  
      // Delete existing itinerary if exists
      await db.collection('itineraries').deleteOne({ planId });
  
      // Generate new itinerary
      const generatedPlan = await generateTravelPlan(plan);
  
      // Store the new itinerary
      await db.collection('itineraries').insertOne({
        planId,
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
  
      res.json({ 
        message: 'Itinerary regenerated successfully'
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
        status: 'collecting_data',
        createdAt: new Date(),
        updatedAt: new Date()
      };
  
      // Create plan
      const result = await db.collection('plans').insertOne(planData);
      const planId = result.insertedId;
  
      // Start OpenAI generation
      try {
        // Get the complete plan data
        const plan = await db.collection('plans').findOne({ _id: planId });
        
        // Generate itinerary using OpenAI
        const generatedPlan = await generateTravelPlan(plan);
  
        // Store the generated itinerary
        await db.collection('itineraries').insertOne({
          planId: planId,
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
      } catch (error) {
        // If OpenAI generation fails, update plan status
        console.error('Failed to generate itinerary:', error);
        await db.collection('plans').updateOne(
          { _id: planId },
          { 
            $set: {
              status: 'error',
              errorMessage: error.message,
              updatedAt: new Date()
            }
          }
        );
      }
      
      res.json({ 
        message: 'Travel plan data collected successfully',
        planId: planId
      });
    } catch (error) {
      console.error('Failed to create plan:', error);
      res.status(500).json({ message: 'Failed to create travel plan' });
    }
  });

export default router;