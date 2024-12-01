import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import { planApi } from '../../services/api';
import { MapPin, Clock, Car, Calendar, Banknote, ExternalLink, Plus, X, Save, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export default function DayTimeline({ day, index, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activities, setActivities] = useState(day.activities);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const invalidActivities = activities.filter(activity => !activity.locationData);
      if (invalidActivities.length > 0) {
        throw new Error('Some activities are missing required location data');
      }

      // Pass activities to parent
      await onSave(activities, index);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save changes"
      });
      // Reset activities to original state on error
      setActivities(day.activities);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateString;
    }
  };

  const ActivitySkeleton = () => (
    <div className="relative pl-8 border-l-2 border-primary animate-pulse">
      <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-primary" />
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
      </div>
    </div>
  );

  const handleSearch = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const countryCode = activities[0]?.locationData?.addressComponents?.find(
        component => component.types.includes('country')
      )?.short_name;

      const results = await planApi.searchPlaces(query, countryCode);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search places"
      });
    }
  };

  const handleSelectPlace = async (place) => {
    try {
      const placeDetails = await planApi.getPlaceDetails(place.place_id);
      
      const newActivity = {
        activity: place.name,
        location: placeDetails.placeName,
        locationData: placeDetails
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

  const ActivityContent = ({ activity }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="font-medium">{activity.time}</span>
        <span>({activity.duration})</span>
      </div>

      <div className="space-y-1">
        <h4 className="text-base font-medium">{activity.activity}</h4>
      </div>

      <div className="space-y-2">
        {activity.locationData && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{activity.locationData.placeName}</span>
            </div>
            {activity.locationData.mapUrl && (
              <a
                href={activity.locationData.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                View on Google Maps
              </a>
            )}
          </div>
        )}
        
        {activity.transportation && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Car className="h-4 w-4" />
            <span>{activity.transportation}</span>
          </div>
        )}

        {activity.cost && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            <span>{activity.cost}</span>
          </div>
        )}
      </div>

      {activity.notes && (
        <div className="bg-muted p-3 rounded-md text-sm">
          {activity.notes}
        </div>
      )}
    </div>
  );

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={day.date}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-6">
                <CardTitle className="text-xl">Day {index + 1}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(day.date)}
                </div>
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Daily Budget: {day.dailyCost}
                </span>
              </div>
              <Button
  variant={isEditing ? "default" : "ghost"}
  size="sm"
  onClick={async () => {
    if (isEditing) {
      try {
        setIsLoading(true);
        await onSave(activities, index);
        setIsEditing(false);
        // After successful save, reload the page
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
    } else {
      setIsEditing(true);
    }
  }}
  disabled={isLoading}
>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Day
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <AccordionContent>
            <CardContent>
              <div className="space-y-8">
                {isLoading ? (
                  <>
                    <ActivitySkeleton />
                    <ActivitySkeleton />
                    <ActivitySkeleton />
                  </>
                ) : (
                  activities.map((activity, idx) => (
                    <div 
                      key={`activity-${day.date}-${idx}`}
                      className="relative pl-8 border-l-2 border-primary group"
                    >
                      <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-foreground">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <ActivityContent activity={activity} />
                        </div>
                        {isEditing && !isLoading && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeActivity(idx)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isEditing && !isLoading && (
                <Dialog open={isAddingActivity} onOpenChange={setIsAddingActivity}>
                  <Button 
                    variant="outline" 
                    className="mt-8 w-full"
                    onClick={() => setIsAddingActivity(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                  
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Activity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        placeholder="Search for a place..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          handleSearch(e.target.value);
                        }}
                      />
                      {searchResults.length > 0 && (
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                          {searchResults.map((place) => (
                            <Button
                              key={place.place_id}
                              variant="ghost"
                              className="w-full justify-start text-left"
                              onClick={() => handleSelectPlace(place)}
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              {place.name}
                              <span className="text-sm text-muted-foreground ml-2">
                                {place.formatted_address}
                              </span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}