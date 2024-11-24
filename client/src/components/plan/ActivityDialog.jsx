import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Car, Calendar, DollarSign } from "lucide-react";

export function ActivityDialog({ activity }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-left h-auto p-2 hover:bg-muted/50">
          <span>{activity.activity}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{activity.activity}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{activity.time} ({activity.duration})</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{activity.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>{activity.cost}</span>
          </div>
          {activity.transportation && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Car className="h-4 w-4" />
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