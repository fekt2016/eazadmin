import api from './api';

export const distanceAnalyzerService = {
  // Analyze distances for all zones
  // improved: true to use improved geocoding method
  analyzeAllZones: async (improved = true) => {
    const response = await api.get('/shipping-analysis/all-zones-distance', {
      params: { improved: improved ? 'true' : 'false' }
    });
    return response.data;
  },

  // Analyze and save distances to database
  // improved: true to use improved geocoding method
  analyzeAndSave: async (improved = true) => {
    const response = await api.post('/shipping-analysis/analyze-and-save', {
      improved
    });
    return response.data;
  },

  // Get saved distance records with pagination
  // params: { zone, sortBy, sortOrder, page, limit }
  getDistanceRecords: async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;
    const response = await api.get('/shipping-analysis/records', { 
      params: { 
        page, 
        limit, 
        ...otherParams 
      } 
    });
    return response.data;
  },
};

