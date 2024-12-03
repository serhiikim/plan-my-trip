// services/placeDetails.js

async function getPlaceDetails(placeId) {
    try {
      const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
      
      const response = await fetch(url.toString(), {
        headers: {
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'internationalPhoneNumber,nationalPhoneNumber,rating,regularOpeningHours,userRatingCount,websiteUri'
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Places API response error:', errorData);
        throw new Error(`Places API returned status: ${response.status}`);
      }
  
      const placeDetails = await response.json();
      
      return {
        internationalPhoneNumber: placeDetails.internationalPhoneNumber,
        nationalPhoneNumber: placeDetails.nationalPhoneNumber,
        rating: placeDetails.rating,
        regularOpeningHours: placeDetails.regularOpeningHours,
        userRatingCount: placeDetails.userRatingCount,
        websiteUri: placeDetails.websiteUri
      };
    } catch (error) {
      console.error('Failed to fetch place details:', error);
      return null;
    }
  }
  
  async function enrichActivitiesWithPlaceDetails(activities) {
    const enrichedActivities = [];
  
    for (const activity of activities) {
      const enrichedActivity = { ...activity };
      
      // Check if activity has locationData and is a point of interest
      if (
        enrichedActivity.locationData?.types?.includes('point_of_interest') &&
        enrichedActivity.locationData?.placeId
      ) {
        const placeDetails = await getPlaceDetails(enrichedActivity.locationData.placeId);
        if (placeDetails) {
          enrichedActivity.locationData = {
            ...enrichedActivity.locationData,
            place_details: placeDetails
          };
        }
      }
      
      enrichedActivities.push(enrichedActivity);
    }
  
    return enrichedActivities;
  }
  
  export {
    getPlaceDetails,
    enrichActivitiesWithPlaceDetails
  };