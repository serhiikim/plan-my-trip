import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar,
  Coins,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/common/Layout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
} from "@/components/ui/card";
import { planApi } from '@/services/api';
import { useToast } from "@/hooks/use-toast";

const ItineraryCard = ({ itinerary, onClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateString;
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>{itinerary.destination || 'Destination not specified'}</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {itinerary.numberOfDays} days
          </span>
        </CardTitle>
        <CardDescription>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Coins className="h-4 w-4" />
                {itinerary.totalCost || 'Cost not specified'}
              </span>
              <span className="text-muted-foreground">
                {itinerary.totalActivities} activities
              </span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export default function ItinerariesPage() {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadItineraries = async (page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await planApi.getItineraries(page);
      setItineraries(response.itineraries);
      setPagination(response.pagination);
    } catch (error) {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load travel plans"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItineraries(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePlanClick = (planId) => {
    navigate(`/plans/${planId}`);
  };

  if (loading && !itineraries.length) {
    return (
      <Layout>
        <div className="container max-w-4xl py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Travel Plans</h1>
          <Button onClick={() => navigate('/chat')}>Create New Plan</Button>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {itineraries.map((itinerary) => (
            <ItineraryCard 
              key={itinerary._id}
              itinerary={itinerary}
              onClick={() => handlePlanClick(itinerary.planId)}
            />
          ))}

          {!loading && !itineraries.length && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No travel plans yet. Create your first plan!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-muted-foreground px-4">
              Page {currentPage} of {pagination.pages}
            </span>

            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === pagination.pages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}