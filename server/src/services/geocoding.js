import axios from 'axios';
import { ObjectId } from 'mongodb';
import { db } from './db.js';

const MAPBOX_API_KEY = process.env.MAPBOX_ACCESS_TOKEN;
const BATCH_SIZE = 100; // Adjust based on your needs

class GeocodingService {
    async processBatchGeocoding(locations, cityContext) {
      const batch = locations.map(loc => ({
        q: `${loc.location}, ${cityContext}`,
        types: ['poi', 'address'],
        limit: 1
      }));
  
      try {
        const response = await axios.post(
          'https://api.mapbox.com/search/geocode/v6/batch',
          batch,
          {
            params: { access_token: MAPBOX_API_KEY}
          }
        );
        return response.data;
      } catch (error) {
        console.error('Batch geocoding error:', error);
        return null;
      }
    }
  
    async queueLocationsForGeocoding(itineraryId, locations, cityContext) {
      const timestamp = new Date();
      const queueItems = locations.map(location => ({
        itineraryId: new ObjectId(itineraryId),
        location: location.location,
        cityContext,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
        retries: 0
      }));
  
      return db.collection('geocoding_queue').insertMany(queueItems);
    }
  
    async processGeocodingQueue(batchSize = 100) {
      const pendingItems = await db.collection('geocoding_queue')
        .find({ 
          status: 'pending',
          retries: { $lt: 3 }
        })
        .limit(batchSize)
        .toArray();
  
      if (pendingItems.length === 0) return;
  
      // Group by city
      const itemsByCity = {};
      pendingItems.forEach(item => {
        if (!itemsByCity[item.cityContext]) {
          itemsByCity[item.cityContext] = [];
        }
        itemsByCity[item.cityContext].push(item);
      });
  
      for (const [city, items] of Object.entries(itemsByCity)) {
        const results = await this.processBatchGeocoding(items, city);
        
        if (!results) {
          // Handle batch failure
          await db.collection('geocoding_queue').updateMany(
            { _id: { $in: items.map(item => item._id) } },
            { 
              $inc: { retries: 1 },
              $set: { updatedAt: new Date() }
            }
          );
          continue;
        }
  
        const bulkOps = [];
        for (let i = 0; i < items.length; i++) {
          if (results[i]?.features?.[0]) {
            const feature = results[i].features[0];
            const [longitude, latitude] = feature.center;
            
            // Update cache
            bulkOps.push({
              updateOne: {
                filter: { 
                  location: items[i].location,
                  cityContext: city
                },
                update: {
                  $set: {
                    coordinates: [latitude, longitude],
                    placeName: feature.place_name,
                    mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
                    updatedAt: new Date()
                  }
                },
                upsert: true
              }
            });
  
            // Mark as completed in queue
            await db.collection('geocoding_queue').updateOne(
              { _id: items[i]._id },
              { 
                $set: { 
                  status: 'completed',
                  updatedAt: new Date()
                }
              }
            );
          }
        }
  
        if (bulkOps.length > 0) {
          await db.collection('location_cache').bulkWrite(bulkOps);
        }
      }
    }
  
    async getCachedLocations(locations, cityContext) {
      return db.collection('location_cache')
        .find({ 
          location: { $in: locations.map(l => l.location) },
          cityContext 
        })
        .toArray();
    }
  }
  
  // Create and export a single instance
  export const geocoding = new GeocodingService();