import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from '../services/adminSellerApi';
import { useState } from "react";
import { useEffect } from "react";

const useSellerAdmin = (pageParam = 1, limit = 10) => {
  const [page, setPage] = useState(pageParam);
  const [searchValue, setSearchValue] = useState(""); // Local search state
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sort, setSort] = useState("createdAt:desc");

  // Update page when pageParam changes
  useEffect(() => {
    setPage(pageParam);
  }, [pageParam]);

  useEffect(() => {
    // Only set the applied search if there's a change
    if (searchValue !== appliedSearch) {
      const handler = setTimeout(() => {
        setAppliedSearch(searchValue);
        setPage(1); // Reset to first page when search changes
      }, 500); // 500ms debounce delay

      return () => clearTimeout(handler);
    }
  }, [searchValue, appliedSearch]);

  const queryClient = useQueryClient();

  // Get all sellers with pagination
  const {
    data: sellers,
    isLoading: isSellersLoading,
    error: sellersError,
  } = useQuery({
    queryKey: ["admin", "sellers", page, limit, appliedSearch, sort],
    queryFn: () => {
      const params = {
        page,
        limit,
        sort,
      };

      // Only add search parameter if it has value
      if (appliedSearch) {
        params.search = appliedSearch;
      }
      return adminApi.getAllSellers(params);
    },
    keepPreviousData: true,
    // Avoid retry storms on backend timeouts while still retrying for transient errors.
    retry: (failureCount, error) => {
      if (error?.isTimeout || error?.code === 'ECONNABORTED') {
        return false;
      }
      return failureCount < 2;
    },
  });
  
  // Seller verification mutations
  const approveVerification = useMutation({
    mutationFn: (sellerId) => adminApi.approveSellerVerification(sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "sellers"]);
      queryClient.invalidateQueries(["seller", "details"]);
    },
  });

  const rejectVerification = useMutation({
    mutationFn: ({ sellerId, reason }) => adminApi.rejectSellerVerification(sellerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "sellers"]);
      queryClient.invalidateQueries(["seller", "details"]);
    },
  });

  // Backend handleFactory.getAll returns: { status: 'success', results: [...], meta: {...} }
  // Axios response structure: response = { data: { status: 'success', results: [...], meta: {...} } }
  // So sellers = axios response, sellers.data = { status: 'success', results: [...], meta: {...} }
  // Check for nested data structure (some APIs wrap it in data.data)
  const sellersData = sellers?.data?.data || sellers?.data || {};
  
  // Ensure results is always an array
  const results = Array.isArray(sellersData?.results) ? sellersData.results : [];
  const meta = sellersData?.meta || {
    total: 0,
    totalPages: 1,
    currentPage: page,
    itemsPerPage: limit,
  };

  // Status update mutation
  const updateStatus = useMutation({
    mutationFn: (statusData) => adminApi.updateSellerStatus(statusData),
    onSuccess: (data, variables) => {
      console.log("Status updated successfully:", data);
      queryClient.invalidateQueries(["admin", "sellers"]);
      if (variables?.sellerId) {
        queryClient.invalidateQueries(["admin", "seller", variables.sellerId, "details"]);
      }
    },
  });
  const updateSeller = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateSeller(id, data),
    onSuccess: (data) => {
      console.log("Seller updated successfully:", data);
      // Invalidate the sellers query
      queryClient.invalidateQueries(["admin", "sellers"]);
    },
  });

  // Payout verification mutations
  const approvePayout = useMutation({
    mutationFn: ({ sellerId, paymentMethod }) => adminApi.approveSellerPayout(sellerId, { paymentMethod }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["admin", "sellers"]);
      queryClient.invalidateQueries(["seller", "details"]);
      queryClient.invalidateQueries(["admin", "user", variables.sellerId]);
      queryClient.invalidateQueries(["admin", "seller", variables.sellerId, "payout-verification"]);
    },
  });

  const rejectPayout = useMutation({
    mutationFn: ({ sellerId, reason }) => adminApi.rejectSellerPayout(sellerId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["admin", "sellers"]);
      queryClient.invalidateQueries(["seller", "details"]);
      queryClient.invalidateQueries(["admin", "user", variables.sellerId]);
      queryClient.invalidateQueries(["admin", "seller", variables.sellerId, "payout-verification"]);
    },
  });

  return {
    sellers: { results, meta, data: { results, meta } }, // Keep backward compatibility
    totalSellers: meta.total || 0,
    isLoading: isSellersLoading,
    isSellerLoading: isSellersLoading, // Alias for backward compatibility
    error: sellersError,
    updateStatus,
    updateSeller,
    approvePayout,
    rejectPayout,
    approveVerification,
    rejectVerification,
    page,
    setPage,
    setSearchValue,
    searchValue,
    appliedSearch,
    sort,
    setSort,
    meta, // Direct access to meta
  };
};

