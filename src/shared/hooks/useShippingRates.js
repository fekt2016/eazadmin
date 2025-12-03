import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingRateService } from '../services/shippingRateApi';

/**
 * Get all shipping rates
 */
export const useGetShippingRates = (filters = {}) => {
  return useQuery({
    queryKey: ['shipping-rates', filters],
    queryFn: async () => {
      const response = await shippingRateService.getAllShippingRates(filters);  
      return response;
    },
  });
};

/**
 * Get rates by zone
 */
export const useGetRatesByZone = (zone, filters = {}) => {
  return useQuery({
    queryKey: ['shipping-rates', 'zone', zone, filters],
    queryFn: async () => {
      const response = await shippingRateService.getRatesByZone(zone, filters);
      return response;
    },
    enabled: !!zone,
  });
};

/**
 * Create shipping rate
 */
export const useCreateShippingRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await shippingRateService.createShippingRate(data);
      return response.data.shippingRate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
    },
  });
};

/**
 * Update shipping rate
 */
export const useUpdateShippingRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await shippingRateService.updateShippingRate(id, data);
      return response.data.shippingRate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
    },
  });
};

/**
 * Delete shipping rate
 */
export const useDeleteShippingRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await shippingRateService.deleteShippingRate(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
    },
  });
};

/**
 * Toggle shipping rate active status
 */
export const useToggleShippingRateActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      return await shippingRateService.toggleShippingRate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
    },
  });
};

