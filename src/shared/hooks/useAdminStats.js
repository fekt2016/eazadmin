import { useQuery } from '@tanstack/react-query';
import adminStatsApi from '../services/adminStatsApi';

/**
 * Get platform statistics (revenue, orders, etc.)
 */
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await adminStatsApi.getPlatformStats();
      return response.data.data;
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export default useAdminStats;

