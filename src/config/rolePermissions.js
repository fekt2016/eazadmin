/**
 * eazadmin route access by admin role (aligned with backend RBAC).
 */

const DASHBOARD_BASE = '/dashboard';

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  support_agent: 'Support Agent',
};

/** Prefix paths each support_agent may open (prefix match). */
const SUPPORT_AGENT_PATH_PREFIXES = [
  DASHBOARD_BASE,
  `${DASHBOARD_BASE}/orders`,
  `${DASHBOARD_BASE}/support`,
  `${DASHBOARD_BASE}/live-chat`,
  '/tracking',
];

/** Path prefixes only superadmin may open (admin is blocked). */
const SUPERADMIN_PATH_PREFIXES = [
  `${DASHBOARD_BASE}/seller-credit-reconciliation`,
  `${DASHBOARD_BASE}/device-sessions`,
  `${DASHBOARD_BASE}/shipping-rates`,
  `${DASHBOARD_BASE}/distance-overview`,
  `${DASHBOARD_BASE}/official-store/shipping-fees`,
  `${DASHBOARD_BASE}/official-store/pickup-centers`,
];

function pathMatchesPrefix(pathname, prefix) {
  if (!pathname) return false;
  const p =
    pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;
  return p === prefix || p.startsWith(`${prefix}/`);
}

function normalizeRole(role) {
  if (role === 'moderator') return 'support_agent';
  return role;
}

/**
 * Whether the signed-in admin may open this browser path.
 * @param {string} role
 * @param {string} pathname — location.pathname
 */
export function canAccessPage(role, pathname) {
  if (!pathname) return true;
  const r = normalizeRole(role);
  if (r === 'superadmin') return true;

  if (r === 'admin') {
    for (let i = 0; i < SUPERADMIN_PATH_PREFIXES.length; i += 1) {
      if (pathMatchesPrefix(pathname, SUPERADMIN_PATH_PREFIXES[i])) {
        return false;
      }
    }
    return (
      pathname.startsWith(DASHBOARD_BASE) || pathname.startsWith('/tracking')
    );
  }

  if (r === 'support_agent') {
    return SUPPORT_AGENT_PATH_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
  }

  return false;
}

/** @deprecated Use canAccessPage — same behavior */
export const canAccessAdminPath = canAccessPage;

export { SUPERADMIN_PATH_PREFIXES, DASHBOARD_BASE };

export function isSuperadminOnlyPath(menuPath) {
  return SUPERADMIN_PATH_PREFIXES.some((prefix) =>
    pathMatchesPrefix(menuPath, prefix),
  );
}
