import React, { useState } from 'react';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Banknote, X, Save, Edit2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { planApi } from '../../services/api';

import ActivityContent from '../day-timeline/ActivityContent';
import SearchDialog, { AddActivityButton } from '../day-timeline/SearchDialog';
import { useSearch } from '../day-timeline/hooks';

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

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  } catch (error) {
    console.error('Date parsing error:', error);
    return dateString;
  }
};

export default function DayTimeline({ day, index, onSave, isOpen, onToggle }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activities, setActivities] = useState(day.activities);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    isSearching,
    searchQuery,
    searchResults,
    setSearchQuery,
    setSearchResults,
    handleSearch
  } = useSearch(activities, toast);

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
        imageUrl: null //remove later
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

  return (
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
                  <>
                    <AddActivityButton onClick={() => setIsAddingActivity(true)} />
                    <SearchDialog
                      isOpen={isAddingActivity}
                      onOpenChange={setIsAddingActivity}
                      searchQuery={searchQuery}
                      onSearchChange={handleSearch}
                      isSearching={isSearching}
                      searchResults={searchResults}
                      onPlaceSelect={handleSelectPlace}
                      isLoading={isLoading}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
  );
}