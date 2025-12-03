import api from './api';

const adminStatsApi = {
  getPlatformStats: () => api.get('/admin/stats'),
};

export default adminStatsApi;

