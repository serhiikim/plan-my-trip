import React from 'react';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Car,
  MapPin,
  Banknote,
  ExternalLink,
  Image as ImageIcon,
  PhoneCall,
  Star
} from 'lucide-react';

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

export default ActivityContent;