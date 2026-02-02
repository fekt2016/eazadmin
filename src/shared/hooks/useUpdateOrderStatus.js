import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to update order status (Admin/Seller only)
 * POST /api/v1/admin/orders/:orderId/status
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, message, location }) => {
      // Use admin-scoped endpoint to ensure admin auth middleware is applied
      const response = await api.post(`/admin/orders/${orderId}/status`, {
        status,
        message,
        location,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate order queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-tracking', variables.orderId] });
      // Invalidate admin stats when order status changes (especially when delivered)
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};

