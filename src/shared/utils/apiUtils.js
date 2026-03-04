/**
 * Normalizes API responses to handle various backend response structures.
 * Supports shapes like:
 * - { data: { data: { results: [...] } } }
 * - { data: { products: [...] } }
 * - { results: [...] }
 * - { data: [...] }
 * 
 * @param {any} response - The raw response from axios or the service.
 * @param {string} key - Optional key to look for (e.g., 'products', 'orders').
 * @returns {any} The normalized data (usually an array or a single object).
 */
export const normalizeApiResponse = (response, key = null) => {
    if (!response) return null;

    // Handle axios response envelope
    const body = response.data ?? response;

    // Try to find the inner data object
    const inner = body?.data ?? body;

    // Short-circuit for specific key if provided
    if (key && inner?.[key]) return inner[key];
    if (key && body?.[key]) return body[key];

    // Common list patterns
    if (inner?.results) return inner.results;
    if (inner?.data && Array.isArray(inner.data)) return inner.data;
    if (Array.isArray(inner)) return inner;

    // Single object patterns (common keys used in eazadmin)
    if (inner?.order) return inner.order;
    if (inner?.seller) return inner.seller;
    if (inner?.product) return inner.product;
    if (inner?.category) return inner.category;
    if (inner?.data && typeof inner.data === 'object' && !Array.isArray(inner.data)) return inner.data;

    // Fallback to the inner object itself or the body
    return inner ?? body;
};
