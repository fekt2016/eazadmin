import { Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PATHS } from "./routePath";
import PageSpinner from '../components/common/PageSpinner';
import ProtectedRoute from "../routes/protectedRoute";

const ProductDetail = lazy(() => import("../features/products/ProductDetail"));
const AdminLogin = lazy(() => import("../pages/auth/AdminLogin"));
const AdminRegister = lazy(() => import("../pages/auth/AdminRegister"));
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
const ShippingDashboardPage = lazy(() => import("../features/shipping/ShippingDashboardPage"));
const ShippingRateSettingsPage = lazy(() => import("../features/shipping/ShippingRateSettingsPage"));
const AdminOrderStatusPage = lazy(() => import("../features/orders/AdminOrderStatusPage"));
const DistanceOverviewPage = lazy(() => import("../features/shipping/DistanceOverviewPage"));
const EazShopLayout = lazy(() => import("../features/official-store/OfficialStoreLayout"));
const EazShopOverviewPage = lazy(() => import("../features/official-store/OfficialStoreOverviewPage"));
const EazShopProductsPage = lazy(() => import("../features/official-store/OfficialStoreProductsPage"));
const EazShopCreateProductPage = lazy(() => import("../features/official-store/OfficialStoreCreateProductPage"));
const EazShopOrdersPage = lazy(() => import("../features/official-store/OfficialStoreOrdersPage"));
const EazShopShippingFeesPage = lazy(() => import("../features/official-store/OfficialStoreShippingFeesPage"));
const PickupCentersPage = lazy(() => import("../features/official-store/PickupCentersPage"));
const EazShopTransactionsPage = lazy(() => import("../features/official-store/OfficialStoreTransactionsPage"));
const ReviewsPage = lazy(() => import("../features/reviews/ReviewsPage"));
const TestimonialsPage = lazy(() => import("../features/testimonials/TestimonialsPage"));
const TrackingPage = lazy(() => import("../features/orders/TrackingPage"));
const ActivityLogs = lazy(() => import("../pages/ActivityLogs"));
const RefundsPage = lazy(() => import("../features/refunds/RefundsPage"));
const RefundDetailPage = lazy(() => import("../features/refunds/pages/RefundDetailPage"));
const BalanceHistoryPage = lazy(() => import("../features/history/BalanceHistoryPage"));
const SellerCreditReconciliationPage = lazy(
  () => import("../features/history/SellerCreditReconciliationPage")
);
const AdminSupportPage = lazy(() => import("../pages/support/AdminSupportPage"));
const AdminTicketsPage = lazy(() => import("../pages/support/AdminTicketsPage"));
const AdminTicketDetailPage = lazy(() => import("../pages/support/AdminTicketDetailPage"));
const SitemapPage = lazy(() => import("../pages/sitemap/SitemapPage"));
const AdminNotificationsPage = lazy(() => import("../pages/notifications/AdminNotificationsPage"));
const AdminCouponDiscountPage = lazy(() => import("../pages/coupons/AdminCouponDiscountPage"));
const AdsManagementPage = lazy(() => import("../pages/ads/AdsManagementPage"));
const TaxReportPage = lazy(() => import("../features/tax/TaxReportPage"));
const StatusVideosPage = lazy(() => import("../features/status-videos/StatusVideosPage"));

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

const AccountPendingPage = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>Account Pending</h1>
    <p>Your admin account is currently pending approval.</p>
  </div>
);

const AccountInactivePage = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>Account Inactive</h1>
    <p>Your admin account has been deactivated. Please contact an administrator.</p>
  </div>
);

const UnauthorizedPage = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>Unauthorized</h1>
    <p>You do not have permission to access this page.</p>
  </div>
);

