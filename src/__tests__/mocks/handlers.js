/**
 * MSW Request Handlers
 * 
 * Mock handlers for all API endpoints used in the admin app.
 * These handlers simulate realistic backend responses.
 * 
 * CRITICAL: These handlers simulate cookie-based authentication.
 * - No localStorage tokens
 * - Cookies are simulated via response headers
 * - 401 responses indicate unauthenticated state
 */

import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:4000/api/v1';

// Mock admin data
const mockAdmin = {
  _id: 'admin123',
  id: 'admin123',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'admin',
  status: 'active',
  permissions: ['read', 'write', 'delete'],
};

// Track authentication state (simulates cookie)
let isAuthenticated = false;
let currentAdmin = null;

/**
 * Helper to check if request is authenticated
 * In real app, this would check cookies
 */
const checkAuth = (request) => {
  // Check for cookie in request headers
  const cookies = request.headers.get('cookie') || '';
  const hasAuthCookie = cookies.includes('admin_jwt') || cookies.includes('jwt');
  
  // Also check if we've set authentication state in tests
  return hasAuthCookie || isAuthenticated;
};

/**
 * Helper to set authentication state (for tests)
 */
export const setAuthenticated = (admin = mockAdmin) => {
  isAuthenticated = true;
  currentAdmin = admin;
};

/**
 * Helper to clear authentication state (for tests)
 */
export const clearAuthenticated = () => {
  isAuthenticated = false;
  currentAdmin = null;
};

export const handlers = [
  /**
   * Authentication Endpoints
   */
  
  // GET /admin/me - Get current admin
  http.get(`${API_BASE}/admin/me`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json(
        { status: 'fail', message: 'You are not logged in! Please log in to get access.' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      status: 'success',
      data: {
        data: currentAdmin || mockAdmin,
      },
    });
  }),

  // POST /admin/login - Login
  http.post(`${API_BASE}/admin/login`, async ({ request }) => {
    const body = await request.json();
    const { email, password } = body;
    
    // Simulate login validation
    if (email === 'admin@test.com' && password === 'password123') {
      setAuthenticated(mockAdmin);
      
      // Set cookie in response (simulated)
      return HttpResponse.json(
        {
          status: 'success',
          message: 'Login successful',
          user: mockAdmin,
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': 'admin_jwt=mock-jwt-token; Path=/; HttpOnly',
          },
        }
      );
    }
    
    return HttpResponse.json(
      { status: 'fail', message: 'Invalid email or password' },
      { status: 401 }
    );
  }),

  // POST /admin/logout - Logout
  http.post(`${API_BASE}/admin/logout`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json(
        { status: 'fail', message: 'You are not logged in!' },
        { status: 401 }
      );
    }
    
    clearAuthenticated();
    
    return HttpResponse.json(
      { status: 'success', message: 'Logged out successfully' },
      {
        headers: {
          'Set-Cookie': 'admin_jwt=; Path=/; HttpOnly; Max-Age=0',
        },
      }
    );
  }),

  /**
   * Admin Stats Endpoints
   */
  
  // GET /admin/stats - Get admin dashboard stats
  http.get(`${API_BASE}/admin/stats`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json(
        { status: 'fail', message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      status: 'success',
      data: {
        totalUsers: 1000,
        totalSellers: 500,
        totalOrders: 2000,
        totalRevenue: 50000,
      },
    });
  }),

  /**
   * User Management Endpoints
   */
  
  // GET /admin/users - Get all users
  http.get(`${API_BASE}/admin/users`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json(
        { status: 'fail', message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      status: 'success',
      data: {
        users: [],
      },
    });
  }),

  /**
   * Order Management Endpoints
   */
  
  // GET /admin/orders - Get all orders
  http.get(`${API_BASE}/admin/orders`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json(
        { status: 'fail', message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      status: 'success',
      data: {
        orders: [],
      },
    });
  }),

  /**
   * Seller Management Endpoints
   */
  
  // GET /admin/sellers - Get all sellers
  http.get(`${API_BASE}/admin/sellers`, ({ request }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json(
        { status: 'fail', message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      status: 'success',
      data: {
        sellers: [],
      },
    });
  }),
];



