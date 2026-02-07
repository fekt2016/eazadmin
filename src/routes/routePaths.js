/**
 * Route Paths Configuration for EazAdmin (Admin Backend Dashboard)
 * Centralized route definitions for admin dashboard
 */

// ---------- ADMIN ROUTES ----------
export const PATHS = {
  // Dashboard
  DASHBOARD: "/",
  HOME: "/dashboard",

  // Users Management
  USERS: "/users",
  USER_DETAIL: "/users/:id",
  USER_CREATE: "/users/new",

  // Sellers Management
  SELLERS: "/sellers",
  SELLER_DETAIL: "/sellers/:id",
  SELLER_CREATE: "/sellers/new",
  SELLER_VERIFICATION: "/sellers/verification",

  // Products Management
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/products/:id",
  PRODUCT_MODERATION: "/products/moderation",
  PRODUCT_REVIEWS: "/products/reviews",

  // Orders Management
  ORDERS: "/orders",
  ORDER_DETAIL: "/orders/:id",
  ORDER_ANALYTICS: "/orders/analytics",

  // Transactions
  TRANSACTIONS: "/transactions",
  TRANSACTION_DETAIL: "/transactions/:id",
  PAYOUTS: "/transactions/payouts",
  REFUNDS: "/transactions/refunds",

  // Categories & Content
  CATEGORIES: "/categories",
  CATEGORY_DETAIL: "/categories/:id",
  CATEGORY_CREATE: "/categories/new",
  BRANDS: "/brands",

  // EazShop Store
  EAZSHOP_STORE: "/eazshop",
  EAZSHOP_PRODUCTS: "/eazshop/products",
  EAZSHOP_ORDERS: "/eazshop/orders",
  EAZSHOP_SHIPPING: "/eazshop/shipping",
  EAZSHOP_PICKUP_CENTERS: "/eazshop/pickup-centers",

  // Coupons & Promotions
  COUPONS: "/coupons",
  COUPON_DETAIL: "/coupons/:id",
  COUPON_CREATE: "/coupons/new",
  PROMOTIONS: "/promotions",
  ADS: "/ads",

  // Reports & Analytics
  REPORTS: "/reports",
  SALES_REPORT: "/reports/sales",
  USER_REPORT: "/reports/users",
  PRODUCT_REPORT: "/reports/products",
  ANALYTICS: "/analytics",

  // Settings
  SETTINGS: "/settings",
  GENERAL_SETTINGS: "/settings/general",
  PAYMENT_SETTINGS: "/settings/payment",
  SHIPPING_SETTINGS: "/settings/shipping",
  NOTIFICATION_SETTINGS: "/settings/notifications",
  SEO_SETTINGS: "/settings/seo",

  // System
  SYSTEM_LOGS: "/system/logs",
  ACTIVITY_LOGS: "/system/activity",
  ERROR_LOGS: "/system/errors",
  BACKUP: "/system/backup",
  DEVICE_SESSIONS: "/device-sessions",

  // Support & Communication
  SUPPORT_TICKETS: "/support/tickets",
  TICKET_DETAIL: "/support/tickets/:id",
  ANNOUNCEMENTS: "/announcements",
  NOTIFICATIONS: "/notifications",

  // Auth
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",
};

