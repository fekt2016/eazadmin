import api from './api';

const adminDiscountApi = {
  getAllDiscounts: async () => {
    const response = await api.get('/seller/discount');
    return response.data;
  },
  getDiscountById: async (discountId) => {
    const response = await api.get(`/seller/discount/${discountId}`);
    return response.data;
  },
  deleteDiscount: async (discountId) => {
    const response = await api.delete(`/seller/discount/${discountId}`);
    return response.data;
  },
  updateDiscount: async ({ id, data }) => {
    const response = await api.patch(`/seller/discount/${id}`, data);
    return response.data;
  },
};

export default adminDiscountApi;

