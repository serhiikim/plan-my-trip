import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Default coordinates for New York City
const DEFAULT_CENTER = [-74.006, 40.7128];

const MapView = ({ dailyPlans }) => {
  const mapContainer = useRef(null);
  const [loading, setLoading] = useState(true);
  const markersRef = useRef([]);
  const mapRef = useRef(null);

  useEffect(() => {
    // Clear container
    if (mapContainer.current) {
      mapContainer.current.innerHTML = '';
    }

    // Load and initialize map
    const initializeMap = async () => {
      if (window.mapboxgl) {
        createMap();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      
      document.head.appendChild(link);
      document.head.appendChild(script);
      
      script.onload = () => {
        createMap();
      };
    };

    const createMap = () => {
      window.mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZ2tpbSIsImEiOiJjbTN4anRjOW0xbTBzMmxzZnRscXh6dmI0In0.XPPo5-1_a4OCkGl7BvOsgg';
      
      const map = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: DEFAULT_CENTER,
        zoom: 12
      });

      map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        setLoading(false);
        mapRef.current = map;
        addMarkers();
      });
    };

    const addMarkers = () => {
      if (!mapRef.current || !window.mapboxgl) return;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Create bounds object
      const bounds = new window.mapboxgl.LngLatBounds();
      let hasValidLocations = false;

      // Collect all locations from all days
      dailyPlans.forEach(day => {
        day.activities.forEach(activity => {
          if (!activity.locationData?.coordinates?.length === 2) return;
          
          const [lat, lng] = activity.locationData.coordinates;
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

          try {
            const lngLat = new window.mapboxgl.LngLat(lng, lat);
            
            // Create marker element
            const markerEl = document.createElement('div');
            markerEl.className = 'flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-medium shadow-lg';
            markerEl.textContent = '📍';

            // Add marker to map
            const marker = new window.mapboxgl.Marker(markerEl)
              .setLngLat(lngLat)
              .setPopup(
                new window.mapboxgl.Popup({
                  offset: 25,
                  closeButton: false,
                  maxWidth: '300px'
                })
                .setHTML(`
                  <div class="p-3">
                    <div class="font-medium">${activity.activity}</div>
                    <div class="text-sm text-muted-foreground mt-1">${activity.time}</div>
                  </div>
                `)
              )
              .addTo(mapRef.current);

            markersRef.current.push(marker);
            bounds.extend(lngLat);
            hasValidLocations = true;
          } catch (error) {
            console.error('Error adding marker:', error);
          }
        });
      });

      // Fit map to bounds if we have valid locations
      if (hasValidLocations) {
        mapRef.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000,
          maxZoom: 15
        });
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [dailyPlans]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div 
            ref={mapContainer} 
            className="h-[400px] w-full bg-muted rounded-lg overflow-hidden"
          />
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MapView;