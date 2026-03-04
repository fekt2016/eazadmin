import { Navigate } from "react-router-dom";
import { memo, Suspense, useMemo, useRef } from "react";
import useAuth from '../shared/hooks/useAuth';
import { LoadingSpinner } from '../shared/components/LoadingSpinner';

const ProtectedRoutes = ({ children }) => {
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
    console.error("[ProtectedRoute] REDIRECT CAUSE: auth query error", { status: error?.response?.status, pathname: typeof window !== "undefined" ? window.location.pathname : "" });
    // If it's a 401, redirect to login
    if (error?.response?.status === 401) {
      return <Navigate to="/" replace />;
    }
    return (
      <Navigate
        to="/error"
        state={{ error: "Error fetching user data" }}
        replace
      />
    );
  }

  // Check if admin exists and has allowed role
  const ALLOWED_ROLES = ["superadmin", "admin", "moderator"];

  // No admin: getCurrentUser returned 401/403 or cache empty. Try one refetch before redirect (handles race / slow cookie).
  if (!admin) {
    if (!refetchAttempted.current) {
      refetchAttempted.current = true;
      refetchAuth();
      return <LoadingSpinner />;
    }
    if (isFetching) {
      return <LoadingSpinner />;
    }
    console.warn("[ProtectedRoute] REDIRECT CAUSE: no admin data after refetch. adminData:", adminData);
    return <Navigate to="/" replace />;
  }
  refetchAttempted.current = false;

  // Role not in allowed list
  if (!ALLOWED_ROLES.includes(admin.role)) {
    console.warn("[ProtectedRoute] REDIRECT CAUSE: role not allowed", { role: admin.role, allowed: ALLOWED_ROLES });
    return <Navigate to="/" replace />;
  }

  // Check admin status (only if status field exists)
  if (admin.status && admin.status !== "active") {
    return handleStatusRedirect(admin.status);
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
