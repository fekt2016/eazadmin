import { Navigate } from "react-router-dom";
import { memo, Suspense, useEffect, useMemo, useState } from "react";
import useAuth from '../shared/hooks/useAuth';
import { LoadingSpinner } from '../shared/components/LoadingSpinner';

const ProtectedRoutes = ({ children }) => {
  const { adminData, isLoading, error } = useAuth();
  const token = localStorage.getItem("admin_token");

  // Extract admin data from nested response structure
  // Backend returns: { status: 'success', data: { data: <admin> } }
  // Axios wraps it: response = { data: { status: 'success', data: { data: <admin> } } }
  const admin = useMemo(() => {
    if (!adminData) return null;
    // Try different possible response structures
    const extracted = 
      adminData?.data?.data?.data ||  // Most common: response.data.data.data
      adminData?.data?.data ||         // Alternative: response.data.data
      adminData?.data ||               // Direct: response.data
      adminData;                       // Fallback: response itself
    
    return extracted || null;
  }, [adminData]);

  // If no token, immediately redirect to login
  if (!token) {
    console.log("[ProtectedRoute] No token found, redirecting to login");
    return <Navigate to="/" replace />;
  }

  // Show loading spinner while fetching admin data
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Handle errors
  if (error) {
    console.error("[ProtectedRoute] Error fetching user data:", error);
    // If it's a 401, redirect to login
    if (error?.response?.status === 401) {
      console.log("[ProtectedRoute] 401 error, redirecting to login");
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
  
  // If admin data is not available after loading, redirect to login
  if (!admin) {
    console.warn("[ProtectedRoute] No admin data found after loading. adminData:", adminData);
    return <Navigate to="/" replace />;
  }
  
  // Check if role is allowed
  if (!ALLOWED_ROLES.includes(admin.role)) {
    console.warn(`[ProtectedRoute] Role '${admin.role}' not allowed. Allowed roles: ${ALLOWED_ROLES.join(", ")}`);
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
