import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MapView = ({ dailyPlans }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);
    const mapboxgl = useRef(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState('0');
    const [isMapInitialized, setIsMapInitialized] = useState(false);
  
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    };

    // Helper to get initial map center from activities
    const getInitialMapCenter = () => {
      if (!dailyPlans || dailyPlans.length === 0) {
        return { lng: 0, lat: 0, zoom: 2 }; // Default to world view
      }

      // Try to find first activity with coordinates
      for (const day of dailyPlans) {
        for (const activity of day.activities) {
          if (activity.locationData?.coordinates) {
            const [lat, lng] = activity.locationData.coordinates;
            return { lng, lat, zoom: 11 };
          }
        }
      }

      return { lng: 0, lat: 0, zoom: 2 }; // Fallback to world view
    };
  
    const updateMarkers = () => {
      if (!map.current || !mapboxgl.current || !dailyPlans) return;
  
      const selectedDayPlan = dailyPlans[parseInt(selectedDay)];
      if (!selectedDayPlan) return;
  
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
  
      const bounds = new mapboxgl.current.LngLatBounds();
      let hasValidCoordinates = false;
  
      selectedDayPlan.activities.forEach((activity, activityIndex) => {
        if (activity.locationData?.coordinates) {
          const [lat, lng] = activity.locationData.coordinates;
          const coordinates = [lng, lat];
  
          const el = document.createElement('div');
          el.className = 'w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-xl';
          el.style.cursor = 'pointer';
          el.innerHTML = `${activityIndex + 1}`;
  
          const marker = new mapboxgl.current.Marker(el)
            .setLngLat(coordinates)
            .setPopup(
              new mapboxgl.current.Popup({
                offset: 25,
                closeButton: true,
                className: 'custom-popup'
              }).setHTML(`
                <div class="p-3">
                  <div class="font-bold text-sm mb-1">${formatDate(selectedDayPlan.date)} - Stop ${activityIndex + 1}</div>
                  <div class="text-sm">${activity.time}: ${activity.activity}</div>
                  ${activity.locationData.address ? `<div class="text-xs mt-1 text-muted-foreground">${activity.locationData.address}</div>` : ''}
                </div>
              `)
            )
            .addTo(map.current);
  
          markersRef.current.push(marker);
          bounds.extend(coordinates);
          hasValidCoordinates = true;
        }
      });
  
      if (hasValidCoordinates) {
        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000,
          maxZoom: 15,
        });
      }
    };
  
    useEffect(() => {
      const initializeMap = async () => {
        try {
          const mapboxModule = await import('mapbox-gl');
          mapboxgl.current = mapboxModule.default;
          await import('mapbox-gl/dist/mapbox-gl.css');
  
          mapboxgl.current.accessToken = MAPBOX_TOKEN;
  
          if (!mapContainer.current) return;
  
          // Clear any existing map instance
          if (map.current) {
            map.current.remove();
          }

          const initialCenter = getInitialMapCenter();
  
          map.current = new mapboxgl.current.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [initialCenter.lng, initialCenter.lat],
            zoom: initialCenter.zoom,
            attributionControl: false,
            renderWorldCopies: true, // Enable world copies for global navigation
          });
  
          await new Promise((resolve) => map.current.on('load', resolve));
  
          // Add navigation and scale controls
          map.current.addControl(
            new mapboxgl.current.NavigationControl({
              showCompass: true,
              showZoom: true,
            }),
            'top-right'
          );

          map.current.addControl(
            new mapboxgl.current.ScaleControl(),
            'bottom-right'
          );
  
          setIsLoading(false);
          setIsMapInitialized(true);
        } catch (err) {
          console.error('Map initialization error:', err);
          setError(`Failed to load map: ${err.message}`);
          setIsLoading(false);
        }
      };
  
      initializeMap();
  
      return () => {
        if (map.current) {
          markersRef.current.forEach((marker) => marker.remove());
          map.current.remove();
          map.current = null;
        }
      };
    }, []);
  
    useEffect(() => {
      if (isMapInitialized) {
        updateMarkers();
      }
    }, [selectedDay, isMapInitialized, dailyPlans]);
  
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
  
    return (
      <Card className="w-full">
        <Tabs value={selectedDay} onValueChange={setSelectedDay}>
          <TabsList className="w-full h-auto flex-wrap">
            {dailyPlans.map((day, index) => (
              <TabsTrigger 
                key={day.date} 
                value={index.toString()}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {formatDate(day.date)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full h-[500px]">
          <div
            ref={mapContainer}
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              Loading map...
            </div>
          )}
        </div>
      </Card>
    );
  };
  
  export default MapView;