export default function AdminRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Admin login route - both / and /login so /login does not 404 */}
        <Route path={PATHS.LOGIN} element={<AdminLogin />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path={PATHS.REGISTER} element={<AdminRegister />} />
        <Route path="/register" element={<AdminRegister />} />

        {/* Password reset routes */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ProtectedRoute status pages */}
        <Route path="/account-pending" element={<AccountPendingPage />} />
        <Route path="/account-inactive" element={<AccountInactivePage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Tracking detail page - accessible at /tracking/:trackingNumber */}
        <Route
          path={PATHS.TRACKING_REDIRECT}
          element={
            <ProtectedRoute>
              <TrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.DASHBOARD}
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Dashboard />}
          />
          {/* Order detail routes - more specific routes must come first */}
          <Route
            path={PATHS.ORDERDETAILS}
            element={<OrderDetail />}
          />
          <Route
            path={PATHS.ORDER_DETAIL}
            element={<OrderDetail />}
          />
          <Route
            path={PATHS.ORDERS}
            element={<OrdersPage />}
          />
          <Route
            path={PATHS.ORDER_DETAIL}
            element={<OrderDetail />}
          />
          <Route
            path={PATHS.PRODUCTS}
            element={<AllProductPage />}
          />
          <Route
            path={PATHS.PRODUCTDETAILS}
            element={<ProductDetail />}
          />
          <Route
            path={PATHS.CATEGORY}
            element={<CategoryPage />}
          />
          <Route
            path={PATHS.ADS}
            element={<AdsManagementPage />}
          />
          <Route
            path={PATHS.STATUS_VIDEOS}
            element={<StatusVideosPage />}
          />
          {/* Redirect category/:id to categories page */}
          <Route
            path="category/:id"
            element={<Navigate to={`/dashboard/${PATHS.CATEGORY}`} replace />}
          />
          <Route
            path={PATHS.USERS}
            element={<UsersPage />}
          />
          <Route
            path={PATHS.USERDETAIL}
            element={<UserDetail />}
          />
          <Route
            path="/dashboard/sellers/balances"
            element={<SellerBalancesPage />}
          />
          <Route
            path={PATHS.SELLERDETAIL}
            element={<SellerDetailPage />}
          />
          <Route
            path={PATHS.ADMINDETAIL}
            element={<UserDetail />}
          />
          <Route
            path={PATHS.PAYMENTS}
            element={<PaymentPage />}
          />
          <Route
            path={PATHS.PAYMENTDETAIL}
            element={<PaymentRequestDetail />}
          />
          <Route
            path={PATHS.ACTIVITY}
            element={<UsersActivityPage />}
          />
          <Route
            path={PATHS.SHIPPING_RATES}
            element={<ShippingRatesPage />}
          />
          <Route
            path={PATHS.ORDER_STATUS}
            element={<AdminOrderStatusPage />}
          />
          <Route
            path={PATHS.DISTANCE_OVERVIEW}
            element={<DistanceOverviewPage />}
          />
          {/* EazShop: single section for products, orders, shipping, pickup */}
          <Route
            path={PATHS.OFFICIAL_STORE}
            element={<EazShopLayout />}
          >
            <Route
              index
              element={<EazShopOverviewPage />}
            />
            <Route
              path="products"
              element={<EazShopProductsPage />}
            />
            <Route
              path="products/new"
              element={<EazShopCreateProductPage />}
            />
            <Route
              path="orders"
              element={<EazShopOrdersPage />}
            />
            <Route
              path="shipping-fees"
              element={<EazShopShippingFeesPage />}
            />
            <Route
              path="pickup-centers"
              element={<PickupCentersPage />}
            />
            <Route
              path="transactions"
              element={<EazShopTransactionsPage />}
            />
          </Route>
          <Route
            path={PATHS.REVIEWS}
            element={<ReviewsPage />}
          />
          <Route
            path={PATHS.TESTIMONIALS}
            element={<TestimonialsPage />}
          />
          <Route
            path={PATHS.ACTIVITY_LOGS}
            element={<ActivityLogs />}
          />
          <Route
            path={PATHS.TRACKING}
            element={<TrackingPage />}
          />
          <Route
            path={PATHS.REFUNDS}
            element={<RefundsPage />}
          />
          <Route
            path={PATHS.REFUND_DETAIL}
            element={<RefundDetailPage />}
          />
          <Route
            path={PATHS.BALANCE_HISTORY}
            element={<BalanceHistoryPage />}
          />
          <Route
            path={PATHS.SELLER_CREDIT_RECONCILIATION}
            element={<SellerCreditReconciliationPage />}
          />
          <Route
            path={PATHS.SUPPORT}
            element={<AdminSupportPage />}
          />
          <Route
            path={PATHS.SUPPORT_TICKETS}
            element={<AdminTicketsPage />}
          />
          <Route
            path={PATHS.TICKET_DETAIL}
            element={<AdminTicketDetailPage />}
          />
          <Route
            path={PATHS.SITEMAP}
            element={<SitemapPage />}
          />
          <Route
            path={PATHS.NOTIFICATIONS}
            element={<AdminNotificationsPage />}
          />
          <Route
            path={PATHS.COUPONS}
            element={<AdminCouponDiscountPage />}
          />
          <Route
            path={PATHS.TAX}
            element={<TaxReportPage />}
          />
        </Route>
        <Route
          path="*"
          element={<AdminCatchAll />}
        />
      </Routes>
    </Suspense>
  );
}
