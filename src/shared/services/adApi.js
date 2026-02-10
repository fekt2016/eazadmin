import api from "./api";

const unwrapAds = (response) => {
  if (!response) return [];

  const data = response.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.ads)) return data.ads;
  if (Array.isArray(data.data?.ads)) return data.data.ads;

  return [];
};

const adApi = {
  async uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post("/promotional-discounts/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const data = response?.data ?? {};
    return data.data?.imageUrl || data.imageUrl || "";
  },
  async getAds(params = {}) {
    const response = await api.get("/promotional-discounts", { params });
    return {
      raw: response,
      ads: unwrapAds(response),
    };
  },

  async createAd(payload) {
    const response = await api.post("/promotional-discounts", payload);
    return response?.data ?? response;
  },

  async updateAd(id, payload) {
    const response = await api.patch(`/promotional-discounts/${id}`, payload);
    return response?.data ?? response;
  },

  async deleteAd(id) {
    const response = await api.delete(`/promotional-discounts/${id}`);
    return response?.data ?? response;
  },
};

export default adApi;
