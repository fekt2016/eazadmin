import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import activityLogApi from '../services/activityLogApi';
import { useState, useEffect } from "react";

const useActivityLogs = ({
  page = 1,
  limit = 50,
  role = null,
  platform = null,
  dateRange = null,
  search = "",
} = {}) => {
  const [appliedSearch, setAppliedSearch] = useState(search);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setAppliedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  const queryClient = useQueryClient();

  // Get activity logs
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["activityLogs", page, limit, role, platform, dateRange, appliedSearch],
    queryFn: () => {
      const params = {
        page,
        limit,
      };

      if (role) params.role = role;
      if (platform) params.platform = platform;
      if (dateRange?.startDate) params.startDate = dateRange.startDate;
      if (dateRange?.endDate) params.endDate = dateRange.endDate;
      if (appliedSearch) params.search = appliedSearch;

      return activityLogApi.getActivityLogs(params);
    },
    keepPreviousData: true,
    retry: 2,
  });

  // Get activity statistics
  const {
    data: statsData,
    isLoading: isStatsLoading,
  } = useQuery({
    queryKey: ["activityLogs", "stats", dateRange],
    queryFn: () => {
      const params = {};
      if (dateRange?.startDate) params.startDate = dateRange.startDate;
      if (dateRange?.endDate) params.endDate = dateRange.endDate;
      return activityLogApi.getActivityStats(params);
    },
    retry: 2,
  });

  // Delete single log mutation
  const deleteLogMutation = useMutation({
    mutationFn: (id) => activityLogApi.deleteActivityLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["activityLogs"]);
    },
  });

  // Delete all logs mutation
  const deleteAllLogsMutation = useMutation({
    mutationFn: () => activityLogApi.deleteAllActivityLogs(),
    onSuccess: () => {
      queryClient.invalidateQueries(["activityLogs"]);
    },
  });

  // Cleanup old logs mutation
  const cleanupOldLogsMutation = useMutation({
    mutationFn: (days) => activityLogApi.cleanupOldLogs(days),
    onSuccess: () => {
      queryClient.invalidateQueries(["activityLogs"]);
    },
  });

  // Extract data from response
  const logs = logsData?.data?.data?.logs || [];
  const total = logsData?.data?.total || 0;
  const totalPages = logsData?.data?.totalPages || 1;
  const stats = statsData?.data?.data || null;

  return {
    logs,
    total,
    totalPages,
    page,
    limit,
    isLoading,
    isStatsLoading,
    error,
    stats,
    refetch,
    deleteLog: deleteLogMutation.mutate,
    deleteAllLogs: deleteAllLogsMutation.mutate,
    cleanupOldLogs: cleanupOldLogsMutation.mutate,
    isDeleting: deleteLogMutation.isLoading,
    isDeletingAll: deleteAllLogsMutation.isLoading,
    isCleaningUp: cleanupOldLogsMutation.isLoading,
  };
};

export default useActivityLogs;

