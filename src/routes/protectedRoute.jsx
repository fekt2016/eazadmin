import { Navigate, useLocation } from "react-router-dom";
import { canAccessPage } from '../config/rolePermissions';
import { PATHS } from './routePath';
import { memo, Suspense, useMemo, useRef } from "react";
import useAuth from '../shared/hooks/useAuth';
import { LoadingSpinner } from '../shared/components/LoadingSpinner';
import { isLoginGraceActive } from '../shared/services/api';
import { toast } from "react-toastify";

const ProtectedRoutes = ({ children }) => {
  const location = useLocation();
  const { adminData, isLoading, isFetching, isError, error, refetchAuth } = useAuth();
  const refetchAttempted = useRef(false);

  // SECURITY: Cookie-only authentication - no token check needed
  // Backend validates session via HTTP-only cookie automatically

  // Extract admin data from nested response structure
  // Backend getMe: { status: 'success', data: { data: <admin> } } → axios: response.data.data.data
  // Login sets plain user: queryClient.setQueryData(["adminAuth"], user) → adminData is user
  const admin = useMemo(() => {
    if (!adminData) return null;
    const extracted =
      adminData?.data?.data?.data ||
      adminData?.data?.data ||
      adminData?.data ||
      adminData;
    return extracted || null;
  }, [adminData]);

  // Show loading spinner while fetching admin data
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Handle errors (auth query threw; 401/403 are caught in useAuth and return null → we hit !admin below)
  if (error) {
    // If it's a 401, redirect to login
    if (error?.response?.status === 401) {
      return <Navigate to="/" replace />;
    }
    return (
      <Navigate
        to="/unauthorized"
        state={{ error: "Error fetching user data" }}
        replace
      />
    );
  }

  // Check if admin exists and has allowed role
  const ALLOWED_ROLES = ["superadmin", "admin", "support_agent"];

  // No admin: getCurrentUser returned 401/403 or cache empty. Try one refetch before redirect (handles race / slow cookie).
  if (!admin) {
    // Within the post-login grace period, never redirect — the session is still settling.
    if (isLoginGraceActive()) {
      return <LoadingSpinner />;
    }
    if (!refetchAttempted.current) {
      refetchAttempted.current = true;
      refetchAuth();
      return <LoadingSpinner />;
    }
    if (isFetching) {
      return <LoadingSpinner />;
    }
    // Session confirmed expired — set the toast message before redirecting
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('eazadmin_login_message', 'Session expired. Please log in again.');
    }
    return <Navigate to="/" replace />;
  }
  refetchAttempted.current = false;

  // Role not in allowed list
  if (!ALLOWED_ROLES.includes(admin.role)) {
    return <Navigate to="/" replace />;
  }

  // Check admin status (only if status field exists)
  if (admin.status && admin.status !== "active") {
    return handleStatusRedirect(admin.status);
  }

  if (!canAccessPage(admin.role, location.pathname)) {
    if (
      typeof window !== 'undefined' &&
      location.pathname.startsWith('/dashboard/promos')
    ) {
      const key = 'eazadmin_promos_access_denied';
      if (!window.sessionStorage.getItem(key)) {
        window.sessionStorage.setItem(key, '1');
        toast.error('Access denied.');
      }
    }
    return <Navigate to={PATHS.DASHBOARD} replace />;
  }

  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
};

const statusRedirectMap = {
  pending: "/account-pending",
  inactive: "/account-inactive",
  default: "/unauthorized",
};

const handleStatusRedirect = (status) => {
  const path = statusRedirectMap[status] || statusRedirectMap.default;
  return <Navigate to={path} replace />;
};

const MemoizedProtectedRoutes = memo(ProtectedRoutes);
export default MemoizedProtectedRoutes;
export { MemoizedProtectedRoutes as ProtectedRoute };
