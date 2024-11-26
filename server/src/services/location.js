import axios from 'axios';
import { ObjectId } from 'mongodb';
import { db } from './db.js';

class LocationService {
  constructor(dbService) {
    this.db = dbService;
  }

  async getCachedLocations(locations, cityContext) {
    return this.db.collection('location_cache')
      .find({ 
        location: { $in: locations.map(l => l.location) },
        cityContext 
      })
      .toArray();
  }

  async enrichPlanWithLocations(planData, originalPlan = null) {
    try {
      // Determine if we're processing a new generated plan or an existing itinerary
      const isExistingItinerary = !!planData.planId;
      const planId = isExistingItinerary ? planData.planId : originalPlan._id;

      console.log('Starting location enrichment:', {
        isExistingItinerary,
        planId
      });
      
      // Get the plan for destination info if needed
      let plan = originalPlan;
      if (!plan) {
        plan = await this.db.collection('plans').findOne({ 
          _id: new ObjectId(planId)
        });
      }

      if (!plan) {
        console.error('Could not find plan:', planId);
        return planData;
      }

      console.log('Found plan:', {
        planId: plan._id,
        destination: plan.destination
      });

      // Extract unique locations
      const locationSet = new Set();
      planData.dailyPlans.forEach(day => {
        day.activities.forEach(activity => {
          if (activity.location) {
            locationSet.add(activity.location);
          }
        });
      });

      const locations = [...locationSet].map(location => ({ location }));
      const cityContext = plan.destination;

      console.log('Processing locations:', {
        locationCount: locations.length,
        cityContext
      });

      if (!cityContext || locations.length === 0) {
        console.log('No locations to process or missing city context');
        return planData;
      }

      // Check cache first
      const cachedLocations = await this.getCachedLocations(locations, cityContext);
      console.log('Found cached locations:', cachedLocations.length);

      const cachedLocationMap = cachedLocations.reduce((acc, loc) => {
        acc[loc.location] = loc;
        return acc;
      }, {});

      // Process uncached locations
      const uncachedLocations = locations.filter(
        loc => !cachedLocationMap[loc.location]
      );

      console.log('Uncached locations to process:', uncachedLocations.length);

      if (uncachedLocations.length > 0) {
        for (const location of uncachedLocations) {
          try {
            const query = encodeURIComponent(`${location.location}, ${cityContext}`);
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`;
            
            const response = await axios({
              method: 'get',
              url: url,
              params: {
                access_token: process.env.MAPBOX_ACCESS_TOKEN,
                limit: 1,
                types: 'poi,address'
              }
            });

            if (response.data?.features?.[0]) {
              const feature = response.data.features[0];
              const [longitude, latitude] = feature.center;

              const locationData = {
                location: location.location,
                cityContext,
                coordinates: [latitude, longitude],
                placeName: feature.place_name,
                mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
                updatedAt: new Date()
              };

              await this.db.collection('location_cache').updateOne(
                { 
                  location: location.location,
                  cityContext 
                },
                { $set: locationData },
                { upsert: true }
              );

              cachedLocationMap[location.location] = locationData;
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Failed to geocode location: ${location.location}`, error.message);
          }
        }
      }

      // Enrich plan with location data
      const enrichedPlan = {
        ...planData,
        dailyPlans: planData.dailyPlans.map(day => ({
          ...day,
          activities: day.activities.map(activity => ({
            ...activity,
            locationData: activity.location ? cachedLocationMap[activity.location] : null
          }))
        }))
      };

      console.log('Location enrichment completed');
      return enrichedPlan;
    } catch (error) {
      console.error('Failed to enrich plan with locations:', error);
      return planData;
    }
  }
}

export const locationService = new LocationService(db);