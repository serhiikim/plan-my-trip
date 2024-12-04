import { useState } from 'react';
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import DayTimeline from './DayTimeline';
import MapView from './MapView';

export function PlanContent({ data, onSaveDay }) {
  // State to track which day is currently selected/open
  const [activeDay, setActiveDay] = useState(data.dailyPlans[0]?.date);

  // Get activities for the currently selected day
  const activeDayPlan = data.dailyPlans.find(day => day.date === activeDay);

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Timeline section (3 columns) */}
      <div className="col-span-3 space-y-4">
        <Accordion 
          type="single" 
          defaultValue={data.dailyPlans[0]?.date}
          onValueChange={setActiveDay}
        >
          {data.dailyPlans.map((day, index) => (
            <AccordionItem key={day.date} value={day.date}>
              <AccordionTrigger className="text-lg">
                Day {index + 1} - {new Date(day.date).toLocaleDateString()}
              </AccordionTrigger>
              <AccordionContent>
                <DayTimeline
                  day={{ ...day, planId: data.id }}
                  index={index}
                  onSave={onSaveDay}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Map section (2 columns) */}
      <div className="col-span-2">
        <div className="sticky top-4">
          <Card className="overflow-hidden">
            <MapView 
              dailyPlans={activeDayPlan ? [activeDayPlan] : []}
              highlightedDay={activeDay}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}