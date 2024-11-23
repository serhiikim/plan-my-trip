import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Car } from 'lucide-react';
import { ActivityDialog } from './ActivityDialog';

export default function DayTimeline({ day }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={day.date}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AccordionTrigger className="hover:no-underline">
              <CardTitle className="text-xl">{day.date}</CardTitle>
            </AccordionTrigger>
            <span className="text-muted-foreground">Daily Budget: {day.dailyCost}</span>
          </CardHeader>
          <AccordionContent>
            <CardContent>
              <div className="space-y-4">
                {day.activities.map((activity, index) => (
                  <div key={index} className="relative pl-4 border-l-2 border-primary">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {activity.time}
                          <span className="text-sm text-muted-foreground">
                            ({activity.duration})
                          </span>
                        </div>
                        <ActivityDialog activity={activity} />
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {activity.location}
                        </div>
                        {activity.transportation && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            {activity.transportation}
                          </div>
                        )}
                      </div>
                      <div className="text-muted-foreground">{activity.cost}</div>
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