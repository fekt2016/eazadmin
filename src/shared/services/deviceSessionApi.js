import api from './api';

/**
 * Device Session API Service
 * Handles all device session management API calls
 */

// Get all device sessions with filters
export const getAllSessions = async (params = {}) => {
  const {
    userId,
    status,
    deviceType,
    suspicious,
    platform,
    page = 1,
    limit = 50,
  } = params;

  const queryParams = new URLSearchParams();
  if (userId) queryParams.append('userId', userId);
  if (status) queryParams.append('status', status);
  if (deviceType) queryParams.append('deviceType', deviceType);
  if (suspicious) queryParams.append('suspicious', suspicious);
  if (platform) queryParams.append('platform', platform);
  queryParams.append('page', page);
  queryParams.append('limit', limit);

  const response = await api.get(`/admin/sessions?${queryParams.toString()}`);
  return response.data;
};

// Get sessions for a specific user
export const getUserSessions = async (userId, params = {}) => {
  const { status, platform } = params;
  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  if (platform) queryParams.append('platform', platform);

  const response = await api.get(
    `/admin/sessions/user/${userId}?${queryParams.toString()}`
  );
  return response.data;
};

// Force logout a specific device
export const forceLogoutDevice = async (deviceId) => {
  const encoded = encodeURIComponent(deviceId);
  const response = await api.delete(`/admin/sessions/logout-device/${encoded}`);
  return response.data;
};

// Force logout all sessions for a user
export const forceLogoutUser = async (userId) => {
  const encoded = encodeURIComponent(userId);
  const response = await api.delete(`/admin/sessions/logout-user/${encoded}`);
  return response.data;
};

// Get suspicious logins
export const getSuspiciousLogins = async () => {
  const response = await api.get('/admin/sessions/suspicious');
  return response.data;
};

// Get cleanup logs
export const getCleanupLogs = async () => {
  const response = await api.get('/admin/sessions/cleanup-logs');
  return response.data;
};

