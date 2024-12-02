import express from 'express';
import { Client } from '@googlemaps/google-maps-services-js';

const router = express.Router();
const client = new Client({});

router.get('/search', async (req, res) => {
  const { query, area, sessionToken } = req.query; 
  
    if (!query || query.length < 3) {
      return res.json({ predictions: [] });
    }
  
    try {
  
      const requestBody = {
        input: query,
        sessionToken,
        ...(area && {
          includedRegionCodes: [area], // Use includedRegionCodes for filtering
        }),
      };
  
      const response = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'suggestions.placePrediction.place,suggestions.placePrediction.structuredFormat',
          },
          body: JSON.stringify(requestBody),
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Places API response error:', errorData);
        throw new Error(`Places API returned status: ${response.status}`);
      }
  
      const data = await response.json();
  
      const predictions = data.suggestions
        .filter(suggestion => suggestion.placePrediction)
        .map(suggestion => ({
          place_id: suggestion.placePrediction.place,
          name: suggestion.placePrediction.structuredFormat.mainText.text,
          formatted_address: suggestion.placePrediction.structuredFormat.secondaryText?.text || '',
        }));
  
      res.json({ predictions });
    } catch (error) {
      console.error('Places API Error:', error);
      res.status(500).json({ 
        message: 'Failed to search places',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });
  
  

  router.get('/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { sessionToken } = req.query;
  
    try {
      const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
      if (sessionToken) {
        url.searchParams.append('sessionToken', sessionToken);
      }

      const response = await fetch(
        url.toString(),
        {
          headers: {
            'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'name,formattedAddress,location,addressComponents,types'
          }
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Places API response error:', errorData);
        throw new Error(`Places API returned status: ${response.status}`);
      }

      const place = await response.json();
      
      const formattedPlace = {
        location: place.name,
        cityContext: place.addressComponents?.find(component => 
          component.types.includes('locality'))?.name,
        coordinates: [
          place.location.latitude,
          place.location.longitude
        ],
        placeName: place.formattedAddress,
        placeId: placeId,
        mapUrl: `https://www.google.com/maps?q=${place.location.latitude},${place.location.longitude}`,
        updatedAt: new Date().toISOString(),
        geocodingProvider: 'google',
        types: place.types,
        addressComponents: place.addressComponents
      };
  
      res.json(formattedPlace);
    } catch (error) {
      console.error('Place details error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch place details', 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }
});

export default router;