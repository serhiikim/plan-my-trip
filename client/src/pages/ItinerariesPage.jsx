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
  Trash2,
  Plus,
  Plane
} from "lucide-react";
import { Layout } from "@/components/common/Layout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
} from "@/components/ui/card";
import { planApi } from '@/services/api';
import { useToast } from "@/hooks/use-toast";

const DeleteConfirmDialog = ({ open, onOpenChange, onConfirm, destination }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Travel Plan</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete your travel plan for {destination}? This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirm}
          className="bg-destructive hover:bg-destructive/90"
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const ItineraryCard = ({ itinerary, onClick, onDelete }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateString;
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleteDialogOpen(false);
    await onDelete(itinerary._id);
  };

  return (
    <>
      <Card 
        className="cursor-pointer transition-all duration-200 group hover:ring-2 hover:ring-primary/20 hover:shadow-lg"
        onClick={onClick}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  {itinerary.destination || 'Destination not specified'}
                </CardTitle>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {formatDate(itinerary.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Coins className="h-4 w-4" />
                    <span className="text-sm">
                      {itinerary.totalCost || 'Cost not specified'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {formatDate(itinerary.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <Plane className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {itinerary.totalActivities} activities
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                {itinerary.numberOfDays} days
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        destination={itinerary.destination}
      />
    </>
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

  const handleDelete = async (itineraryId) => {
    try {
      await planApi.deleteItinerary(itineraryId);
      toast({
        title: "Success",
        description: "Travel plan deleted successfully"
      });
      // Reload current page
      loadItineraries(currentPage);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete travel plan"
      });
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
      <div className="container py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Travel Plans</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view all your upcoming trips
            </p>
          </div>
          <Button onClick={() => navigate('/chat')} size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Plan
          </Button>
        </div>

        {error && (
          <Card className="mb-8 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {itineraries.map((itinerary) => (
            <ItineraryCard 
              key={itinerary._id}
              itinerary={itinerary}
              onClick={() => handlePlanClick(itinerary.planId)}
              onDelete={handleDelete}
            />
          ))}

          {!loading && !itineraries.length && (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <div className="text-center space-y-3">
                  <Plane className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-xl font-medium text-muted-foreground">
                    No travel plans yet
                  </p>
                  <p className="text-muted-foreground">
                    Create your first plan to get started!
                  </p>
                  <Button 
                    onClick={() => navigate('/chat')}
                    className="mt-4"
                  >
                    Create Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {pagination.pages}
            </div>

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