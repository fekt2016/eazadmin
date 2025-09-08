import { Navigate } from "react-router-dom";
import { memo, Suspense, useEffect, useMemo, useState } from "react";
import useAuth from "../hook/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";

const ProtectedRoutes = ({ children }) => {
  const { adminData, isLoading, error } = useAuth();

  const admin = useMemo(() => {
    return adminData?.data?.data?.data || adminData?.data?.data || null;
  }, [adminData]);
  const [localAuthCheck, setLocalAuthCheck] = useState(() => {
    return !!localStorage.getItem("authToken");
  });

  useEffect(() => {
    if (!isLoading) {
      setLocalAuthCheck(!!localStorage.getItem("authToken"));
    }
  }, [isLoading]);

  if (localAuthCheck && isLoading) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.error("Error fetching user data:", error);
    return (
      <Navigate
        to="/error"
        state={{ error: "Error fetching user data" }}
        replace
      />
    );
  }

  if (!admin || admin.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (admin.status !== "active") {
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
