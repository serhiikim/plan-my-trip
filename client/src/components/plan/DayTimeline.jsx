import { debounce } from 'lodash';
import React, { useState, useEffect, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { planApi } from '../../services/api';
import { 
  Loader2, 
  MapPin, 
  Clock, 
  Car, 
  Calendar, 
  Banknote, 
  ExternalLink, 
  Plus, 
  X, 
  Save, 
  Edit2, 
  Image as ImageIcon,
  PhoneCall,
  Star 
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export default function DayTimeline({ day, index, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activities, setActivities] = useState(day.activities);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.length < 3) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        const countryCode = activities[0]?.locationData?.addressComponents?.find(
          (component) => component.types.includes('country')
        )?.short_name;

        const results = await planApi.searchPlaces(query, countryCode);
        setSearchResults(results || []);
      } catch (error) {
        console.error('Search failed:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to search places"
        });
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [activities, toast]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateString;
    }
  };

  const ActivitySkeleton = () => (
    <div className="relative pl-8 border-l-2 border-primary/20 animate-pulse">
      <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-primary/20" />
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-muted rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/4" />
        </div>
      </div>
    </div>
  );

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(true);
    debouncedSearch(query);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(activities, index);
      setIsEditing(false);
      // Reload the page after successful save
      window.location.reload();
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save changes"
      });
      setActivities(day.activities);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlace = async (place) => {
    try {
      const placeDetails = await planApi.getPlaceDetails(place.place_id);

      const newActivity = {
        activity: place.name,
        location: placeDetails.placeName,
        locationData: placeDetails,
        imageUrl: `https://source.unsplash.com/80x80/?${encodeURIComponent(place.name)}`
      };

      setActivities([...activities, newActivity]);
      setIsAddingActivity(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add place:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add place"
      });
    }
  };

  const removeActivity = (index) => {
    const newActivities = activities.filter((_, i) => i !== index);
    setActivities(newActivities);
  };

  const ActivityContent = ({ activity }) => {
    const hasPlaceDetails = activity.locationData?.place_details;
    const phoneNumber = hasPlaceDetails?.internationalPhoneNumber || hasPlaceDetails?.nationalPhoneNumber;
    const hasOpeningHours = hasPlaceDetails?.regularOpeningHours?.weekdayDescriptions?.length > 0;
    
    return (
      <div className="flex gap-4">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
          {activity.imageUrl ? (
            <img
              src={activity.imageUrl}
              alt={activity.activity}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>
  
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              {activity.time}
              {activity.duration && <span> ({activity.duration})</span>}
            </span>
          </div>
  
          <h4 className="text-base font-medium mb-2 truncate">{activity.activity}</h4>
  
          <div className="space-y-2">
            {activity.locationData && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground truncate">
                    {activity.locationData.placeName}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
                    {activity.locationData.mapUrl && (
                      <a
                        href={activity.locationData.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View on Maps
                      </a>
                    )}
                    {hasPlaceDetails?.websiteUri && (
                      <a
                        href={hasPlaceDetails.websiteUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
  
            <div className="flex flex-wrap gap-4 text-sm">
              {activity.transportation && (
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate">{activity.transportation}</span>
                </div>
              )}
  
              {activity.cost && (
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{activity.cost}</span>
                </div>
              )}
  
              {phoneNumber && (
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a 
                    href={`tel:${phoneNumber}`} 
                    className="text-muted-foreground hover:text-primary"
                  >
                    {phoneNumber}
                  </a>
                </div>
              )}
            </div>
          </div>
  
          {activity.notes && (
            <div className="mt-3 bg-muted/50 p-2 rounded text-xs text-muted-foreground">
              {activity.notes}
            </div>
          )}
  
          {hasPlaceDetails && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center flex-wrap gap-4">
              {hasPlaceDetails.rating && (
  <div className="flex items-center gap-1.5">
    <GoogleIcon className="h-4 w-4" />
    <span className="font-medium">{hasPlaceDetails.rating}</span>
    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
    <span className="text-sm text-muted-foreground">
      ({hasPlaceDetails.userRatingCount.toLocaleString()})
    </span>
  </div>
)}
                
                {hasOpeningHours && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                      >
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        Opening Hours
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xs">
                      <DialogHeader>
                        <DialogTitle>Opening Hours</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-1.5 pt-3">
                        {hasPlaceDetails.regularOpeningHours.weekdayDescriptions.map((day, index) => (
                          <div 
                            key={index}
                            className="text-sm grid grid-cols-[100px,1fr] gap-2"
                          >
                            <span className="text-muted-foreground">{day.split(': ')[0]}</span>
                            <span>{day.split(': ')[1]}</span>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={day.date}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-6">
                <CardTitle className="text-xl font-semibold">Day {index + 1}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(day.date)}
                </div>
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {day.dailyCost}
                </span>
              </div>
            </div>
          </CardHeader>
          <AccordionContent>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-muted-foreground">
                  {activities.length} {activities.length === 1 ? 'Activity' : 'Activities'}
                </h3>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setActivities(day.activities);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Day
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {isLoading ? (
                  <>
                    <ActivitySkeleton />
                    <ActivitySkeleton />
                  </>
                ) : (
                  activities.map((activity, idx) => (
                    <div
                      key={`activity-${day.date}-${idx}`}
                      className="relative pl-8 border-l-2 border-primary/20 group"
                    >
                      <div className="absolute -left-[11px] top-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-foreground">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="relative">
                        {isEditing && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={() => removeActivity(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <ActivityContent activity={activity} />
                      </div>
                    </div>
                  ))
                )}

                {isEditing && !isLoading && (
                  <Dialog open={isAddingActivity} onOpenChange={setIsAddingActivity}>
                    <Button
                      variant="outline"
                      className="w-full py-6 border-dashed hover:border-primary hover:bg-primary/5"
                      onClick={() => setIsAddingActivity(true)}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add New Activity
                    </Button>

                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add New Activity</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="relative">
                          <Input
                            placeholder="Search for a place..."
                            value={searchQuery}
                            onChange={handleSearch}
                            disabled={isLoading}
                            className="pl-10"
                          />
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {searchResults.length > 0 && (
                          <div className="max-h-[400px] overflow-y-auto space-y-2">
                            {searchResults.map((place) => (
                              <Button
                                key={place.place_id}
                                variant="ghost"
                                className="w-full justify-start text-left hover:bg-accent p-3 h-auto"
                                onClick={() => handleSelectPlace(place)}
                                disabled={isLoading}
                              >
                                <div className="flex flex-col items-start gap-1">
                                  <span className="font-medium">{place.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {place.formatted_address}
                                  </span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}

                        {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                          <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                              <MapPin className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              No places found for "{searchQuery}"
                            </p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}