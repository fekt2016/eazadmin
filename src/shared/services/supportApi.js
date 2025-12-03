import api from './api';

/**
 * Support API Service
 * Full ticket management for admins (includes admin-only operations)
 */
export const supportService = {
  /**
   * Create a new support ticket
   * @param {Object} ticketData - Support ticket data
   * @returns {Promise} API response
   */
  createTicket: async (ticketData) => {
    const formData = new FormData();

    // Add text fields
    formData.append('department', ticketData.department);
    formData.append('title', ticketData.subject || ticketData.title);
    formData.append('message', ticketData.message);
    formData.append('priority', ticketData.priority || 'high');
    
    if (ticketData.issueType) {
      formData.append('issueType', ticketData.issueType);
    }
    if (ticketData.relatedOrderId) {
      formData.append('relatedOrderId', ticketData.relatedOrderId);
    }
    if (ticketData.relatedPayoutId) {
      formData.append('relatedPayoutId', ticketData.relatedPayoutId);
    }

    // Add attachments if provided
    if (ticketData.screenshot && ticketData.screenshot instanceof File) {
      formData.append('attachments', ticketData.screenshot);
    }
    if (ticketData.attachments && Array.isArray(ticketData.attachments)) {
      ticketData.attachments.forEach((file) => {
        if (file instanceof File) {
          formData.append('attachments', file);
        }
      });
    }

    const response = await api.post('/support/tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Get current user's tickets
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getMyTickets: async (params = {}) => {
    const response = await api.get('/support/tickets/my', { params });
    return response.data;
  },

  /**
   * Get single ticket by ID (admin can access any ticket)
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} API response
   */
  getTicketById: async (ticketId) => {
    const response = await api.get(`/support/tickets/${ticketId}`);
    return response.data;
  },

  /**
   * Reply to a ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} replyData - Reply data
   * @returns {Promise} API response
   */
  replyToTicket: async (ticketId, replyData) => {
    const formData = new FormData();
    formData.append('message', replyData.message);
    
    if (replyData.isInternal !== undefined) {
      formData.append('isInternal', replyData.isInternal);
    }

    // Add attachments if provided
    if (replyData.attachments && Array.isArray(replyData.attachments)) {
      replyData.attachments.forEach((file) => {
        if (file instanceof File) {
          formData.append('attachments', file);
        }
      });
    }

    const response = await api.post(`/support/tickets/${ticketId}/reply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Update ticket status (Admin only)
   * @param {string} ticketId - Ticket ID
   * @param {Object} updateData - Update data
   * @returns {Promise} API response
   */
  updateTicketStatus: async (ticketId, updateData) => {
    const response = await api.patch(`/support/tickets/${ticketId}/status`, updateData);
    return response.data;
  },

  /**
   * Get all tickets (Admin only)
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getAllTickets: async (params = {}) => {
    const response = await api.get('/support/admin/tickets', { params });
    return response.data;
  },

  /**
   * Get support statistics (Admin only)
   * @returns {Promise} API response
   */
  getSupportStats: async () => {
    const response = await api.get('/support/admin/stats');
    return response.data;
  },

  /**
   * Legacy method for backward compatibility
   */
  submitTicket: async (ticketData) => {
    return supportService.createTicket(ticketData);
  },
};

export default supportService;
