import { Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PATHS } from "./routhPath";
import { LoadingSpinner } from '../shared/components/LoadingSpinner';
import ProtectedRoute from "../routes/protectedRoute";

const ProductDetail = lazy(() => import("../features/products/ProductDetail"));
const AdminLogin = lazy(() => import("../pages/auth/AdminLogin"));
const ForgotPasswordPage = lazy(() => import("../features/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../features/auth/ResetPasswordPage"));
const Dashboard = lazy(() => import("../features/Dashboard"));
const DashboardLayout = lazy(() => import("../shared/layout/DashboardLayout"));
const OrdersPage = lazy(() => import("../features/orders/OrdersPage"));
const AllProductPage = lazy(() => import("../features/products/AllProductPage"));
const CategoryPage = lazy(() => import("../features/categories/CategoryPage"));
const UsersPage = lazy(() => import("../features/users/UsersPage"));
const UserDetail = lazy(() => import("../features/users/UserDetail"));
const SellerDetailPage = lazy(() => import("../features/sellers/SellerDetailPage"));
const PaymentPage = lazy(() => import("../features/payment/PaymentPage"));
const PaymentRequestDetail = lazy(() => import("../features/payment/PaymentRequestDetail"));
const SellerBalancesPage = lazy(() => import("../features/sellers/SellerBalancesPage"));
const UsersActivityPage = lazy(() => import("../features/users/UsersActivityPage"));
const OrderDetail = lazy(() => import("../features/orders/OrderDetail"));
const ShippingRatesPage = lazy(() => import("../features/shipping/ShippingRatesPage"));
const AdminOrderStatusPage = lazy(() => import("../features/orders/AdminOrderStatusPage"));
const DistanceOverviewPage = lazy(() => import("../features/shipping/DistanceOverviewPage"));
const EazShopLayout = lazy(() => import("../features/eazshop/EazShopLayout"));
const EazShopOverviewPage = lazy(() => import("../features/eazshop/EazShopOverviewPage"));
const EazShopProductsPage = lazy(() => import("../features/eazshop/EazShopProductsPage"));
const EazShopCreateProductPage = lazy(() => import("../features/eazshop/EazShopCreateProductPage"));
const EazShopOrdersPage = lazy(() => import("../features/eazshop/EazShopOrdersPage"));
const EazShopShippingFeesPage = lazy(() => import("../features/eazshop/EazShopShippingFeesPage"));
const PickupCentersPage = lazy(() => import("../features/eazshop/PickupCentersPage"));
const ReviewsPage = lazy(() => import("../features/reviews/ReviewsPage"));
const TrackingPage = lazy(() => import("../features/orders/TrackingPage"));
const ActivityLogs = lazy(() => import("../pages/ActivityLogs"));
const PlatformSettings = lazy(() => import("../pages/settings/PlatformSettings"));
const DeviceSessionsPage = lazy(() => import("../features/sessions/DeviceSessionsPage"));
const RefundsPage = lazy(() => import("../features/refunds/RefundsPage"));
const RefundDetailPage = lazy(() => import("../features/refunds/pages/RefundDetailPage"));
const BalanceHistoryPage = lazy(() => import("../features/history/BalanceHistoryPage"));
const AdminSupportPage = lazy(() => import("../pages/support/AdminSupportPage"));
const AdminTicketsPage = lazy(() => import("../pages/support/AdminTicketsPage"));
const AdminTicketDetailPage = lazy(() => import("../pages/support/AdminTicketDetailPage"));
const SitemapPage = lazy(() => import("../pages/sitemap/SitemapPage"));
const AdminNotificationsPage = lazy(() => import("../pages/notifications/AdminNotificationsPage"));
const AdminCouponDiscountPage = lazy(() => import("../pages/coupons/AdminCouponDiscountPage"));
const AdsManagementPage = lazy(() => import("../pages/ads/AdsManagementPage"));


