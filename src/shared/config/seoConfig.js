/**
 * SEO Configuration for Saiisai (Admin Backend Dashboard)
 * All pages are set to noIndex and noFollow - admin should never appear in search engines
 */

const BASE_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_ADMIN_URL) || window.location.origin || 'https://admin.saiisai.com';
const DEFAULT_IMAGE = `${BASE_URL}/images/saiisai-admin-og.jpg`;
const DEFAULT_DESCRIPTION = 'Saiisai Admin Dashboard - Manage the platform';

const seoConfig = {
  // ────────────────────────────────────────────────
  // Admin Dashboard
  // ────────────────────────────────────────────────
  dashboard: {
    title: 'Admin Dashboard - Saiisai',
    description: 'Manage the Saiisai platform',
    keywords: 'admin, dashboard, Saiisai',
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
    title: 'Users Management - Admin | Saiisai',
    description: 'Manage platform users',
    keywords: 'users, admin, Saiisai',
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
    title: 'Sellers Management - Admin | Saiisai',
    description: 'Manage seller accounts',
    keywords: 'sellers, admin, Saiisai',
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
    title: 'Products Moderation - Admin | Saiisai',
    description: 'Moderate and manage products',
    keywords: 'products, moderation, admin, Saiisai',
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
    title: 'Orders Management - Admin | Saiisai',
    description: 'Manage platform orders',
    keywords: 'orders, admin, Saiisai',
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
    title: 'Transactions - Admin | Saiisai',
    description: 'View and manage transactions',
    keywords: 'transactions, admin, Saiisai',
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
    title: 'Settings - Admin | Saiisai',
    description: 'Platform settings and configuration',
    keywords: 'settings, admin, Saiisai',
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
    title: 'System Logs - Admin | Saiisai',
    description: 'View system logs and activity',
    keywords: 'logs, system, admin, Saiisai',
    image: DEFAULT_IMAGE,
    type: 'website',
    canonical: `${BASE_URL}/logs`,
    noIndex: true,
    noFollow: true,
  },
};

export default seoConfig;

