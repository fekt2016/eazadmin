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
    retry: 2,
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
    onSuccess: (data) => {
      console.log("Status updated successfully:", data);
      // Invalidate the sellers query
      queryClient.invalidateQueries(["admin", "sellers"]);
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
    queryFn: () => adminApi.getPayoutVerificationDetails(sellerId),
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
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
      const response = await adminApi.getSellerDetails(sellerId);
      return response;
    },
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export default useSellerAdmin;
