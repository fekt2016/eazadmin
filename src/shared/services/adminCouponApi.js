import api from './api';

const adminCouponApi = {
  getAllCoupons: async (params = {}) => {
    const response = await api.get('/admin/coupons', { params });
    return response.data;
  },
  getCouponById: async (couponId) => {
    const response = await api.get(`/admin/coupons/${couponId}`);
    return response.data;
  },
  createGlobalCoupon: async (couponData) => {
    const response = await api.post('/admin/coupons', couponData);
    return response.data;
  },
  deactivateCoupon: async (couponId) => {
    const response = await api.patch(`/admin/coupons/${couponId}/deactivate`);
    return response.data;
  },
  getCouponAnalytics: async (params = {}) => {
    const response = await api.get('/admin/coupons/analytics', { params });
    return response.data;
  },
};

export default adminCouponApi;

