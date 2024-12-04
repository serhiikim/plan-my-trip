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
  import { Label } from "@/components/ui/label";
  import { Textarea } from "@/components/ui/textarea";
  
  export function RegeneratePlanModal({ 
    open, 
    onOpenChange, 
    onConfirm, 
    instructions, 
    onInstructionsChange 
  }) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
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
                value={instructions}
                onChange={(e) => onInstructionsChange(e.target.value)}
                className="h-24 resize-none"
              />
            </div>
          </div>
  
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onInstructionsChange('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }