import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from '../services/api';

/**
 * Hook to fetch platform settings
 */
export const usePlatformSettings = () => {
  return useQuery({
    queryKey: ["platformSettings"],
    queryFn: async () => {
      const response = await api.get("/admin/settings/platform");
      return response.data?.data?.settings || response.data?.settings || {};
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

/**
 * Hook to update platform settings
 */
export const useUpdatePlatformSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      const response = await api.patch("/admin/settings/platform", updates);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ["platformSettings"] });
    },
  });
};

/**
 * Hook to fetch audit logs
 */
export const usePlatformSettingsAuditLogs = (page = 1, limit = 50, filters = {}) => {
  return useQuery({
    queryKey: ["platformSettingsAuditLogs", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });
      const response = await api.get(`/admin/settings/audit-logs?${params}`);
      return response.data?.data || response.data || {};
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
};

