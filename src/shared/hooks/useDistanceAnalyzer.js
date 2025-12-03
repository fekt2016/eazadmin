import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { distanceAnalyzerService } from '../services/distanceAnalyzerApi';

/**
 * Hook to analyze distances for all zones
 */
export const useAnalyzeAllZones = () => {
  return useMutation({
    mutationFn: (improved = true) => distanceAnalyzerService.analyzeAllZones(improved),
  });
};

/**
 * Hook to analyze and save distances
 */
export const useAnalyzeAndSave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (improved = true) => distanceAnalyzerService.analyzeAndSave(improved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distance-records'] });
    },
  });
};

/**
 * Hook to get distance records with pagination
 * @param {Object} filters - Filters including page, limit, zone, sortBy, sortOrder
 */
export const useGetDistanceRecords = (filters = {}) => {
  const { page = 1, limit = 10, ...otherFilters } = filters;
  
  return useQuery({
    queryKey: ['distance-records', { page, limit, ...otherFilters }],
    queryFn: async () => {
      const response = await distanceAnalyzerService.getDistanceRecords({
        page,
        limit,
        ...otherFilters,
      });
      return response;
    },
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

