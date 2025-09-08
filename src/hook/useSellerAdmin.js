import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "../service/adminSellerApi";
import { useState } from "react";
import { useEffect } from "react";

const useSellerAdmin = (sellerId) => {
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState(""); // Local search state
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sort, setSort] = useState("createdAt:desc");

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

  // Get seller details if sellerId is provided
  const {
    data: seller,
    isLoading: isSellerLoading,
    error: sellerError,
    // refetch: refetchSeller,
  } = useQuery({
    queryKey: ["admin", "sellers", sellerId],
    queryFn: () => adminApi.getSellerDetails(sellerId),
    enabled: !!sellerId, // Only fetch when sellerId exists
  });

  // Get all sellers with pagination
  const {
    data: sellers,
    isLoading: isSellersLoading,
    error: sellersError,
  } = useQuery({
    queryKey: ["admin", "sellers", page, appliedSearch, sort],
    queryFn: () => {
      const params = {
        page,
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
    onSuccess: (response) => {
      // Use optional chaining to safely access data
      const apiData = response?.data?.data || {};
      const meta = apiData?.metsa || {
        total: 0,
        totalPages: 1,
        currentPage: page,
        itemsPerPage: 10,
      };

      // Update pagination if needed
      if (page > meta?.totalPages) {
        setPage(Math.max(1, meta.totalPages));
      }

      // Update cache with consistent structure
      queryClient.setQueryData(["admin", "sellers"], (oldData) => {
        return {
          data: {
            ...(oldData?.data || {}),
            meta,
            results: apiData?.results || oldData?.data?.results || [],
          },
        };
      });
    },
  });
  const sellersData = sellers?.data?.data || {};
  const meta = sellersData?.meta || {};

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
    mutationFn: (sellerData) => adminApi.updateSeller(sellerData),
    onSuccess: (data) => {
      console.log("Seller updated successfully:", data);
      // Invalidate the sellers query
      queryClient.invalidateQueries(["admin", "sellers"]);
      // Optionally, refetch the specific seller if needed
      if (sellerId) {
        queryClient.invalidateQueries(["admin", "sellers", sellerId]);
      }
    },
  });

  return {
    seller,
    sellers: sellers?.data || [],
    meta,
    isLoading: isSellerLoading || isSellersLoading,
    error: sellerError || sellersError,
    updateStatus,
    updateSeller,
    page,
    setPage,
    sort,
    setSort,
    setSearchValue,
    searchValue,
    appliedSearch,
  };
};

export default useSellerAdmin;
