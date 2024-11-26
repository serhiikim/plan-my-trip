import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2VyZ2tpbSIsImEiOiJjbTN4anRudXcxZWo1MmtyMHB3NHMzaTViIn0.Lum-gkQ9yZRMlhA81_svlQ';

const MapView = ({ dailyPlans }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const navigationControl = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to initialize Mapbox map
  const initializeMap = async () => {
    try {
      const mapboxModule = await import('mapbox-gl');
      const mapboxgl = mapboxModule.default;
      await import('mapbox-gl/dist/mapbox-gl.css');

      mapboxgl.accessToken = MAPBOX_TOKEN;

      if (!mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [114.1694, 22.3193],
        zoom: 11,
        attributionControl: false,
        renderWorldCopies: false,
        maxBounds: new mapboxgl.LngLatBounds(
          [113.835, 22.15],
          [114.434, 22.57]
        ),
      });

      await new Promise((resolve) => map.current.on('load', resolve));

      // Add zoom and compass controls
      if (!navigationControl.current) {
        navigationControl.current = new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
        });
        map.current.addControl(navigationControl.current, 'top-right');
      }
    } catch (err) {
      console.error('Map initialization error:', err);
      setError(`Failed to load map: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Helper function to add markers to the map
  const addMarkers = (mapboxgl, dailyPlans) => {
    if (!map.current) return;

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    dailyPlans.forEach((day, dayIndex) => {
      day.activities.forEach((activity) => {
        if (activity.locationData?.coordinates) {
          const [lat, lng] = activity.locationData.coordinates;
          const coordinates = [lng, lat];

          const el = document.createElement('div');
          el.className =
            'w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-xl';
          el.style.cursor = 'pointer';
          el.innerHTML = `${dayIndex + 1}`;

          const marker = new mapboxgl.Marker(el)
            .setLngLat(coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25, closeButton: true, className: 'custom-popup' }).setHTML(`
                <div class="p-3">
                  <div class="font-bold text-sm mb-1">Day ${dayIndex + 1}</div>
                  <div class="text-sm">${activity.time}: ${activity.activity}</div>
                </div>
              `)
            )
            .addTo(map.current);

          markersRef.current.push(marker);
          bounds.extend(coordinates);
        }
      });
    });

    // Fit map bounds to markers
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000,
        maxZoom: 15,
      });
    }
  };

  useEffect(() => {
    let mapboxgl;

    const loadMap = async () => {
      try {
        if (!map.current) {
          await initializeMap();
        }

        const mapboxModule = await import('mapbox-gl');
        mapboxgl = mapboxModule.default;

        addMarkers(mapboxgl, dailyPlans);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading the map:', err);
        setError(`Failed to load map: ${err.message}`);
        setIsLoading(false);
      }
    };

    loadMap();

    return () => {
      if (map.current) {
        markersRef.current.forEach((marker) => marker.remove());
        map.current.remove();
        map.current = null;
      }
    };
  }, [dailyPlans]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <div className="relative w-full h-[500px]">
        <div
          ref={mapContainer}
          className="absolute inset-0"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>
      {isLoading && <div className="text-center mt-4">Loading map...</div>}
    </Card>
  );
};

export default MapView;
