import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Layout } from "@/components/common/Layout";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { PlanLoader } from '@/components/common/PlanLoader';
import { DeletePlanModal } from '@/components/common/modals/DeletePlanModal';
import { RegeneratePlanModal } from '@/components/common/modals/RegeneratePlanModal';
import { PlanHeader } from '@/components/plan/PlanHeader';
import { PlanActions } from '@/components/plan/PlanActions';
import DayTimeline from '@/components/plan/DayTimeline';
import MapView from '@/components/plan/MapView';
import { usePlanData } from '@/hooks/use-plan-data';
import { usePlanActions } from '@/hooks/use-plan-actions';
import { Accordion } from '@/components/ui/accordion';

export default function PlanPage() {
  const { planId } = useParams();
  const location = useLocation();
  const isNewPlan = location.search.includes('new=true');
  const [activeDay, setActiveDay] = useState(null);

  const {
    data,
    loading,
    error,
    isGenerating,
    handleSaveDay,
    loadItinerary
  } = usePlanData(planId, isNewPlan);

  const {
    isRegenerateDialogOpen,
    setIsRegenerateDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    regenerateInstructions,
    setRegenerateInstructions,
    handleDelete,
    handleRegenerate,
    handleExport,
    handleShare,
    handlePrint
  } = usePlanActions(planId, () => {
    setIsGenerating(true);
    setError(null);
    startPolling();
  });

  // Set the first day as active by default
  useEffect(() => {
    if (data?.dailyPlans?.length > 0 && !activeDay) {
      setActiveDay(data.dailyPlans[0].date);
    }
  }, [data]);

  if (loading || isGenerating) {
    return (
      <Layout>
        <PlanLoader isGenerating={isGenerating} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container max-w-4xl">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center gap-2">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadItinerary(true)}
                className="ml-2"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="container max-w-4xl">
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                  <h2 className="text-lg font-semibold mb-2">Initializing Your Travel Plan</h2>
                  <p className="text-muted-foreground">
                    We're setting up your itinerary. This may take a few moments...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <div className="space-y-6">
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <PlanHeader data={data} />
                <PlanActions
                  onExport={handleExport}
                  onShare={handleShare}
                  onPrint={handlePrint}
                  onRegenerateClick={() => setIsRegenerateDialogOpen(true)}
                  onDeleteClick={() => setIsDeleteDialogOpen(true)}
                />
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Timeline section */}
                <div className="lg:col-span-3">
                <Accordion 
    type="single" 
    collapsible 
    className="space-y-4"
    value={activeDay}
    onValueChange={setActiveDay}
  >
    {data.dailyPlans.map((day, index) => (
      <DayTimeline
        key={day.date}
        day={{ ...day, planId }}
        index={index}
        onSave={handleSaveDay}
      />
    ))}
  </Accordion>
                </div>

                <div className="lg:col-span-2">
                  <div className="sticky top-4">
                    <Card>
                      <MapView
                        dailyPlans={data.dailyPlans}
                        highlightedDay={activeDay || (data.dailyPlans[0]?.date)}
                      />
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DeletePlanModal
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDelete}
          />

          <RegeneratePlanModal
            open={isRegenerateDialogOpen}
            onOpenChange={setIsRegenerateDialogOpen}
            instructions={regenerateInstructions}
            onInstructionsChange={setRegenerateInstructions}
            onConfirm={handleRegenerate}
          />
        </div>
      </div>
    </Layout>
  );
}