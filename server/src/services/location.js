import axios from 'axios';
import { ObjectId } from 'mongodb';
import { db } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

class LocationService {
  constructor(dbService) {
    this.db = dbService;
    this.geocodingEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
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
            // Construct the full address with city context
            const fullAddress = `${location.location}, ${cityContext}`;
            
            const response = await axios({
              method: 'get',
              url: this.geocodingEndpoint,
              params: {
                address: fullAddress,
                key: process.env.GOOGLE_MAPS_API_KEY
              }
            });

            if (response.data?.status === 'OK' && response.data.results?.[0]) {
              const result = response.data.results[0];
              const { lat, lng } = result.geometry.location;

              const locationData = {
                location: location.location,
                cityContext,
                coordinates: [lat, lng],
                placeName: result.formatted_address,
                placeId: result.place_id,
                mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
                updatedAt: new Date(),
                geocodingProvider: 'google'
              };

              // Store additional useful data from Google's response
              if (result.types) {
                locationData.types = result.types;
              }
              
              if (result.address_components) {
                locationData.addressComponents = result.address_components;
              }

              await this.db.collection('location_cache').updateOne(
                { 
                  location: location.location,
                  cityContext 
                },
                { $set: locationData },
                { upsert: true }
              );

              cachedLocationMap[location.location] = locationData;
              
              // Log successful geocoding
              console.log(`Successfully geocoded: ${location.location}`, {
                coordinates: [lat, lng],
                placeId: result.place_id
              });
            } else {
              console.warn(`No results found for location: ${location.location}`, {
                status: response.data.status,
                errorMessage: response.data.error_message
              });
            }

            // Add a delay to respect Google's rate limits
            // Standard plan allows 50 requests per second
            await new Promise(resolve => setTimeout(resolve, 20));
          } catch (error) {
            console.error(`Failed to geocode location: ${location.location}`, {
              error: error.message,
              response: error.response?.data
            });
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