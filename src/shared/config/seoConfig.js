/**
 * SEO Configuration for Saysay (Admin Backend Dashboard)
 * All pages are set to noIndex and noFollow - admin should never appear in search engines
 */

const BASE_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_ADMIN_URL) || window.location.origin || 'https://admin.saysay.com';
const DEFAULT_IMAGE = `${BASE_URL}/images/saysay-admin-og.jpg`;
const DEFAULT_DESCRIPTION = 'Saysay Admin Dashboard - Manage the platform';

const seoConfig = {
  // ────────────────────────────────────────────────
  // Admin Dashboard
  // ────────────────────────────────────────────────
  dashboard: {
    title: 'Admin Dashboard - Saysay',
    description: 'Manage the Saysay platform',
    keywords: 'admin, dashboard, Saysay',
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
    title: 'Users Management - Admin | Saysay',
    description: 'Manage platform users',
    keywords: 'users, admin, Saysay',
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
    title: 'Sellers Management - Admin | Saysay',
    description: 'Manage seller accounts',
    keywords: 'sellers, admin, Saysay',
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
    title: 'Products Moderation - Admin | Saysay',
    description: 'Moderate and manage products',
    keywords: 'products, moderation, admin, Saysay',
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
    title: 'Orders Management - Admin | Saysay',
    description: 'Manage platform orders',
    keywords: 'orders, admin, Saysay',
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
    title: 'Transactions - Admin | Saysay',
    description: 'View and manage transactions',
    keywords: 'transactions, admin, Saysay',
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
    title: 'Settings - Admin | Saysay',
    description: 'Platform settings and configuration',
    keywords: 'settings, admin, Saysay',
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
    title: 'System Logs - Admin | Saysay',
    description: 'View system logs and activity',
    keywords: 'logs, system, admin, Saysay',
    image: DEFAULT_IMAGE,
    type: 'website',
    canonical: `${BASE_URL}/logs`,
    noIndex: true,
    noFollow: true,
  },
};

export default seoConfig;

