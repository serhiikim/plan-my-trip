// client/src/pages/PlanPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from "@/components/common/Layout";
import { planApi } from '../services/api';
import DayTimeline from '../components/plan/DayTimeline';
import MapView from '../components/plan/MapView';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  MoreVertical, 
  Share2, 
  Printer, 
  RefreshCw,
  FileText,
  Trash2,
} from 'lucide-react';

export default function PlanPage() {
  const { planId } = useParams();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const initialLoadRef = useRef(false);
  const pollingRef = useRef(null);
  const isNewPlan = location.search.includes('new=true');
  const navigate = useNavigate();

  const loadItinerary = async () => {
    try {
      const response = await planApi.getItinerary(planId);
      
      if (response.status === 'generating' || response.status === 'pending_generation') {
        setIsGenerating(true);
        startPolling();
        return;
      }

      if (response.status === 'generated' && response.itinerary) {
        setData(response.itinerary);
        setIsGenerating(false);
        
        // Clear polling if it exists
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        // Remove new=true from URL
        if (isNewPlan) {
          navigate(`/plans/${planId}`, { replace: true });
        }
      }
    } catch (error) {
      // Only show error if we're not in generating state
      if (!isGenerating) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    // Don't start a new polling interval if one exists
    if (pollingRef.current) {
      return;
    }
  
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)
  
    pollingRef.current = setInterval(async () => {
      try {
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsGenerating(false);
          setError("Generation timeout. Please try regenerating.");
          return;
        }
  
        const response = await planApi.getItinerary(planId);
        
        switch (response.status) {
          case 'generating':
          case 'pending_generation':
            // Continue polling
            break;
  
          case 'generated':
            if (response.itinerary?.dailyPlans?.length > 0) {
              setData(response.itinerary);
              setIsGenerating(false);
              clearInterval(pollingRef.current);
              pollingRef.current = null;
              
              toast({
                title: "Success",
                description: "Your travel plan is ready!"
              });
  
              if (isNewPlan) {
                navigate(`/plans/${planId}`, { replace: true }); // Added replace: true
              }
            }
            break;
  
          case 'error':
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setIsGenerating(false);
            setError(response.errorMessage || "Generation failed");
            break;
  
          default:
            // Unknown status
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setIsGenerating(false);
            setError("Invalid plan status received");
        }
      } catch (error) {
        // Only stop polling on non-404 errors
        if (!error.message.includes('not_found')) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsGenerating(false);
          setError(error.message);
          
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to check plan status"
          });
        }
        // Continue polling on 404s as the backend might not be ready
      }
    }, 5000);
  };
  
  const handleDelete = async () => {
    try {
      await planApi.deletePlan(planId);
      toast({
        title: "Success",
        description: "Travel plan deleted successfully"
      });
      navigate('/plan'); // Redirect to plans list
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete plan"
      });
    }
  };
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
    const handleRegenerate = async () => {
      setIsRegenerateDialogOpen(false);
      try {
        setIsGenerating(true);
        setError(null);
        
        toast({
          title: "Regenerating plan",
          description: regenerateInstructions
            ? "Creating new plan with your special requests..."
            : "Please wait while we create your new travel plan..."
        });
  
        await planApi.regenerateItinerary(planId, regenerateInstructions.trim() || null);
        setRegenerateInstructions(''); // Reset instructions
        startPolling();
      } catch (error) {
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        setIsGenerating(false);
      }
    };
  
    const handleExport = async (format) => {
      toast({
        title: "Export feature",
        description: "Coming soon!"
      });
    };
  
    const handleShare = async () => {
      toast({
        title: "Share feature",
        description: "Coming soon!"
      });
    };
  
    const handlePrint = () => {
      window.print();
    };
  
  // Initial load effect
  useEffect(() => {
    const initializePage = async () => {
      if (initialLoadRef.current) return; // Prevent double initialization
      initialLoadRef.current = true;
      
      await loadItinerary();
    };

    initializePage();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [planId]);
  
    if (loading || isGenerating) {
      return (
        <Layout>
          <div className="container max-w-4xl">
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {isGenerating 
                  ? "AI is creating your perfect travel plan..."
                  : "Loading your travel plan..."}
              </p>
            </div>
          </div>
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
      <div className="container max-w-4xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Your Travel Itinerary</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {data?.destination}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsRegenerateDialogOpen(true)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Total Budget: {data?.totalCost}
              </p>
            </CardContent>
          </Card>
  
     
<div className="w-full">
  {data && <MapView dailyPlans={data.dailyPlans} />}
</div>
  
          {/* Timeline View */}
          <div className="space-y-4">
            {data?.dailyPlans.map((day, index) => (
              <DayTimeline 
                key={day.date} 
                day={day} 
                index={index}
              />
            ))}
          </div>
  
          {data?.generalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{data.generalNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Add Delete Dialog */}
           <AlertDialog 
          open={isDeleteDialogOpen} 
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Travel Plan</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this travel plan? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

  
          <AlertDialog 
            open={isRegenerateDialogOpen} 
            onOpenChange={setIsRegenerateDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Regenerate Itinerary</AlertDialogTitle>
                <AlertDialogDescription>
                  This will create a completely new travel plan. Your current itinerary will be replaced.
                </AlertDialogDescription>
              </AlertDialogHeader>
  
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="instructions">Special requests (optional)</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Add any specific preferences or requests for your new itinerary..."
                    value={regenerateInstructions}
                    onChange={(e) => setRegenerateInstructions(e.target.value)}
                    className="h-24 resize-none"
                  />
                </div>
              </div>
  
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setRegenerateInstructions('')}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleRegenerate}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Layout>
    );
  }