/**
 * Hook to fetch seller payout verification details (includes PaymentMethod records)
 */
export const usePayoutVerificationDetails = (sellerId) => {
  return useQuery({
    queryKey: ["admin", "seller", sellerId, "payout-verification"],
    queryFn: async () => {
      try {
        const response = await adminApi.getPayoutVerificationDetails(sellerId);
        console.log('[usePayoutVerificationDetails] ✅ Fetched payout verification data:', {
          sellerId,
          hasData: !!response,
          responseStructure: response,
          paymentMethodRecords: response?.data?.data?.seller?.paymentMethodRecords?.length || 0,
        });
        return response;
      } catch (error) {
        console.error('[usePayoutVerificationDetails] ❌ Error fetching payout verification:', {
          sellerId,
          error,
          message: error.message,
          isTimeout: error.isTimeout,
        });
        // Don't throw - return empty structure to prevent blocking
        if (error.isTimeout || error.code === 'ECONNABORTED') {
          console.warn('[usePayoutVerificationDetails] ⚠️ Request timed out, returning empty structure');
          return {
            data: {
              status: 'success',
              data: {
                seller: {
                  paymentMethodRecords: [],
                  paymentMethods: null,
                },
              },
            },
          };
        }
        throw error;
      }
    },
    enabled: !!sellerId,
    staleTime: 0, // Always fetch fresh data - payment methods can be added at any time
    // Avoid refetch storm on tab focus; admin can explicitly refresh when needed.
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch when component mounts
    cacheTime: 0, // Don't cache - always get fresh data
    // Avoid retrying when the backend is already timing out.
    retry: (failureCount, error) => {
      if (error?.isTimeout || error?.code === 'ECONNABORTED') {
        return false;
      }
      return failureCount < 1;
    },
    retryDelay: 2000, // Wait 2 seconds before retry
  });
};

/**
 * Hook to fetch a single seller by ID (for Seller Detail Page)
 * Uses the seller-specific endpoint directly
 */
export const useGetSellerById = (sellerId) => {
  return useQuery({
    queryKey: ["admin", "seller", sellerId, "details"],
    queryFn: async () => {
      if (!sellerId) {
        throw new Error("Seller ID is required");
      }
      // Increase timeout for seller details (may have lots of data)
      const response = await adminApi.getSellerDetails(sellerId, {
        timeout: 30000, // 30 seconds for seller details
      });
      return response;
    },
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 5, // 5 minutes - cache is considered fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache for 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on mount if data exists
    refetchOnReconnect: false, // Prevent refetch on reconnect
    // CRITICAL: Don't refetch if we have fresh data
    // This prevents stale data from overwriting verified state
    refetchInterval: false, // Never auto-refetch
    retry: (failureCount, error) => {
      // Don't retry on 404 errors or timeout errors
      if (error.response?.status === 404 || error.isTimeout) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export default useSellerAdmin;
