import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../services/notifications/notificationApi';

/**
 * Hook to get all notifications
 */
export const useNotifications = (params = {}) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const data = await getNotifications(params);
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('[Admin useNotifications] Fetched notifications:', {
          params,
          data,
          notificationsCount: data?.data?.notifications?.length || 0,
          total: data?.total || 0
        });
      }
      
      return data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to get unread notification count
 * FIX: Updated settings to ensure count updates immediately
 */
export const useUnreadCount = () => {
  const query = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      console.log('[EazAdmin useUnreadCount] 🔄 Query function called');
      const data = await getUnreadCount();
      console.log('[EazAdmin useUnreadCount] ✅ Query function returned:', {
        data,
        unreadCount: data?.data?.unreadCount,
        status: data?.status,
      });
      return data;
    },
    staleTime: 0, // Always consider stale to ensure fresh data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    refetchIntervalInBackground: false, // Don't refetch when tab is in background
  });

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[EazAdmin useUnreadCount] 📊 Query state:', {
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      data: query.data,
      unreadCount: query.data?.data?.unreadCount,
      status: query.status,
    });
  }

  return query;
};

/**
 * Hook to mark a notification as read
 * FIX: Optimistically update unread count immediately
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: (data, notificationId) => {
      console.log('[Admin useMarkAsRead] ✅ Notification marked as read:', notificationId, data);
      
      // FIX: Optimistically update unread count immediately
      queryClient.setQueryData(['notifications', 'unread'], (oldData) => {
        if (!oldData) return oldData;
        
        const currentCount = oldData?.data?.unreadCount ?? oldData?.unreadCount ?? 0;
        const newCount = Math.max(0, currentCount - 1); // Decrease by 1
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            unreadCount: newCount,
          },
        };
      });
      
      // Optimistically update the notification in cache
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData) => {
        if (!oldData) return oldData;
        
        const updatedData = { ...oldData };
        if (updatedData.data?.notifications) {
          updatedData.data.notifications = updatedData.data.notifications.map((notif) =>
            notif._id === notificationId
              ? { ...notif, read: true, readAt: new Date() }
              : notif
          );
        }
        return updatedData;
      });
      
      // Invalidate to refetch fresh data (background refetch)
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
    onError: (error) => {
      console.error('[Admin useMarkAsRead] ❌ Error marking notification as read:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });
};

/**
 * Hook to mark all notifications as read
 * FIX: Optimistically update unread count to 0 immediately
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: (data) => {
      console.log('[Admin useMarkAllAsRead] ✅ All notifications marked as read:', data);
      
      // FIX: Optimistically update unread count to 0 immediately
      queryClient.setQueryData(['notifications', 'unread'], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            unreadCount: 0,
          },
        };
      });
      
      // Optimistically update all notifications in cache
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData) => {
        if (!oldData) return oldData;
        
        const updatedData = { ...oldData };
        if (updatedData.data?.notifications) {
          updatedData.data.notifications = updatedData.data.notifications.map((notif) => ({
            ...notif,
            read: true,
            readAt: new Date(),
          }));
        }
        return updatedData;
      });
      
      // Invalidate to refetch fresh data (background refetch)
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
    onError: (error) => {
      console.error('[Admin useMarkAllAsRead] ❌ Error marking all notifications as read:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });
};

/**
 * Hook to delete a notification
 * FIX: Optimistically update unread count if deleted notification was unread
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: (data, notificationId) => {
      console.log('[Admin useDeleteNotification] ✅ Notification deleted:', notificationId, data);
      
      // FIX: Check if deleted notification was unread and update count optimistically
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData) => {
        if (!oldData) return oldData;
        
        const notifications = oldData?.data?.notifications || [];
        const deletedNotification = notifications.find(n => n._id === notificationId);
        
        // If deleted notification was unread, decrease count
        if (deletedNotification && !deletedNotification.read) {
          queryClient.setQueryData(['notifications', 'unread'], (oldUnreadData) => {
            if (!oldUnreadData) return oldUnreadData;
            
            const currentCount = oldUnreadData?.data?.unreadCount ?? oldUnreadData?.unreadCount ?? 0;
            const newCount = Math.max(0, currentCount - 1);
            
            return {
              ...oldUnreadData,
              data: {
                ...oldUnreadData.data,
                unreadCount: newCount,
              },
            };
          });
        }
        
        // Remove notification from list
        return {
          ...oldData,
          data: {
            ...oldData.data,
            notifications: notifications.filter(n => n._id !== notificationId),
          },
        };
      });
      
      // Invalidate to refetch fresh data (background refetch)
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
    onError: (error) => {
      console.error('[Admin useDeleteNotification] ❌ Error deleting notification:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });
};

