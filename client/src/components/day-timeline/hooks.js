import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { planApi } from '../../services/api';

export const useSearch = (activities, toast) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.length < 3) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        const countryCode = activities[0]?.locationData?.addressComponents?.find(
          (component) => component.types.includes('country')
        )?.short_name;

        const results = await planApi.searchPlaces(query, countryCode);
        setSearchResults(results || []);
      } catch (error) {
        console.error('Search failed:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to search places"
        });
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [activities, toast]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(true);
    debouncedSearch(query);
  };

  return {
    isSearching,
    searchQuery,
    searchResults,
    setSearchQuery,
    setSearchResults,
    handleSearch
  };
};