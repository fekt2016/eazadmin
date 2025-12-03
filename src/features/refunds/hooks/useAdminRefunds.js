import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundService } from '../../../shared/services/refundApi';
import { toast } from 'react-toastify';

/**
 * Hook to fetch all refunds with filters and pagination
 * @param {Object} filters - Filter parameters
 * @returns {Object} Query result
 */
export const useAdminRefundsList = (filters = {}) => {
  return useQuery({
    queryKey: ['adminRefunds', filters],
    queryFn: async () => {
      const response = await refundService.getAllRefunds(filters);
      return response;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
};

/**
 * Hook to fetch a single refund by ID
 * @param {string} refundId - Refund ID
 * @returns {Object} Query result
 */
export const useAdminRefund = (refundId) => {
  return useQuery({
    queryKey: ['adminRefund', refundId],
    queryFn: async () => {
      if (!refundId) return null;
      const response = await refundService.getRefundById(refundId);
      return response;
    },
    enabled: !!refundId,
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
  });
};

/**
 * Hook to approve a full refund
 * @returns {Object} Mutation result
 */
export const useApproveRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ refundId, data }) => {
      const response = await refundService.approveRefund(refundId, data);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['adminRefunds']);
      queryClient.invalidateQueries(['adminRefund', variables.refundId]);
      toast.success('Refund approved successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to approve refund');
    },
  });
};

/**
 * Hook to approve a partial refund
 * @returns {Object} Mutation result
 */
export const useApprovePartialRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ refundId, data }) => {
      const response = await refundService.approvePartialRefund(refundId, data);
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminRefunds']);
      queryClient.invalidateQueries(['adminRefund', variables.refundId]);
      toast.success(`Partial refund of GH₵${data.data?.approvedAmount || data.data?.amount || 0} approved`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to approve partial refund');
    },
  });
};

/**
 * Hook to reject a refund
 * @returns {Object} Mutation result
 */
export const useRejectRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ refundId, data }) => {
      const response = await refundService.rejectRefund(refundId, data);
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminRefunds']);
      queryClient.invalidateQueries(['adminRefund', variables.refundId]);
      toast.success('Refund rejected');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to reject refund');
    },
  });
};

/**
 * Hook to update refund (add notes, etc.)
 * @returns {Object} Mutation result
 */
export const useUpdateRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ refundId, data }) => {
      const response = await refundService.updateRefund(refundId, data);
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminRefunds']);
      queryClient.invalidateQueries(['adminRefund', variables.refundId]);
      toast.success('Refund updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update refund');
    },
  });
};

