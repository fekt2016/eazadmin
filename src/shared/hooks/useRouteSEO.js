import { useLocation, useParams } from 'react-router-dom';
import usePageTitle from './usePageTitle';
import seoConfig from '../config/seoConfig';
import { ROUTE_CONFIG, PATHS } from '../../routes/routePaths';

/**
 * Automatic SEO hook that applies SEO based on current route
 * Works with both static and dynamic routes
 */
export const useRouteSEO = (customConfig = null) => {
  const location = useLocation();
  const params = useParams();

  // If custom config provided, use it
  if (customConfig) {
    usePageTitle(customConfig);
    return;
  }

  // Get base path (without params)
  let currentPath = location.pathname;
  
  // Replace dynamic params with route pattern for matching
  Object.keys(params).forEach((key) => {
    currentPath = currentPath.replace(`/${params[key]}`, `/:${key}`);
  });

  // Try to find exact match in ROUTE_CONFIG
  let routeConfig = ROUTE_CONFIG[currentPath];

  // If no exact match, use default admin dashboard config
  if (!routeConfig) {
    routeConfig = seoConfig.dashboard;
  } else {
    // Convert ROUTE_CONFIG to seoConfig format
    routeConfig = {
      ...routeConfig,
      canonical: `${window.location.origin}${location.pathname}`,
      noIndex: true,
      noFollow: true,
    };
  }

  usePageTitle(routeConfig);
};

export default useRouteSEO;

