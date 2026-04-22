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

  const routeConfig = (() => {
    if (customConfig) {
      return customConfig;
    }

    // Get base path (without params)
    let currentPath = location.pathname;

    // Replace dynamic params with route pattern for matching
    Object.keys(params).forEach((key) => {
      currentPath = currentPath.replace(`/${params[key]}`, `/:${key}`);
    });

    const matchedRouteConfig = ROUTE_CONFIG[currentPath];
    if (!matchedRouteConfig) {
      return seoConfig.dashboard;
    }

    return {
      ...matchedRouteConfig,
      canonical: `${window.location.origin}${location.pathname}`,
      noIndex: true,
      noFollow: true,
    };
  })();

  usePageTitle(routeConfig);
};

export default useRouteSEO;

