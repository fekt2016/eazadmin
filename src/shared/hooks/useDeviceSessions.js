import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllSessions,
  getUserSessions,
  forceLogoutDevice,
  forceLogoutUser,
  getSuspiciousLogins,
  getCleanupLogs,
} from '../services/deviceSessionApi';
import { toast } from 'react-toastify';

/**
 * Hook to get all device sessions with filters
 */
export const useDeviceSessions = (params = {}) => {
  return useQuery({
    queryKey: ['deviceSessions', params],
    queryFn: () => getAllSessions(params),
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to get sessions for a specific user
 */
export const useUserDeviceSessions = (userId, params = {}) => {
  return useQuery({
    queryKey: ['userDeviceSessions', userId, params],
    queryFn: () => getUserSessions(userId, params),
    enabled: !!userId,
    staleTime: 30000,
  });
};

/**
 * Hook to force logout a device
 */
export const useForceLogoutDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: forceLogoutDevice,
    onSuccess: (data) => {
      toast.success(data.message || 'Device logged out successfully');
      queryClient.invalidateQueries(['deviceSessions']);
      queryClient.invalidateQueries(['userDeviceSessions']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to logout device');
    },
  });
};

/**
 * Hook to force logout all user sessions
 */
export const useForceLogoutUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: forceLogoutUser,
    onSuccess: (data) => {
      toast.success(data.message || 'All sessions logged out successfully');
      queryClient.invalidateQueries(['deviceSessions']);
      queryClient.invalidateQueries(['userDeviceSessions']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to logout user sessions');
    },
  });
};

/**
 * Hook to get suspicious logins
 */
export const useSuspiciousLogins = () => {
  return useQuery({
    queryKey: ['suspiciousLogins'],
    queryFn: getSuspiciousLogins,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook to get cleanup logs
 */
export const useCleanupLogs = () => {
  return useQuery({
    queryKey: ['cleanupLogs'],
    queryFn: getCleanupLogs,
    staleTime: 300000, // 5 minutes
  });
};

