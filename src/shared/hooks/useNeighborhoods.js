import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { neighborhoodService } from '../services/neighborhoodApi';

/**
 * Hook to get all neighborhoods with pagination and filtering
 */
export const useGetNeighborhoods = (params = {}) => {
  return useQuery({
    queryKey: ['neighborhoods', params],
    queryFn: () => neighborhoodService.getAllNeighborhoods(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to get neighborhood statistics
 */
export const useGetNeighborhoodStatistics = () => {
  return useQuery({
    queryKey: ['neighborhood-statistics'],
    queryFn: () => neighborhoodService.getStatistics(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to get a single neighborhood
 */
export const useGetNeighborhood = (id) => {
  return useQuery({
    queryKey: ['neighborhood', id],
    queryFn: () => neighborhoodService.getNeighborhood(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to create a new neighborhood
 */
export const useCreateNeighborhood = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => neighborhoodService.createNeighborhood(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood-statistics'] });
    },
  });
};

/**
 * Hook to update a neighborhood
 */
export const useUpdateNeighborhood = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => neighborhoodService.updateNeighborhood(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood-statistics'] });
    },
  });
};

/**
 * Hook to delete a neighborhood
 */
export const useDeleteNeighborhood = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => neighborhoodService.deleteNeighborhood(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood-statistics'] });
    },
  });
};

/**
 * Hook to refresh coordinates for a neighborhood
 */
export const useRefreshCoordinates = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => neighborhoodService.refreshCoordinates(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood', id] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood-map-url', id] });
    },
  });
};

/**
 * Hook to recalculate distance and zone for a neighborhood
 */
export const useRecalculateNeighborhood = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => neighborhoodService.recalculateNeighborhood(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood', id] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood-statistics'] });
    },
  });
};

/**
 * Hook to toggle neighborhood active status
 */
export const useToggleNeighborhoodActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => neighborhoodService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood-statistics'] });
    },
  });
};

/**
 * Hook to get Google Maps embed URL for neighborhood route
 */
export const useGetMapUrl = (id, enabled = true) => {
  return useQuery({
    queryKey: ['neighborhood-map-url', id],
    queryFn: () => neighborhoodService.getMapUrl(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

