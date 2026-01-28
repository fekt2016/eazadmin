import api from '../api';

/**
 * Notification API Service for EazAdmin (Admin App)
 * All endpoints use the shared backend notification API
 */

// Get all notifications for the authenticated admin
export const getNotifications = async (params = {}) => {
  const { type, read, page = 1, limit = 50 } = params;
  const queryParams = new URLSearchParams();
  
  if (type) queryParams.append('type', type);
  // Convert boolean to string for query params
  if (read !== undefined) {
    queryParams.append('read', read === true ? 'true' : read === false ? 'false' : read);
  }
  queryParams.append('page', page);
  queryParams.append('limit', limit);

  const response = await api.get(`/notifications?${queryParams.toString()}`);
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Admin NotificationAPI] getNotifications response:', {
      params,
      responseData: response.data,
      notifications: response.data?.data?.notifications?.length || 0
    });
  }
  
  return response.data;
};

// Get unread notification count
export const getUnreadCount = async () => {
  try {
    console.log('[EazAdmin NotificationAPI] 🔍 Fetching unread count...');
    // Use shorter timeout for notification count (5 seconds)
    const response = await api.get('/notifications/unread', {
      timeout: 5000, // 5 seconds timeout
    });
    console.log('[EazAdmin NotificationAPI] ✅ getUnreadCount response:', {
      fullResponse: response,
      responseData: response.data,
      unreadCount: response.data?.data?.unreadCount,
      status: response.data?.status,
    });
    return response.data;
  } catch (error) {
    // Don't throw error - return default value instead to prevent blocking
    console.warn('[EazAdmin NotificationAPI] ⚠️ Error fetching unread count (non-blocking):', {
      error,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    // Return default structure so UI doesn't break
    return {
      status: 'success',
      data: {
        unreadCount: 0,
      },
    };
  }
};

// Get single notification by ID
export const getNotification = async (id) => {
  const response = await api.get(`/notifications/${id}`);
  return response.data;
};

// Mark a notification as read
export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/read/${id}`);
  return response.data;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

// Delete a notification
export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

