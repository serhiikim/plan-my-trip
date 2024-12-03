import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { planApi } from '../services/api';

export const usePlanActions = (planId, onRegenerateStart) => {
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleRegenerate = async () => {
    setIsRegenerateDialogOpen(false);
    try {
      onRegenerateStart();

      toast({
        title: "Regenerating plan",
        description: regenerateInstructions
          ? "Creating new plan with your special requests..."
          : "Please wait while we create your new travel plan..."
      });

      await planApi.regenerateItinerary(planId, regenerateInstructions.trim() || null);
      setRegenerateInstructions(''); // Reset instructions
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
      throw error;
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

  return {
    // Dialog states
    isRegenerateDialogOpen,
    setIsRegenerateDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    regenerateInstructions,
    setRegenerateInstructions,

    // Actions
    handleDelete,
    handleRegenerate,
    handleExport,
    handleShare,
    handlePrint
  };
};