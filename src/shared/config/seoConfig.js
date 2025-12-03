/**
 * SEO Configuration for EazAdmin (Admin Backend Dashboard)
 * All pages are set to noIndex and noFollow - admin should never appear in search engines
 */

const BASE_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_ADMIN_URL) || window.location.origin || 'https://admin.eazshop.com';
const DEFAULT_IMAGE = `${BASE_URL}/images/eazshop-admin-og.jpg`;
const DEFAULT_DESCRIPTION = 'EazShop Admin Dashboard - Manage the platform';

const seoConfig = {
  // ────────────────────────────────────────────────
  // Admin Dashboard
  // ────────────────────────────────────────────────
  dashboard: {
    title: 'Admin Dashboard - EazShop',
    description: 'Manage the EazShop platform',
    keywords: 'admin, dashboard, EazShop',
    image: DEFAULT_IMAGE,
    type: 'website',
    canonical: `${BASE_URL}/dashboard`,
    noIndex: true,
    noFollow: true,
  },

  // ────────────────────────────────────────────────
  // Users Management
  // ────────────────────────────────────────────────
  users: {
    title: 'Users Management - Admin | EazShop',
    description: 'Manage platform users',
    keywords: 'users, admin, EazShop',
    image: DEFAULT_IMAGE,
    type: 'website',
    canonical: `${BASE_URL}/users`,
    noIndex: true,
    noFollow: true,
  },

  // ────────────────────────────────────────────────
  // Sellers Management
  // ────────────────────────────────────────────────
  sellers: {
    title: 'Sellers Management - Admin | EazShop',
    description: 'Manage seller accounts',
    keywords: 'sellers, admin, EazShop',
    image: DEFAULT_IMAGE,
    type: 'website',
    canonical: `${BASE_URL}/sellers`,
    noIndex: true,
    noFollow: true,
  },

  // ────────────────────────────────────────────────
  // Products Moderation
  // ────────────────────────────────────────────────
  products: {
    title: 'Products Moderation - Admin | EazShop',
    description: 'Moderate and manage products',
    keywords: 'products, moderation, admin, EazShop',
    image: DEFAULT_IMAGE,
    type: 'website',
    canonical: `${BASE_URL}/products`,
    noIndex: true,
    noFollow: true,
  },

  // ────────────────────────────────────────────────
  // Orders Management
  // ────────────────────────────────────────────────
  orders: {
    title: 'Orders Management - Admin | EazShop',
    description: 'Manage platform orders',
    keywords: 'orders, admin, EazShop',
    image: DEFAULT_IMAGE,
    type: 'website',
    canonical: `${BASE_URL}/orders`,
    noIndex: true,
    noFollow: true,
  },

  // ────────────────────────────────────────────────
  // Transactions
  // ────────────────────────────────────────────────
  transactions: {
    title: 'Transactions - Admin | EazShop',
    description: 'View and manage transactions',
    keywords: 'transactions, admin, EazShop',
    image: DEFAULT_IMAGE,
    type: 'website',
    canonical: `${BASE_URL}/transactions`,
    noIndex: true,
    noFollow: true,
  },

  // ────────────────────────────────────────────────
  // Settings
  // ────────────────────────────────────────────────
  settings: {
    title: 'Settings - Admin | EazShop',
    description: 'Platform settings and configuration',
    keywords: 'settings, admin, EazShop',
    image: DEFAULT_IMAGE,
    type: 'website',
    canonical: `${BASE_URL}/settings`,
    noIndex: true,
    noFollow: true,
  },

  // ────────────────────────────────────────────────
  // System Logs
  // ────────────────────────────────────────────────
  systemLogs: {
    title: 'System Logs - Admin | EazShop',
    description: 'View system logs and activity',
    keywords: 'logs, system, admin, EazShop',
    image: DEFAULT_IMAGE,
    type: 'website',
    canonical: `${BASE_URL}/logs`,
    noIndex: true,
    noFollow: true,
  },
};

export default seoConfig;

