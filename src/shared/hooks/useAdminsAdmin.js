import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminUserApi from '../services/adminUserApi';
import { useState, useEffect } from "react";

const useAdminsAdmin = (page = 1, limit = 10, options = {}) => {
  const { enabled = true } = options;
  const [searchValue, setSearchValue] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sort, setSort] = useState("createdAt:desc");

  useEffect(() => {
    if (searchValue !== appliedSearch) {
      const handler = setTimeout(() => {
        setAppliedSearch(searchValue);
      }, 500);

      return () => clearTimeout(handler);
    }
  }, [searchValue, appliedSearch]);

  const queryClient = useQueryClient();

  // Get all admins with pagination
  const {
    data: admins,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "admins", page, limit, appliedSearch, sort],
    enabled,
    queryFn: async () => {
      try {
        const params = {
          page,
          limit,
          sort,
        };

        if (appliedSearch) {
          params.search = appliedSearch;
        }
        return await adminUserApi.getAllAdmins(params);
      } catch (error) {
        // If timeout or network error, return empty result instead of throwing
        if (error.isTimeout || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          return {
            data: {
              status: 'success',
              results: [],
              meta: {
                total: 0,
                totalPages: 1,
                currentPage: page,
                itemsPerPage: limit,
              },
            },
          };
        }
        throw error;
      }
    },
    keepPreviousData: true,
    retry: 1, // Reduced retries
    retryDelay: 2000, // Wait 2 seconds before retry
    staleTime: 30000, // 30 seconds - reduce refetch frequency
  });

  // Backend handleFactory.getAll returns: { status: 'success', results: [...], meta: {...} }
  // Axios response structure: response = { data: { status: 'success', results: [...], meta: {...} } }
  // So admins = axios response, admins.data = { status: 'success', results: [...], meta: {...} }
  // Check for nested data structure (some APIs wrap it in data.data)
  const emptyMeta = {
    total: 0,
    totalPages: 1,
    currentPage: page,
    itemsPerPage: limit,
  };
  // When disabled, ignore React Query cache so non-superadmins never see a stale admin list
  // (e.g. after logout / role change in the same SPA session).
  const adminsDataRaw = admins?.data?.data || admins?.data || {};
  const adminsData = enabled ? adminsDataRaw : { results: [], meta: emptyMeta };

  // Ensure results is always an array
  const results = Array.isArray(adminsData?.results) ? adminsData.results : [];
  const meta = adminsData?.meta || emptyMeta;
  
  if (error) {
    console.error('[useAdminsAdmin] Error fetching admins:', error);
  }

  // Update admin mutation
  const updateAdmin = useMutation({
    mutationFn: ({ id, data }) => adminUserApi.updateAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "admins"]);
    },
  });

  // Delete admin mutation
  const deleteAdmin = useMutation({
    mutationFn: (adminId) => adminUserApi.deleteAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "admins"]);
    },
  });

  return {
    admins: { results, meta },
    totalAdmins: meta.total || 0,
    isLoading: Boolean(enabled && isLoading),
    error: enabled ? error : undefined,
    updateAdmin,
    deleteAdmin,
    setSearchValue,
    searchValue,
    appliedSearch,
    sort,
    setSort,
  };
};

export default useAdminsAdmin;

