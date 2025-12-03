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

  return {
    sellers: { results, meta, data: { results, meta } }, // Keep backward compatibility
    totalSellers: meta.total || 0,
    isLoading: isSellersLoading,
    isSellerLoading: isSellersLoading, // Alias for backward compatibility
    error: sellersError,
    updateStatus,
    updateSeller,
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

export default useSellerAdmin;
