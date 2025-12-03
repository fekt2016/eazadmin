import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingZoneService } from '../services/shippingZoneApi';

/**
 * Get all shipping zones
 */
export const useGetShippingZones = (filters = {}) => {
  return useQuery({
    queryKey: ['shipping-zones', filters],
    queryFn: async () => {
      const response = await shippingZoneService.getAllShippingZones(filters);
      return response;
    },
  });
};

/**
 * Get shipping zone by ID
 */
export const useGetShippingZone = (id) => {
  return useQuery({
    queryKey: ['shipping-zone', id],
    queryFn: async () => {
      const response = await shippingZoneService.getShippingZone(id);
      return response;
    },
    enabled: !!id,
  });
};

/**
 * Create shipping zone
 */
export const useCreateShippingZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await shippingZoneService.createShippingZone(data);
      return response.data.shippingZone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
    },
  });
};

/**
 * Update shipping zone
 */
export const useUpdateShippingZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await shippingZoneService.updateShippingZone(id, data);
      return response.data.shippingZone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
    },
  });
};

/**
 * Delete shipping zone
 */
export const useDeleteShippingZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await shippingZoneService.deleteShippingZone(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
    },
  });
};

/**
 * Toggle shipping zone active status
 */
export const useToggleShippingZoneActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      return await shippingZoneService.toggleShippingZone(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
    },
  });
};

