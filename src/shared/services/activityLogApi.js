import api from './api';

const activityLogApi = {
  // Get paginated activity logs
  getActivityLogs: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.role) queryParams.append('role', params.role);
    if (params.platform) queryParams.append('platform', params.platform);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.search) queryParams.append('search', params.search);
    if (params.userId) queryParams.append('userId', params.userId);
    
    const queryString = queryParams.toString();
    return api.get(`/logs${queryString ? `?${queryString}` : ''}`);
  },

  // Get single activity log
  getActivityLog: (id) => {
    return api.get(`/logs/${id}`);
  },

  // Delete single activity log
  deleteActivityLog: (id) => {
    return api.delete(`/logs/${id}`);
  },

  // Delete all activity logs
  deleteAllActivityLogs: () => {
    return api.delete('/logs');
  },

  // Cleanup old logs
  cleanupOldLogs: (days = 90) => {
    return api.delete(`/logs/cleanup/old?days=${days}`);
  },

  // Get activity statistics
  getActivityStats: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    return api.get(`/logs/stats${queryString ? `?${queryString}` : ''}`);
  },
};

export default activityLogApi;

