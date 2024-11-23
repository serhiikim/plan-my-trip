import axios from 'axios';
import { auth } from './auth';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Plan and Itinerary endpoints
export const planApi = {
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
      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('not_found');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch itinerary');
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

  // Regenerate itinerary (new)
  regenerateItinerary: async (planId) => {
    try {
      const { data } = await api.post(`/plans/${planId}/regenerate`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to regenerate itinerary');
    }
  }
};