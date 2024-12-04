import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DayTimeline from './DayTimeline';
import MapView from './MapView';

export function PlanTabs({ data, onSaveDay }) {
  const renderTimeline = () => (
    <div className="space-y-4">
      {data?.dailyPlans.map((day, index) => (
        <div key={day.date} className="relative">
          <DayTimeline
            day={{ ...day, planId: data.id }}
            index={index}
            onSave={onSaveDay}
          />
        </div>
      ))}
    </div>
  );

  return (
    <Tabs defaultValue="timeline" className="w-full">
      <div className="px-6 border-t">
        <TabsList className="w-full justify-start rounded-none h-12 bg-transparent p-0 gap-4">
          <TabsTrigger
            value="timeline"
            className="rounded-none data-[state=active]:border-b-2 border-primary"
          >
            Timeline View
          </TabsTrigger>
          <TabsTrigger
            value="map"
            className="rounded-none data-[state=active]:border-b-2 border-primary"
          >
            Map View
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="timeline" className="mt-6">
        <div className="px-6 pb-6">
          {renderTimeline()}
        </div>
      </TabsContent>

      <TabsContent value="map" className="mt-6">
        <div className="px-6 pb-6">
          <MapView dailyPlans={data.dailyPlans} />
        </div>
      </TabsContent>
    </Tabs>
  );
}