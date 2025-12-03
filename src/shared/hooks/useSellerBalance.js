import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminSellerApi from '../services/adminSellerApi';
import { toast } from 'react-toastify';

/**
 * Get seller balance details
 */
export const useGetSellerBalance = (sellerId) => {
  return useQuery({
    queryKey: ['sellerBalance', sellerId],
    queryFn: async () => {
      const response = await adminSellerApi.getSellerBalance(sellerId);
      return response.data;
    },
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

/**
 * Reset seller balance mutation
 */
export const useResetSellerBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sellerId, balance, reason }) => {
      const response = await adminSellerApi.resetSellerBalance(sellerId, {
        balance: balance || 0,
        reason,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Seller balance reset successfully');
      // Invalidate seller balance query
      queryClient.invalidateQueries(['sellerBalance', variables.sellerId]);
      // Invalidate sellers list to refresh balance display
      queryClient.invalidateQueries(['admin', 'sellers']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to reset seller balance';
      toast.error(message);
    },
  });
};

/**
 * Reset seller locked balance mutation
 */
export const useResetLockedBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sellerId, reason }) => {
      const response = await adminSellerApi.resetLockedBalance(sellerId, {
        reason,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Locked balance reset successfully. Funds returned to balance.');
      // Invalidate seller balance query
      queryClient.invalidateQueries(['sellerBalance', variables.sellerId]);
      // Invalidate sellers list to refresh balance display
      queryClient.invalidateQueries(['admin', 'sellers']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to reset locked balance';
      toast.error(message);
    },
  });
};

