import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TargomoClient } from '@targomo/core';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const TARGOMO_API_KEY = import.meta.env.VITE_TARGOMO_API_KEY;
const TARGOMO_REGION = 'westcentraleurope';

const MapView = ({ dailyPlans, highlightedDay }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);
    const client = useRef(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
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

        // Get coordinates from the first activity of the first day
        const firstDay = dailyPlans[0];
        const firstActivity = firstDay.activities.find(activity => activity.locationData?.coordinates);

        if (firstActivity?.locationData?.coordinates) {
            const [lat, lng] = firstActivity.locationData.coordinates;
            return { lng, lat, zoom: 13 }; // Increased zoom level for better initial view
        }

        // Fallback if no valid coordinates found
        return { lng: 0, lat: 0, zoom: 2 };
    };

    const updateMarkers = () => {
        if (!map.current || !dailyPlans) {
            console.log('Map or dailyPlans not ready:', { map: !!map.current, dailyPlans: !!dailyPlans });
            return;
        }

        // Find the day that matches the highlightedDay
        const selectedDayPlan = highlightedDay
            ? dailyPlans.find(day => day.date === highlightedDay)
            : dailyPlans[0];

        if (!selectedDayPlan) {
            console.log('No plan found for selected day');
            return;
        }

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        const bounds = new maplibregl.LngLatBounds();
        let hasValidCoordinates = false;

        selectedDayPlan.activities.forEach((activity, activityIndex) => {
            if (activity.locationData?.coordinates) {
                const [lat, lng] = activity.locationData.coordinates;
                const coordinates = [lng, lat];

                const el = document.createElement('div');
                el.style.backgroundColor = '#000000';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.borderRadius = '50%';
                el.style.width = '28px';
                el.style.height = '28px';
                el.style.border = '2px solid #000000';
                el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                el.style.color = '#FFFFFF';
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

                // Clear existing map and markers
                if (map.current) {
                    markersRef.current.forEach((marker) => marker.remove());
                    map.current.remove();
                }

                client.current = new TargomoClient(TARGOMO_REGION, TARGOMO_API_KEY);
                const initialCenter = getInitialMapCenter();

                map.current = new maplibregl.Map({
                    container: mapContainer.current,
                    style: client.current.basemaps.getGLStyleURL('Bright'),
                    center: [initialCenter.lng, initialCenter.lat],
                    zoom: initialCenter.zoom,
                    renderWorldCopies: true,
                    attributionControl: true
                });

                map.current.addControl(
                    new maplibregl.NavigationControl({
                        showCompass: true,
                        showZoom: true,
                    }),
                    'top-right'
                );

                map.current.addControl(
                    new maplibregl.ScaleControl(),
                    'bottom-right'
                );

                map.current.on('load', () => {
                    setIsMapInitialized(true);
                    setIsLoading(false);
                    updateMarkers();
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
        if (map.current && isMapInitialized) {
            updateMarkers();
        }
    }, [highlightedDay, isMapInitialized]);

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="relative w-full h-[calc(100vh-32px)] min-h-[400px]">
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
    );
};

export default MapView;