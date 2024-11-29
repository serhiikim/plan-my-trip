import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, MapPin, Car, Banknote, GripHorizontal, Plus, X, Save, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const EditableDayTimeline = ({ day, index, onSave }) => {
  const [activities, setActivities] = useState(day.activities);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [placeResults, setPlaceResults] = useState([]);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateString;
    }
  };

  // Mock function - will be replaced with actual API call
  const searchPlaces = (query) => {
    if (query.length >= 3) {
      // This will be replaced with actual API call
      console.log('Searching for:', query);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(activities);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setActivities(items);
  };

  const removeActivity = (index) => {
    const newActivities = activities.filter((_, i) => i !== index);
    setActivities(newActivities);
  };

  const handleSave = () => {
    onSave({ ...day, activities });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-6">
          <CardTitle className="text-xl">Day {index + 1}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatDate(day.date)}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Daily Budget: {day.dailyCost}
            </span>
          </div>
          <Button onClick={handleSave} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="activities">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-8"
              >
                {activities.map((activity, activityIndex) => (
                  <Draggable
                    key={`${activity.time}-${activity.activity}`}
                    draggableId={`${activity.time}-${activity.activity}`}
                    index={activityIndex}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="relative pl-8 border-l-2 border-primary"
                      >
                        <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-foreground">
                            {activityIndex + 1}
                          </span>
                        </div>

                        <div className="flex justify-between items-start group">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{activity.time}</span>
                              <span>({activity.duration})</span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-medium">{activity.activity}</h4>
                              {activity.notes && (
                                <p className="text-sm text-muted-foreground">{activity.notes}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              {activity.location && (
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{activity.location}</span>
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
                          </div>

                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              {...provided.dragHandleProps}
                            >
                              <GripHorizontal className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeActivity(activityIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Add Activity Button */}
        <Dialog open={isAddingActivity} onOpenChange={setIsAddingActivity}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="mt-8 w-full"
              onClick={() => setIsAddingActivity(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
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
                  searchPlaces(e.target.value);
                }}
              />
              {placeResults.length > 0 && (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {/* Place results will go here */}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EditableDayTimeline;