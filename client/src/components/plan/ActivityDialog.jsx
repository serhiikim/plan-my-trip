import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Car, DollarSign, ExternalLink } from "lucide-react";

export function ActivityDialog({ activity, index }) {
  const { locationData } = activity;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full px-0 flex items-start justify-between text-left hover:bg-transparent group"
        >
          <div className="space-y-1">
            <h4 className="text-base font-medium group-hover:text-primary transition-colors">
              {activity.activity}
            </h4>
          </div>
          <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{activity.activity}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{activity.time} ({activity.duration})</span>
          </div>
          
          {locationData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{locationData.placeName}</span>
              </div>
              
              {locationData.mapUrl && (
                <a
                  href={locationData.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Google Maps
                </a>
              )}
            </div>
          )}
          
          {activity.cost && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span>{activity.cost}</span>
            </div>
          )}
          
          {activity.transportation && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Car className="h-4 w-4 flex-shrink-0" />
              <span>{activity.transportation}</span>
            </div>
          )}
          
          {activity.notes && (
            <div className="bg-muted p-3 rounded-md text-sm">
              {activity.notes}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}