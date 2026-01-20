/**
 * MSW Server Setup
 * 
 * Mock Service Worker server for intercepting API requests in tests.
 * This allows us to test components without hitting the real backend.
 * 
 * Usage:
 * - Import server in test files
 * - Use server.use() to override handlers for specific tests
 * - Use server.resetHandlers() to reset between tests
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

// Create MSW server with all handlers
export const server = setupServer(...handlers);

// Note: Server lifecycle hooks (beforeAll, afterEach, afterAll) are handled in setup.js
// This file only exports the server instance for use in tests



