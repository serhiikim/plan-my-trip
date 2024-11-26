import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Car, Calendar, Banknote } from 'lucide-react';
import { ActivityDialog } from './ActivityDialog';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function DayTimeline({ day, index }) {
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateString;
    }
  };

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
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Daily Budget: {day.dailyCost}
              </span>
            </div>
          </CardHeader>
          <AccordionContent>
            <CardContent>
              <div className="space-y-8">
                {day.activities.map((activity, activityIndex) => (
                  <div 
                    key={`${activity.time}-${activity.activity}`} 
                    className="relative pl-8 border-l-2 border-primary"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-foreground">
                        {activityIndex + 1}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Time and Duration */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{activity.time}</span>
                        <span className="text-muted-foreground">({activity.duration})</span>
                      </div>

                      {/* Activity Dialog */}
                      <ActivityDialog 
                        activity={activity}
                        index={activityIndex}
                      />

                      {/* Additional Info */}
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
                  </div>
                ))}
              </div>
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}