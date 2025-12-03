import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminPaymentRequestApi from '../services/adminPaymentRequestApi';

/**
 * Hook to fetch and manage payment requests in admin panel
 * @returns {Object} - { requests, isLoading, error, refetch, processPaymentRequest, stats }
 */
export const usePaymentRequest = () => {
  const queryClient = useQueryClient();

  // Fetch pending payment requests
  const {
    data: requestsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'paymentRequests'],
    queryFn: async () => {
      const response = await adminPaymentRequestApi.getPendingRequests();
      return response?.data?.data?.requests || response?.data?.requests || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  const requests = requestsData || [];

  // Process payment request mutation (approve or reject)
  const processPaymentRequest = useMutation({
    mutationFn: ({ requestId, status, transactionId, rejectionReason }) => {
      return adminPaymentRequestApi.processPaymentRequest(requestId, {
        status,
        transactionId,
        rejectionReason,
      });
    },
    onSuccess: () => {
      // Refetch payment requests after processing
      queryClient.invalidateQueries(['admin', 'paymentRequests']);
    },
    onError: (error) => {
      console.error('[usePaymentRequest] Error processing payment request:', error);
    },
  });

  // Calculate stats from requests
  const stats = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved' || r.status === 'paid' || r.status === 'success').length,
    paid: requests.filter((r) => r.status === 'paid' || r.status === 'success').length,
    rejected: requests.filter((r) => r.status === 'rejected' || r.status === 'failed').length,
    totalAmount: requests.reduce((sum, req) => sum + (req.amount || 0), 0),
  };

  return {
    requests,
    isLoading,
    error,
    refetch,
    processPaymentRequest: processPaymentRequest.mutate,
    processPaymentRequestAsync: processPaymentRequest.mutateAsync,
    isProcessing: processPaymentRequest.isPending,
    stats,
  };
};

export default usePaymentRequest;

