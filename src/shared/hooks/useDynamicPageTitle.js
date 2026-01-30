import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Dynamic SEO and Meta Tag Management Hook for EazAdmin
 * Automatically manages document title, meta tags, Open Graph, Twitter Cards, and JSON-LD
 * Updates dynamically when data becomes available
 * All admin pages are set to noIndex and noFollow by default
 * 
 * @param {Object} config - SEO configuration
 * @param {string} config.title - Static title (used as fallback)
 * @param {string} config.dynamicTitle - Dynamic title (used when data is available)
 * @param {string} config.description - Static description (used as fallback)
 * @param {string} config.dynamicDescription - Dynamic description (used when data is available)
 * @param {string} config.defaultTitle - Default title when no data is available
 * @param {string} config.defaultDescription - Default description when no data is available
 * @param {string} config.keywords - SEO keywords
 * @param {string} config.image - Image URL for OG tags
 * @param {string} config.type - Open Graph type (default: 'website')
 * @param {string} config.canonical - Canonical URL
 * @param {boolean} config.noIndex - Whether to set noindex (default: true for admin)
 * @param {boolean} config.noFollow - Whether to set nofollow (default: true for admin)
 * @param {Object} config.jsonLd - JSON-LD structured data
 */
export const useDynamicPageTitle = (config = {}) => {
  const location = useLocation();

  useEffect(() => {
    const {
      title = '',
      dynamicTitle = '',
      description = '',
      dynamicDescription = '',
      defaultTitle = 'Admin Panel',
      defaultDescription = 'Saiisai Admin Dashboard',
      keywords = '',
      image = '',
      type = 'website',
      canonical = '',
      noIndex = true, // Always true for admin
      noFollow = true, // Always true for admin
      jsonLd = null,
    } = config;

    // Determine final title: dynamicTitle > title > defaultTitle
    const finalTitle = dynamicTitle || title || defaultTitle;
    
    // Determine final description: dynamicDescription > description > defaultDescription
    const finalDescription = dynamicDescription || description || defaultDescription;

    // Set document title
    if (finalTitle) {
      document.title = finalTitle;
    }

    // Clean up previous dynamic tags
    const existingTags = document.querySelectorAll('[data-dynamic="true"]');
    existingTags.forEach((tag) => tag.remove());

    // Base URL for canonical and og:url
    const baseUrl = window.location.origin;
    const currentUrl = canonical || `${baseUrl}${location.pathname}${location.search}`;

    // Helper function to create meta tags
    const createMetaTag = (name, content, property = false) => {
      if (!content) return;
      const tag = document.createElement('meta');
      if (property) {
        tag.setAttribute('property', name);
      } else {
        tag.setAttribute('name', name);
      }
      tag.setAttribute('content', content);
      tag.setAttribute('data-dynamic', 'true');
      document.head.appendChild(tag);
    };

    // Basic meta tags
    if (finalDescription) {
      createMetaTag('description', finalDescription);
    }
    if (keywords) {
      createMetaTag('keywords', keywords);
    }

    // Robots meta (always noIndex and noFollow for admin)
    const robotsContent = [];
    if (noIndex) robotsContent.push('noindex');
    if (noFollow) robotsContent.push('nofollow');
    createMetaTag('robots', robotsContent.join(', '));

    // Open Graph tags
    if (finalTitle) createMetaTag('og:title', finalTitle, true);
    if (finalDescription) createMetaTag('og:description', finalDescription, true);
    if (image) createMetaTag('og:image', image, true);
    createMetaTag('og:url', currentUrl, true);
    createMetaTag('og:type', type, true);
    createMetaTag('og:site_name', 'Saiisai Admin', true);

    // Twitter Card tags
    createMetaTag('twitter:card', 'summary_large_image');
    if (finalTitle) createMetaTag('twitter:title', finalTitle);
    if (finalDescription) createMetaTag('twitter:description', finalDescription);
    if (image) createMetaTag('twitter:image', image);

    // Canonical link
    if (canonical || location.pathname) {
      const canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', currentUrl);
      canonicalLink.setAttribute('data-dynamic', 'true');
      document.head.appendChild(canonicalLink);
    }

    // JSON-LD structured data
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-dynamic', 'true');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      const dynamicTags = document.querySelectorAll('[data-dynamic="true"]');
      dynamicTags.forEach((tag) => tag.remove());
    };
  }, [location.pathname, location.search, config.dynamicTitle, config.dynamicDescription, config.title, config.description, config.image, config.jsonLd]);
};

export default useDynamicPageTitle;

