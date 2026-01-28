import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminUserApi from '../services/adminUserApi';
import { useState, useEffect } from "react";

const useSellerAdmin = (userId) => {
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
  // CRITICAL: Validate ID format to prevent invalid API calls
  const isValidObjectId = (id) => {
    if (!id) return false;
    // MongoDB ObjectIds are 24 character hex strings
    // Reject numeric IDs like "1", "2", etc.
    if (typeof id === 'string' && id.length <= 3 && !isNaN(id) && parseInt(id) < 1000) {
      return false;
    }
    // Check if it's a valid ObjectId format (24 hex characters)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  };

  const {
    data: user,
    isLoading: isSellerLoading,
    error: usersError,
    // refetch: refetchSeller,
  } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => adminUserApi.getUserDetails(userId),
    enabled: !!userId && isValidObjectId(userId), // Only fetch when sellerId exists and is valid
    retry: (failureCount, error) => {
      // Don't retry on 400 (Invalid ID format) or timeout errors to avoid storms.
      if (error?.response?.status === 400 || error?.isTimeout || error?.code === 'ECONNABORTED') {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Get all sellers with pagination
  const {
    data: users,
    isLoading: isSellersLoading,
    error: UsersError,
  } = useQuery({
    queryKey: ["admin", "users", page, appliedSearch, sort],
    queryFn: () => {
      const params = {
        page,
        sort,
      };

      // Only add search parameter if it has value
      if (appliedSearch) {
        params.search = appliedSearch;
      }
      return adminUserApi.getAllUsers(params);
    },
    keepPreviousData: true,
    // Users list can be heavy; avoid retrying on backend timeouts.
    retry: (failureCount, error) => {
      if (error?.isTimeout || error?.code === 'ECONNABORTED') {
        return false;
      }
      return failureCount < 2;
    },
    // Non-critical list: avoid window-focus refetch storms in admin dashboard.
    refetchOnWindowFocus: false,
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
      queryClient.setQueryData(["admin", "users"], (oldData) => {
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
  const usersData = users?.data?.data || {};
  const meta = usersData?.meta || {};

  // Status update mutation
  const updateStatus = useMutation({
    mutationFn: (statusData) => adminUserApi.updateSellerStatus(statusData),
    onSuccess: (data) => {
      console.log("Status updated successfully:", data);
      // Invalidate the sellers query
      queryClient.invalidateQueries(["admin", "sellers"]);
    },
  });

  return {
    user,
    users: users?.data || [],
    meta,
    isLoading: isSellerLoading || isSellersLoading,
    error: UsersError || usersError,
    updateStatus,
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
