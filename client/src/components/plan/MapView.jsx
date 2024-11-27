import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TargomoClient } from '@targomo/core';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const TARGOMO_API_KEY = import.meta.env.VITE_TARGOMO_API_KEY;
const TARGOMO_REGION = 'westcentraleurope';

const MapView = ({ dailyPlans }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);
    const client = useRef(null);
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

    const getInitialMapCenter = () => {
        if (!dailyPlans || dailyPlans.length === 0) {
            return { lng: 0, lat: 0, zoom: 2 };
        }

        for (const day of dailyPlans) {
            for (const activity of day.activities) {
                if (activity.locationData?.coordinates) {
                    const [lat, lng] = activity.locationData.coordinates;
                    return { lng, lat, zoom: 11 };
                }
            }
        }

        return { lng: 0, lat: 0, zoom: 2 };
    };

    const updateMarkers = () => {
        if (!map.current || !dailyPlans) return;

        const selectedDayPlan = dailyPlans[parseInt(selectedDay)];
        if (!selectedDayPlan) return;

        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        const bounds = new maplibregl.LngLatBounds();
        let hasValidCoordinates = false;

        selectedDayPlan.activities.forEach((activity, activityIndex) => {
            if (activity.locationData?.coordinates) {
                const [lat, lng] = activity.locationData.coordinates;
                const coordinates = [lng, lat];

                const el = document.createElement('div');
el.style.backgroundColor = '#000000';  // Black background
el.style.display = 'flex';
el.style.alignItems = 'center';
el.style.justifyContent = 'center';
el.style.borderRadius = '50%';
el.style.width = '28px';
el.style.height = '28px';
el.style.border = '2px solid #000000';  // Black border
el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
el.style.color = '#FFFFFF';  // White text
el.style.fontWeight = 'bold';
el.style.fontSize = '14px';
el.style.cursor = 'pointer';
el.innerHTML = `${activityIndex + 1}`;

                const marker = new maplibregl.Marker({
                    element: el,
                    anchor: 'center'
                })
                    .setLngLat(coordinates)
                    .setPopup(
                        new maplibregl.Popup({
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
                if (!mapContainer.current) return;

                if (map.current) {
                    map.current.remove();
                }

                client.current = new TargomoClient(TARGOMO_REGION, TARGOMO_API_KEY);
                const initialCenter = getInitialMapCenter();

                map.current = new maplibregl.Map({
                    container: mapContainer.current,
                    style: client.current.basemaps.getGLStyleURL('Light'),
                    center: [initialCenter.lng, initialCenter.lat],
                    zoom: initialCenter.zoom,
                    renderWorldCopies: true,
                    attributionControl: true
                });


                // Add navigation control
                map.current.addControl(
                    new maplibregl.NavigationControl({
                        showCompass: true,
                        showZoom: true,
                    }),
                    'top-right'
                );

                // Add scale control
                map.current.addControl(
                    new maplibregl.ScaleControl(),
                    'bottom-right'
                );

                map.current.on('load', () => {
                    setIsMapInitialized(true);
                    setIsLoading(false);
                });

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