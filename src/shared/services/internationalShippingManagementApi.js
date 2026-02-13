import api from './api';

const BASE = '/admin/international-shipping';

export const internationalShippingManagementService = {
  // Configs
  getConfigs: async () => {
    const response = await api.get(`${BASE}/configs`);
    return response.data?.data?.configs ?? response.data?.configs ?? [];
  },

  getConfigByCountry: async (country) => {
    const response = await api.get(`${BASE}/configs/${encodeURIComponent(country)}`);
    return response.data?.data?.config ?? response.data?.config;
  },

  createConfig: async (data) => {
    const response = await api.post(`${BASE}/configs`, data);
    return response.data?.data?.config ?? response.data?.config;
  },

  updateConfig: async (country, data) => {
    const response = await api.patch(`${BASE}/configs/${encodeURIComponent(country)}`, data);
    return response.data?.data?.config ?? response.data?.config;
  },

  deleteConfig: async (country) => {
    await api.delete(`${BASE}/configs/${encodeURIComponent(country)}`);
  },

  // Import Duty by Category
  getDutyByCategory: async () => {
    const response = await api.get(`${BASE}/duty-by-category`);
    return response.data?.data?.rates ?? response.data?.rates ?? [];
  },

  createDutyByCategory: async (data) => {
    const response = await api.post(`${BASE}/duty-by-category`, data);
    return response.data?.data?.rate ?? response.data?.rate;
  },

  updateDutyByCategory: async (id, data) => {
    const response = await api.patch(`${BASE}/duty-by-category/${id}`, data);
    return response.data?.data?.rate ?? response.data?.rate;
  },

  deleteDutyByCategory: async (id) => {
    await api.delete(`${BASE}/duty-by-category/${id}`);
  },
};
