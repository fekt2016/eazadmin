import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminUserApi from '../services/adminUserApi';
import { useState, useEffect } from "react";

const useAdminsAdmin = (page = 1, limit = 10) => {
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
    queryFn: () => {
      const params = {
        page,
        limit,
        sort,
      };

      if (appliedSearch) {
        params.search = appliedSearch;
      }
      return adminUserApi.getAllAdmins(params);
    },
    keepPreviousData: true,
    retry: 2,
  });

  // Backend handleFactory.getAll returns: { status: 'success', results: [...], meta: {...} }
  // Axios response structure: response = { data: { status: 'success', results: [...], meta: {...} } }
  // So admins = axios response, admins.data = { status: 'success', results: [...], meta: {...} }
  // Check for nested data structure (some APIs wrap it in data.data)
  const adminsData = admins?.data?.data || admins?.data || {};
  
  // Ensure results is always an array
  const results = Array.isArray(adminsData?.results) ? adminsData.results : [];
  const meta = adminsData?.meta || {
    total: 0,
    totalPages: 1,
    currentPage: page,
    itemsPerPage: limit,
  };
  
  // Debug logging (remove in production)
  if (error) {
    console.error('[useAdminsAdmin] Error fetching admins:', error);
  }
  if (admins && results.length === 0 && meta.total === 0) {
    console.log('[useAdminsAdmin] No admins found. Response structure:', {
      admins,
      adminsData,
      results,
      meta,
    });
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
    isLoading,
    error,
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