// ---------- ROUTE CONFIG (SEO META) ----------
export const ROUTE_CONFIG = {
  [PATHS.DASHBOARD]: {
    title: "Admin Dashboard - Saiisai",
    description: "Manage the Saiisai platform",
    keywords: "admin, dashboard, Saiisai",
  },

  [PATHS.USERS]: {
    title: "Users Management - Admin | Saiisai",
    description: "Manage platform users",
    keywords: "users, admin, Saiisai",
  },

  [PATHS.USER_DETAIL]: {
    title: "User Details - Admin | Saiisai",
    description: "View and manage user account details",
    keywords: "user details, admin, EazShop",
  },

  [PATHS.SELLERS]: {
    title: "Sellers Management - Admin | Saiisai",
    description: "Manage seller accounts",
    keywords: "sellers, admin, EazShop",
  },

  [PATHS.SELLER_DETAIL]: {
    title: "Seller Details - Admin | Saiisai",
    description: "View and manage seller account details",
    keywords: "seller details, admin, EazShop",
  },

  [PATHS.SELLER_VERIFICATION]: {
    title: "Seller Verification - Admin | Saiisai",
    description: "Review and verify seller accounts",
    keywords: "seller verification, admin, EazShop",
  },

  [PATHS.PRODUCTS]: {
    title: "Products Management - Admin | Saiisai",
    description: "Moderate and manage products",
    keywords: "products, moderation, admin, EazShop",
  },

  [PATHS.PRODUCT_MODERATION]: {
    title: "Product Moderation - Admin | Saiisai",
    description: "Review and moderate product listings",
    keywords: "product moderation, admin, EazShop",
  },

  [PATHS.ORDERS]: {
    title: "Orders Management - Admin | Saiisai",
    description: "Manage platform orders",
    keywords: "orders, admin, EazShop",
  },

  [PATHS.ORDER_DETAIL]: {
    title: "Order Details - Admin | Saiisai",
    description: "View detailed order information",
    keywords: "order details, admin, EazShop",
  },

  [PATHS.TRANSACTIONS]: {
    title: "Transactions - Admin | Saiisai",
    description: "View and manage transactions",
    keywords: "transactions, admin, EazShop",
  },

  [PATHS.PAYOUTS]: {
    title: "Payouts - Admin | Saiisai",
    description: "Manage seller payouts",
    keywords: "payouts, admin, EazShop",
  },

  [PATHS.REFUNDS]: {
    title: "Refunds - Admin | Saiisai",
    description: "Manage refund requests and processing",
    keywords: "refunds, admin, EazShop",
  },

  [PATHS.CATEGORIES]: {
    title: "Categories - Admin | Saiisai",
    description: "Manage product categories",
    keywords: "categories, admin, Saiisai",
  },

  [PATHS.EAZSHOP_STORE]: {
    title: "EazShop - Admin | Saiisai",
    description: "Manage EazShop (company store)",
    keywords: "eazshop, company store, admin, Saiisai",
  },

  [PATHS.EAZSHOP_PRODUCTS]: {
    title: "EazShop Products - Admin | Saiisai",
    description: "Manage EazShop products",
    keywords: "eazshop products, admin, Saiisai",
  },

  [PATHS.COUPONS]: {
    title: "Coupons - Admin | Saiisai",
    description: "Manage discount coupons and promotions",
    keywords: "coupons, admin, Saiisai",
  },
  [PATHS.ADS]: {
    title: "Advertisements - Admin | Saiisai",
    description: "Create and manage buyer-facing advertisements",
    keywords: "advertisements, marketing, admin, Saiisai",
  },

  [PATHS.REPORTS]: {
    title: "Reports - Admin | Saiisai",
    description: "View platform reports and analytics",
    keywords: "reports, admin, Saiisai",
  },

  [PATHS.ANALYTICS]: {
    title: "Analytics - Admin | Saiisai",
    description: "View platform analytics and insights",
    keywords: "analytics, admin, Saiisai",
  },

  [PATHS.SETTINGS]: {
    title: "Settings - Admin | Saiisai",
    description: "Platform settings and configuration",
    keywords: "settings, admin, Saiisai",
  },

  [PATHS.SYSTEM_LOGS]: {
    title: "System Logs - Admin | Saiisai",
    description: "View system logs and activity",
    keywords: "logs, system, admin, Saiisai",
  },

  [PATHS.ACTIVITY_LOGS]: {
    title: "Activity Logs - Admin | Saiisai",
    description: "View user and system activity logs",
    keywords: "activity logs, admin, Saiisai",
  },

  [PATHS.SUPPORT_TICKETS]: {
    title: "Support Tickets - Admin | Saiisai",
    description: "Manage customer support tickets",
    keywords: "support tickets, admin, Saiisai",
  },
};

// ---------- NAVIGATION MENU ----------
export const NAVIGATION_MENU = {
  main: [
    { path: PATHS.DASHBOARD, label: "Dashboard", icon: "dashboard" },
    { path: PATHS.USERS, label: "Users", icon: "users" },
    { path: PATHS.SELLERS, label: "Sellers", icon: "sellers" },
    { path: PATHS.PRODUCTS, label: "Products", icon: "products" },
    { path: PATHS.ORDERS, label: "Orders", icon: "orders" },
    { path: PATHS.TRANSACTIONS, label: "Transactions", icon: "transactions" },
  ],

  content: [
    { path: PATHS.CATEGORIES, label: "Categories" },
    { path: PATHS.BRANDS, label: "Brands" },
    { path: PATHS.COUPONS, label: "Coupons" },
    { path: PATHS.ADS, label: "Advertisements" },
    { path: PATHS.PROMOTIONS, label: "Promotions" },
  ],

  eazshop: [
    { path: PATHS.EAZSHOP_STORE, label: "EazShop" },
    { path: PATHS.EAZSHOP_PRODUCTS, label: "Products" },
    { path: PATHS.EAZSHOP_ORDERS, label: "Orders" },
    { path: PATHS.EAZSHOP_SHIPPING, label: "Shipping" },
    { path: PATHS.EAZSHOP_PICKUP_CENTERS, label: "Pickup Centers" },
  ],

  analytics: [
    { path: PATHS.ANALYTICS, label: "Analytics" },
    { path: PATHS.REPORTS, label: "Reports" },
    { path: PATHS.SALES_REPORT, label: "Sales Report" },
    { path: PATHS.ORDER_ANALYTICS, label: "Order Analytics" },
  ],

  system: [
    { path: PATHS.SETTINGS, label: "Settings" },
    { path: PATHS.SYSTEM_LOGS, label: "System Logs" },
    { path: PATHS.ACTIVITY_LOGS, label: "Activity Logs" },
    { path: PATHS.ERROR_LOGS, label: "Error Logs" },
    { path: PATHS.BACKUP, label: "Backup" },
  ],

  support: [
    { path: PATHS.SUPPORT_TICKETS, label: "Support Tickets" },
    { path: PATHS.ANNOUNCEMENTS, label: "Announcements" },
    { path: PATHS.NOTIFICATIONS, label: "Notifications" },
  ],
};

export default PATHS;

