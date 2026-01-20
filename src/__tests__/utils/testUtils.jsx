/**
 * Test Utilities
 * 
 * Reusable utilities for testing React components with:
 * - React Query provider
 * - React Router (MemoryRouter)
 * - MSW handlers
 * 
 * Usage:
 * ```jsx
 * import { renderWithProviders } from '../utils/testUtils';
 * 
 * test('my component', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />, {
 *     initialRoute: '/dashboard',
 *   });
 * });
 * ```
 */

import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

/**
 * Create a test QueryClient with proper cleanup
 * CRITICAL: Each test gets a fresh QueryClient to prevent state leakage
 */
export const createTestQueryClient = (options = {}) => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests - we want to see failures immediately
        staleTime: 0, // Always consider data stale
        gcTime: 0, // Don't cache data
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...options.queries,
      },
      mutations: {
        retry: false,
        ...options.mutations,
      },
    },
    ...options,
  });
};

/**
 * Render component with all necessary providers
 * 
 * @param {ReactElement} ui - Component to render
 * @param {Object} options - Test options
 * @param {string} options.initialRoute - Initial route for MemoryRouter
 * @param {QueryClient} options.queryClient - Custom QueryClient
 * @returns {Object} Render result with utilities
 */
export const renderWithProviders = (
  ui,
  {
    initialRoute = '/',
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...renderResult,
    queryClient,
    // Helper to wait for queries to settle
    waitForQueries: async () => {
      await queryClient.refetchQueries();
    },
  };
};

/**
 * Wait for async operations to complete
 * CRITICAL: Use queueMicrotask instead of setTimeout to prevent timer leaks
 */
export const waitForAsync = () => new Promise((resolve) => queueMicrotask(resolve));

/**
 * Create mock admin data for tests
 */
export const createMockAdmin = (overrides = {}) => ({
  _id: 'admin123',
  id: 'admin123',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'admin',
  status: 'active',
  permissions: ['read', 'write', 'delete'],
  ...overrides,
});

export default {
  renderWithProviders,
  createTestQueryClient,
  createMockAdmin,
  waitForAsync,
};



