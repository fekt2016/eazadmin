import { useQuery } from '@tanstack/react-query';
import adminPaymentRequestApi from '../services/adminPaymentRequestApi';

/**
 * Hook to fetch a single payment request by ID
 * @param {string} requestId - Payment request ID
 * @returns {Object} - { request, isLoading, error, refetch }
 */
export const usePaymentRequestDetail = (requestId) => {
  const {
    data: requestData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'paymentRequest', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const response = await adminPaymentRequestApi.getPaymentRequestById(requestId);
      return response?.data?.data?.request || response?.data?.request || null;
    },
    enabled: !!requestId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  return {
    request: requestData,
    isLoading,
    error,
    refetch,
  };
};

export default usePaymentRequestDetail;

