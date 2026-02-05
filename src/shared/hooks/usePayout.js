import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminPayoutApi from '../services/adminPayoutApi';
import { toast } from 'react-toastify';

/**
 * Get all withdrawal requests
 */
export const useGetWithdrawalRequests = (params = {}) => {
  return useQuery({
    queryKey: ['withdrawalRequests', params],
    queryFn: async () => {
      const response = await adminPayoutApi.getAllWithdrawalRequests(params);
      return response?.data || response;
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchOnWindowFocus: true,
  });
};

/**
 * Get single withdrawal request
 */
export const useGetWithdrawalRequest = (requestId) => {
  return useQuery({
    queryKey: ['withdrawalRequest', requestId],
    queryFn: async () => {
      const response = await adminPayoutApi.getWithdrawalRequest(requestId);
      return response?.data || response;
    },
    enabled: !!requestId,
    staleTime: 1000 * 60 * 1,
  });
};

/**
 * Approve withdrawal request mutation
 */
export const useApproveWithdrawalRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId) => {
      return await adminPayoutApi.approveWithdrawalRequest(requestId);
    },
    onSuccess: (data) => {
      const balanceInfo = data?.data?.sellerBalance;
      let message = 'Withdrawal request approved and transfer initiated';
      if (balanceInfo) {
        message += `. Seller's remaining available balance: ₵${balanceInfo.availableBalance.toFixed(2)}`;
      }
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequest'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to approve withdrawal request';
      toast.error(message);
    },
  });
};

/**
 * Reject withdrawal request mutation
 */
export const useRejectWithdrawalRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }) => {
      return await adminPayoutApi.rejectWithdrawalRequest(requestId, reason);
    },
    onSuccess: () => {
      toast.success('Withdrawal request rejected');
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequest'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to reject withdrawal request';
      toast.error(message);
    },
  });
};

/**
 * Verify transfer status mutation
 */
export const useVerifyTransferStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId) => {
      return await adminPayoutApi.verifyTransferStatus(requestId);
    },
    onSuccess: () => {
      toast.success('Transfer status verified');
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequest'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to verify transfer status';
      toast.error(message);
    },
  });
};

/**
 * Verify Paystack OTP for a withdrawal (admin-only)
 */
export const useVerifyPaystackOtp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, otp }) => {
      return await adminPayoutApi.verifyPaystackOtp(requestId, otp);
    },
    onSuccess: (data) => {
      // Check if this was a status sync (transfer already completed)
      const message = data?.message || data?.data?.message;
      if (message && message.includes('already completed')) {
        toast.success(message || 'Transfer status synced successfully');
      } else {
        toast.success('Paystack OTP verified and transfer updated');
      }
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequest'] });
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || 'Failed to verify Paystack OTP';
      toast.error(message);
    },
  });
};

/**
 * Resend Paystack OTP for a withdrawal
 */
export const useResendPaystackOtp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId) => {
      return await adminPayoutApi.resendPaystackOtp(requestId);
    },
    onSuccess: () => {
      toast.success(
        'OTP resend requested. Check your Paystack business phone/email.'
      );
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequest'] });
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || 'Failed to resend Paystack OTP';
      toast.error(message);
    },
  });
};

