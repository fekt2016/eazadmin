// ─────────────────────────────────────────────────────────
// Saiisai Cloudinary Image Optimization — Phase 1
// Cloud: eazworld
// ─────────────────────────────────────────────────────────

const CLOUD_NAME = 'eazworld';
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

// ─── SLOT DEFINITIONS ────────────────────────────────────
export const IMAGE_SLOTS = {
    PRODUCT_CARD: { w: 400, h: 400, c: 'fill', g: 'auto', q: 'auto', f: 'auto', dpr: 'auto', objectFit: 'cover' },
    PRODUCT_DETAIL: { w: 800, h: 800, c: 'fit', g: 'auto', q: 'auto', f: 'auto', dpr: 'auto', objectFit: 'contain' },
    PRODUCT_THUMB: { w: 150, h: 150, c: 'fill', g: 'auto', q: 'auto', f: 'auto', dpr: 'auto', objectFit: 'cover' },
    HOME_HERO: { w: 1200, h: 480, c: 'fill', g: 'center', q: 'auto', f: 'auto', dpr: 'auto', objectFit: 'cover' },
    CATEGORY_HERO: { w: 1920, h: 600, c: 'fill', g: 'center', q: 'auto', f: 'auto', dpr: 'auto', objectFit: 'cover' },
    CATEGORY_ICON: { w: 200, h: 200, c: 'fill', g: 'auto', q: 'auto', f: 'auto', dpr: 'auto', objectFit: 'contain' },
    TABLE_THUMB: { w: 100, h: 100, c: 'fill', g: 'auto', q: 'auto', f: 'auto', dpr: 'auto', objectFit: 'cover' },
    FORM_PREVIEW: { w: 400, h: 400, c: 'fill', g: 'auto', q: 'auto', f: 'auto', dpr: 'auto', objectFit: 'contain' },
    AVATAR: { w: 200, h: 200, c: 'fill', g: 'face', q: 'auto', f: 'auto', dpr: 'auto', objectFit: 'cover' },
};

/**
 * Transforms a full Cloudinary URL by injecting parameters.
 * @param {string} url - Full Cloudinary URL from DB
 * @param {object} slot - Transformation parameters
 */
export const getOptimizedImageUrl = (url, slot, fallback = '/images/placeholder.png') => {
    if (!url || typeof url !== 'string') return fallback;

    // Only transform if it's a Cloudinary upload URL
    if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
        const parts = [];
        if (slot.w) parts.push(`w_${slot.w}`);
        if (slot.h) parts.push(`h_${slot.h}`);
        if (slot.c) parts.push(`c_${slot.c}`);
        if (slot.g) parts.push(`g_${slot.g}`);
        if (slot.q) parts.push(`q_${slot.q}`);
        if (slot.f) parts.push(`f_${slot.f}`);
        if (slot.dpr) parts.push(`dpr_${slot.dpr}`);
        if (slot.r) parts.push(`r_${slot.r}`);

        const transformation = parts.join(',');

        // Inject transformation after /upload/
        // Preserves version (v123...) and public_id (products/abc.jpg)
        return url.replace('/upload/', `/upload/${transformation}/`);
    }

    return url;
};

// Alias for convenience
export const imgUrl = getOptimizedImageUrl;

