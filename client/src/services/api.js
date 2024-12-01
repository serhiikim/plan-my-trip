import axios from 'axios';
import { auth } from './auth';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const user = auth.getUser();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      auth.logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Plan and Itinerary endpoints
export const planApi = {


  // Search places using Google Places Autocomplete
// Search places using Google Places Autocomplete
searchPlaces: async (query, area) => {
  try {
    const { data } = await api.get('/places/search', {
      params: { 
        query,
        area 
      }
    });
    return data.predictions;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to search places');
  }
},

  // Get detailed place information
// Get detailed place information
getPlaceDetails: async (placeId) => {
  try {
    // Remove the 'places/' prefix if it exists
    const cleanPlaceId = placeId.replace('places/', '');
    const { data } = await api.get(`/places/${cleanPlaceId}`);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch place details');
  }
},

  // Update your DayTimeline component's handleSave function to use this
  updateDayActivities: async (planId, dayIndex, activities) => {
    try {
      // Validate activities have locationData before sending
      const validActivities = activities.every(activity => activity.locationData);
      if (!validActivities) {
        throw new Error('Some activities are missing location data');
      }

      const { data } = await api.put(`/plans/${planId}/days/${dayIndex}/activities`, {
        activities: activities.map(activity => ({
          ...activity,
          // Ensure locationData is explicitly included
          locationData: activity.locationData
        }))
      });
      return data;
    } catch (error) {
      console.error('Activity update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update activities');
    }
  },
  // Generate itinerary for a plan
  generateItinerary: async (planId) => {
    try {
      const { data } = await api.post(`/plans/${planId}/generate`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate itinerary');
    }
  },


  // Get itinerary for a plan
  getItinerary: async (planId) => {
    try {
      const { data } = await api.get(`/plans/${planId}/itinerary`);
      
      // Add explicit status handling
      if (data.plan.status === 'pending_generation') {
        return { status: 'pending_generation' };
      }
      if (data.plan.status === 'generating') {
        return { status: 'generating' };
      }
      if (data.plan.status === 'error') {
        throw new Error(data.plan.errorMessage || 'Generation failed');
      }
      
      return {
        status: data.plan.status,
        itinerary: data.itinerary,
        plan: data.plan
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('not_found');
      }
      throw error;
    }
  },

  // Export itinerary (new)
  exportItinerary: async (planId, format = 'pdf') => {
    try {
      const response = await api.get(`/plans/${planId}/export`, {
        params: { format },
        responseType: 'blob' // Important for file downloads
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to export itinerary');
    }
  },

  // Share itinerary (new)
  shareItinerary: async (planId, shareData) => {
    try {
      const response = await api.post(`/plans/${planId}/share`, shareData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to share itinerary');
    }
  },

  getItineraries: async (page = 1) => {
    try {
      const { data } = await api.get('/plans/itineraries', {
        params: { page }
      });
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch travel plans');
    }
  },

  // Regenerate itinerary (new)
  regenerateItinerary: async (planId, instructions = null) => {
    try {
      const { data } = await api.post(`/plans/${planId}/regenerate`, {
        instructions: instructions
      });
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to regenerate itinerary');
    }
  },

  deletePlan: async (planId) => {
    try {
      const { data } = await api.delete(`/plans/${planId}`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete plan');
    }
  },

  // Delete plan and itinerary from itineraries list
  deleteItinerary: async (itineraryId) => {
    try {
      const { data } = await api.delete(`/plans/itineraries/${itineraryId}`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete itinerary');
    }
  }
};