import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { planApi } from '../services/api';

export const usePlanData = (planId, isNewPlan = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const initialLoadRef = useRef(false);
  const pollingRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadItinerary = async () => {
    try {
      const response = await planApi.getItinerary(planId);

      if (response.status === 'generating' || response.status === 'pending_generation') {
        setIsGenerating(true);
        startPolling();
        return;
      }

      if (response.status === 'generated' && response.itinerary) {
        setData(response.itinerary);
        setIsGenerating(false);

        // Clear polling if it exists
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        // Remove new=true from URL
        if (isNewPlan) {
          navigate(`/plans/${planId}`, { replace: true });
        }
      }
    } catch (error) {
      // Only show error if we're not in generating state
      if (!isGenerating) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    // Don't start a new polling interval if one exists
    if (pollingRef.current) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)

    pollingRef.current = setInterval(async () => {
      try {
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsGenerating(false);
          setError("Generation timeout. Please try regenerating.");
          return;
        }

        const response = await planApi.getItinerary(planId);

        switch (response.status) {
          case 'generating':
          case 'pending_generation':
            // Continue polling
            break;

          case 'generated':
            if (response.itinerary?.dailyPlans?.length > 0) {
              setData(response.itinerary);
              setIsGenerating(false);
              clearInterval(pollingRef.current);
              pollingRef.current = null;

              toast({
                title: "Success",
                description: "Your travel plan is ready!"
              });

              if (isNewPlan) {
                navigate(`/plans/${planId}`, { replace: true });
              }
            }
            break;

          case 'error':
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setIsGenerating(false);
            setError(response.errorMessage || "Generation failed");
            break;

          default:
            // Unknown status
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setIsGenerating(false);
            setError("Invalid plan status received");
        }
      } catch (error) {
        // Only stop polling on non-404 errors
        if (!error.message.includes('not_found')) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsGenerating(false);
          setError(error.message);

          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to check plan status"
          });
        }
        // Continue polling on 404s as the backend might not be ready
      }
    }, 5000);
  };

  const handleSaveDay = async (activities, index) => {
    try {
      const updatedDay = await planApi.updateDayActivities(planId, index, activities);

      // Update local state with new data
      const newData = { ...data };
      newData.dailyPlans[index] = {
        ...newData.dailyPlans[index],
        activities: updatedDay.activities || updatedDay
      };
      setData(newData);

      toast({
        title: "Success",
        description: "Day plan updated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update day plan"
      });
      throw error;
    }
  };

  // Initial load effect
  useEffect(() => {
    const initializePage = async () => {
      if (initialLoadRef.current) return; // Prevent double initialization
      initialLoadRef.current = true;

      await loadItinerary();
    };

    initializePage();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [planId]);

  return {
    data,
    loading,
    error,
    isGenerating,
    handleSaveDay,
    loadItinerary
  };
};