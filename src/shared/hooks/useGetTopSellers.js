import { useQuery } from '@tanstack/react-query';
import adminSellerApi from '../services/adminSellerApi';

/**
 * Hook to fetch top sellers for dashboard
 * Fetches sellers with limit and calculates stats
 */
export const useGetTopSellers = (limit = 5) => {
  return useQuery({
    queryKey: ['topSellers', limit],
    queryFn: async () => {
      const response = await adminSellerApi.getAllSellers({
        page: 1,
        limit: limit,
        sort: 'createdAt:desc', // Can be changed to sort by sales/revenue
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export default useGetTopSellers;

