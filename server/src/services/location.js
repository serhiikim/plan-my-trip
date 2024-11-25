import { geocoding } from './geocoding.js';
import { ObjectId } from 'mongodb';
import { db } from './db.js';

class LocationService {
  async enrichPlanWithLocations(plan, itineraryId) {
    try {
      // Extract unique locations and city context from plan
      const locationSet = new Set();
      plan.dailyPlans.forEach(day => {
        day.activities.forEach(activity => {
          if (activity.location) {
            locationSet.add(activity.location);
          }
        });
      });

      const locations = [...locationSet].map(location => ({ location }));
      const cityContext = plan.destination || plan.plan?.destination;

      if (!cityContext) {
        console.warn('No city context found for plan:', plan._id);
        return plan;
      }

      // Check cache first
      const cachedLocations = await geocoding.getCachedLocations(locations, cityContext);
      const cachedLocationMap = cachedLocations.reduce((acc, loc) => {
        acc[loc.location] = loc;
        return acc;
      }, {});

      // Queue uncached locations
      const uncachedLocations = locations.filter(
        loc => !cachedLocationMap[loc.location]
      );

      if (uncachedLocations.length > 0) {
        await geocoding.queueLocationsForGeocoding(
          itineraryId,
          uncachedLocations,
          cityContext
        );
        // Process queue immediately
        await geocoding.processGeocodingQueue();
        
        // Get newly cached locations
        const newlyCached = await geocoding.getCachedLocations(uncachedLocations, cityContext);
        newlyCached.forEach(loc => {
          cachedLocationMap[loc.location] = loc;
        });
      }

      // Enrich plan with location data
      const enrichedPlan = {
        ...plan,
        dailyPlans: plan.dailyPlans.map(day => ({
          ...day,
          activities: day.activities.map(activity => ({
            ...activity,
            locationData: activity.location ? cachedLocationMap[activity.location] : null
          }))
        }))
      };

      return enrichedPlan;
    } catch (error) {
      console.error('Failed to enrich plan with locations:', error);
      return plan; // Return original plan if enrichment fails
    }
  }

  async enrichExistingItinerary(itineraryId) {
    try {
      const itinerary = await db.collection('itineraries').findOne({
        _id: new ObjectId(itineraryId)
      });

      if (!itinerary) {
        throw new Error('Itinerary not found');
      }

      const enrichedItinerary = await this.enrichPlanWithLocations(itinerary, itineraryId);

      // Update the stored itinerary with location data
      await db.collection('itineraries').updateOne(
        { _id: new ObjectId(itineraryId) },
        { 
          $set: { 
            dailyPlans: enrichedItinerary.dailyPlans,
            updatedAt: new Date()
          }
        }
      );

      return enrichedItinerary;
    } catch (error) {
      console.error('Failed to enrich existing itinerary:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();