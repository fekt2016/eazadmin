import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PATHS } from "./routhPath";
import { LoadingSpinner } from "../components/LoadingSpinner";
import ProtectedRoute from "../routes/ProtectedRoute";
import ProductDetail from "../pages/ProductDetail";

const AdminLogin = lazy(() => import("../pages/AdminLogin"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const DashboardLayout = lazy(() => import("../layout/DashboardLayout"));
const OrdersPage = lazy(() => import("../pages/OrdersPage"));
const AllProductPage = lazy(() => import("../pages/AllProductPage"));
const CategoryPage = lazy(() => import("../pages/CategoryPage"));
const UsersPage = lazy(() => import("../pages/UsersPage"));
const PaymentPage = lazy(() => import("../pages/PaymentPage"));
const SellerRequests = lazy(() => import("../pages/SellerRequest"));
const ChatSupportPage = lazy(() => import("../pages/ChatSupportPage"));
const UsersActivityPage = lazy(() => import("../pages/UsersActivityPage"));
const OrderDetail = lazy(() => import("../pages/OrderDetail"));

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path={PATHS.LOGIN} element={<AdminLogin />} />
      <Route
        path={PATHS.DASHBOARD}
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner />}>
              <DashboardLayout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path={PATHS.ORDERS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <OrdersPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.ORDERDETAILS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <OrderDetail />
            </Suspense>
          }
        />
        <Route
          path={PATHS.PRODUCTS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AllProductPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.PRODUCTDETAILS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ProductDetail />
            </Suspense>
          }
        />
        <Route
          path={PATHS.CATEGORY}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <CategoryPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.USERS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <UsersPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.PAYMENTS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <PaymentPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.SELLERREQUEST}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <SellerRequests />
            </Suspense>
          }
        />
        <Route
          path={PATHS.CHAT_SUPPORT}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ChatSupportPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.ACTIVITY}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <UsersActivityPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
