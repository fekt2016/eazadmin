import api from './api';

const adminStatsApi = {
  getPlatformStats: () => api.get('/admin/stats'),
  /** Logged-in admin: own eazadmin ActivityLog analytics (ops dashboard). */
  getMyActivityAnalytics: () => api.get('/admin/me/activity-analytics'),
};

export default adminStatsApi;

