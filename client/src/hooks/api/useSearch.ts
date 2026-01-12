import { useQuery, useMutation } from '@tanstack/react-query';
import { searchService, SearchFilters } from '@/services/api';
import { useState, useEffect } from 'react';

export const searchKeys = {
  all: ['search'] as const,
  results: (query: string, filters?: SearchFilters) =>
    [...searchKeys.all, 'results', query, filters] as const,
  suggestions: (query: string) => [...searchKeys.all, 'suggestions', query] as const,
};

// Debounced search hook
export function useSearch(query: string, filters?: SearchFilters, debounceMs = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceMs]);

  return useQuery({
    queryKey: searchKeys.results(debouncedQuery, filters),
    queryFn: () => searchService.search(debouncedQuery, filters),
    enabled: debouncedQuery.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

// Advanced search
export function useAdvancedSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: [...searchKeys.all, 'advanced', filters],
    queryFn: () => searchService.advancedSearch(filters),
    enabled: Object.keys(filters).length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

// Search suggestions
export function useSearchSuggestions(query: string, debounceMs = 200) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceMs]);

  return useQuery({
    queryKey: searchKeys.suggestions(debouncedQuery),
    queryFn: () => searchService.getSearchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length > 2,
    staleTime: 5 * 60 * 1000,
  });
}