const AdminCatchAll = () => {
  const currentPath = window.location.pathname;

  // For unknown admin routes, show 404
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>404 - Admin Route Not Found</h1>
      <p>This is the admin dashboard. The route you're looking for may be in the main customer app.</p>
      <p style={{ marginTop: '20px', color: '#666' }}>
        Current path: <code>{currentPath}</code>
      </p>
    </div>
  );
};

export default function AdminRoutes() {

  
  return (
    <Routes>
      {/* Admin login route - both / and /login so /login does not 404 */}
      <Route path={PATHS.LOGIN} element={<AdminLogin />} />
      <Route path="/login" element={<AdminLogin />} />
      
      {/* Password reset routes */}
      <Route path="/forgot-password" element={
        <Suspense fallback={<LoadingSpinner />}>
          <ForgotPasswordPage />
        </Suspense>
      } />
      <Route path="/reset-password" element={
        <Suspense fallback={<LoadingSpinner />}>
          <ResetPasswordPage />
        </Suspense>
      } />
      
      {/* Tracking detail page - accessible at /tracking/:trackingNumber */}
      <Route 
        path={PATHS.TRACKING_REDIRECT} 
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner />}>
              <TrackingPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
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
        {/* Order detail routes - more specific routes must come first */}
        <Route
          path={PATHS.ORDERDETAILS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <OrderDetail />
            </Suspense>
          }
        />
        <Route
          path={PATHS.ORDER_DETAIL}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <OrderDetail />
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
          path={PATHS.ORDER_DETAIL}
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
          path={PATHS.ADS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdsManagementPage />
            </Suspense>
          }
        />
        {/* Redirect category/:id to categories page */}
        <Route
          path="category/:id"
          element={<Navigate to={`/dashboard/${PATHS.CATEGORY}`} replace />}
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
          path={PATHS.USERDETAIL}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <UserDetail />
            </Suspense>
          }
        />
        <Route
          path="/dashboard/sellers/balances"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <SellerBalancesPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.SELLERDETAIL}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <SellerDetailPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.ADMINDETAIL}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <UserDetail />
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
          path={PATHS.PAYMENTDETAIL}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <PaymentRequestDetail />
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
        <Route
          path={PATHS.SHIPPING_RATES}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ShippingRatesPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.ORDER_STATUS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminOrderStatusPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.DISTANCE_OVERVIEW}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <DistanceOverviewPage />
            </Suspense>
          }
        />
        {/* EazShop: single section for products, orders, shipping, pickup */}
        <Route
          path={PATHS.EAZSHOP}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <EazShopLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <EazShopOverviewPage />
              </Suspense>
            }
          />
          <Route
            path="products"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <EazShopProductsPage />
              </Suspense>
            }
          />
          <Route
            path="products/new"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <EazShopCreateProductPage />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <EazShopOrdersPage />
              </Suspense>
            }
          />
          <Route
            path="shipping-fees"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <EazShopShippingFeesPage />
              </Suspense>
            }
          />
          <Route
            path="pickup-centers"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <PickupCentersPage />
              </Suspense>
            }
          />
        </Route>
        <Route
          path={PATHS.REVIEWS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ReviewsPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.ACTIVITY_LOGS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ActivityLogs />
            </Suspense>
          }
        />
        <Route
          path={PATHS.TRACKING}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <TrackingPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.PLATFORM_SETTINGS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <PlatformSettings />
            </Suspense>
          }
        />
        <Route
          path={PATHS.DEVICE_SESSIONS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <DeviceSessionsPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.REFUNDS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <RefundsPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.REFUND_DETAIL}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <RefundDetailPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.BALANCE_HISTORY}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <BalanceHistoryPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.SUPPORT}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminSupportPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.SUPPORT_TICKETS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminTicketsPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.TICKET_DETAIL}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminTicketDetailPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.SITEMAP}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <SitemapPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.NOTIFICATIONS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminNotificationsPage />
            </Suspense>
          }
        />
        <Route
          path={PATHS.COUPONS}
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminCouponDiscountPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="*"
        element={<AdminCatchAll />}
      />
    </Routes>
  );
}
