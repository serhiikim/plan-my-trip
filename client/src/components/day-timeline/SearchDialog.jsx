import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Plus } from 'lucide-react';

export const AddActivityButton = ({ onClick }) => (
  <Button
    variant="outline"
    className="w-full py-6 border-dashed hover:border-primary hover:bg-primary/5"
    onClick={onClick}
  >
    <Plus className="h-5 w-5 mr-2" />
    Add New Activity
  </Button>
);

const SearchDialog = ({ 
  isOpen, 
  onOpenChange, 
  searchQuery, 
  onSearchChange, 
  isSearching, 
  searchResults, 
  onPlaceSelect, 
  isLoading 
}) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Add New Activity</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        <div className="relative">
          <Input
            placeholder="Search for a place..."
            value={searchQuery}
            onChange={onSearchChange}
            disabled={isLoading}
            className="pl-10"
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {searchResults.map((place) => (
              <Button
                key={place.place_id}
                variant="ghost"
                className="w-full justify-start text-left hover:bg-accent p-3 h-auto"
                onClick={() => onPlaceSelect(place)}
                disabled={isLoading}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium">{place.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {place.formatted_address}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        )}

        {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No places found for "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

export default SearchDialog;