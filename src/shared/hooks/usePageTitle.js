import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Advanced SEO and Meta Tag Management Hook for EazAdmin
 * Automatically manages document title, meta tags, Open Graph, Twitter Cards, and JSON-LD
 * All admin pages are set to noIndex and noFollow by default
 */
export const usePageTitle = (config = {}) => {
  const location = useLocation();

  useEffect(() => {
    const {
      title = '',
      description = '',
      keywords = '',
      image = '',
      type = 'website',
      canonical = '',
      noIndex = true, // Always true for admin
      noFollow = true, // Always true for admin
      jsonLd = null,
    } = config;

    // Set document title
    if (title) {
      document.title = title;
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
    if (description) {
      createMetaTag('description', description);
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
    if (title) createMetaTag('og:title', title, true);
    if (description) createMetaTag('og:description', description, true);
    if (image) createMetaTag('og:image', image, true);
    createMetaTag('og:url', currentUrl, true);
    createMetaTag('og:type', type, true);
    createMetaTag('og:site_name', 'EazShop Admin', true);

    // Twitter Card tags
    createMetaTag('twitter:card', 'summary_large_image');
    if (title) createMetaTag('twitter:title', title);
    if (description) createMetaTag('twitter:description', description);
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
  }, [location.pathname, location.search, config]);
};

export default usePageTitle;

