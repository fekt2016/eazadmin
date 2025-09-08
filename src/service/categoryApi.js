import api from "./api";

export const categoryService = {
  // Category endpoints
  getAllCategories: async (params = {}) => {
    const { page = 1, limit = 100 } = params;
    const response = await api.get("/categories", {
      params: {
        page,
        limit,
      },
    });
    return response;
  },
  getCategory: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
  createCategory: async (categoryData) => {
    const config =
      categoryData instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};
    const response = await api.post("/categories", categoryData, config);
    return response.data;
  },
  updateCategory: async (id, categoryData) => {
    const config =
      categoryData instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};
    const response = await api.put(`/categories/${id}`, categoryData, config);
    return response.data;
  },
  deleteCategory: async (id) => {
    await api.delete(`/categories/${id}`);
    return id;
  },
  getParentCategories: async () => {
    const response = await api.get("/categories/parents");
    return response.data;
  },
  //   getCategoryById: async (id) => {
  //     const response = await api.get(`/categories/${id}`);
  //     return response.data;
  //   },
};
