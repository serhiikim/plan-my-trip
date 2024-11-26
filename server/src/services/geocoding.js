import axios from 'axios';
import { ObjectId } from 'mongodb';
import { db } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const MAPBOX_API_KEY = process.env.MAPBOX_ACCESS_TOKEN;
const BATCH_SIZE = 100; // Adjust based on your needs

class GeocodingService {
    constructor(dbService) {
        this.db = dbService;
    }

    async processSingleGeocoding(location, cityContext) {
        try {
            const query = encodeURIComponent(`${location}, ${cityContext}`);
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`;
            
            const response = await axios({
                method: 'get',
                url: url,
                params: {
                    access_token: MAPBOX_API_KEY,
                    limit: 1,
                    types: 'poi,address'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Geocoding error for location:', location, error.message);
            return null;
        }
    }

    async processBatchGeocoding(locations, cityContext) {
        console.log(`Processing ${locations.length} locations individually`);
        const results = [];

        for (const location of locations) {
            const result = await this.processSingleGeocoding(location.location, cityContext);
            if (result) {
                results.push(result);
            }
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return results;
    }

    // ... rest of your existing methods remain the same

    async processGeocodingQueue(batchSize = BATCH_SIZE) {
        const pendingItems = await this.db.collection('geocoding_queue')
            .find({ 
                status: 'pending',
                retries: { $lt: 3 }
            })
            .limit(batchSize)
            .toArray();
  
        console.log('Processing queue items:', pendingItems.length);

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
            console.log(`Processing batch for ${city} with ${items.length} items`);
            
            const results = await this.processBatchGeocoding(items, city);
            
            if (!results || results.length === 0) {
                console.log(`Batch failed for ${city}, incrementing retry count`);
                await this.db.collection('geocoding_queue').updateMany(
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
                    
                    console.log(`Processed location: ${items[i].location}`, {
                        coordinates: [latitude, longitude],
                        placeName: feature.place_name
                    });
                    
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
                    await this.db.collection('geocoding_queue').updateOne(
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
                console.log(`Performing ${bulkOps.length} cache updates`);
                try {
                    const result = await this.db.collection('location_cache').bulkWrite(bulkOps);
                    console.log('Cache update result:', result);
                } catch (error) {
                    console.error('Failed to update location cache:', error);
                }
            }
        }
    }
}

// Create and export a single instance
const geocodingService = new GeocodingService(db);
export { geocodingService as geocoding };