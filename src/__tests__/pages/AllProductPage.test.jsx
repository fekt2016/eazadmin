import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import AllProductPage from '../../features/products/AllProductPage';

/**
 * AllProductPage.test.jsx
 * 
 * Final Precision Fixes
 * - Specific selectors to avoid "Found multiple elements"
 * - Stable mutation references
 * - High timeouts for parallel reliability
 */

vi.setConfig({ testTimeout: 60000 });

const MOCK_PRODUCT = {
    _id: 'prod-123',
    id: 'prod-123',
    name: 'Test Product Alpha',
    price: 150.50,
    totalStock: 25,
    status: 'active',
    moderationStatus: 'approved',
    seller: { shopName: 'Alpha Seller' },
    parentCategory: { name: 'Electronics' },
    createdAt: '2024-01-01T00:00:00.000Z',
    imageCover: 'test-image.jpg'
};

const MOCK_API_RESPONSE = {
    status: 'success',
    results: 1,
    total: 1,
    data: { data: [MOCK_PRODUCT] }
};

const MOCK_CATEGORIES = {
    results: [{ _id: 'cat1', name: 'Electronics' }]
};

const STABLE_MUTATION = {
    isPending: false,
    mutateAsync: vi.fn(async () => ({ status: 'success' })),
    mutate: vi.fn()
};

const PRODUCT_HOOK_VALUE = {
    getProducts: { data: MOCK_API_RESPONSE, isLoading: false, error: null },
    approveProduct: STABLE_MUTATION,
    rejectProduct: STABLE_MUTATION,
    deleteProduct: STABLE_MUTATION
};

const EAZSHOP_HOOK_VALUE = {
    useMarkProductAsEazShop: vi.fn(() => STABLE_MUTATION),
    useUnmarkProductAsEazShop: vi.fn(() => STABLE_MUTATION)
};

const CATEGORY_HOOK_VALUE = {
    getCategories: { data: MOCK_CATEGORIES }
};

vi.mock('../../shared/hooks/useProduct', () => ({
    default: vi.fn(() => PRODUCT_HOOK_VALUE)
}));

vi.mock('../../shared/hooks/useEazShop', () => ({
    useEazShop: vi.fn(() => EAZSHOP_HOOK_VALUE)
}));

vi.mock('../../shared/hooks/useCategory', () => ({
    default: vi.fn(() => CATEGORY_HOOK_VALUE)
}));

vi.mock('react-toastify', () => ({
    toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('react-icons/fa', () => ({ FaAward: () => <span /> }));
vi.mock('react-icons/fi', () => ({
    FiEdit: () => <span />,
    FiEye: () => <span />,
    FiSearch: () => <span />,
    FiTrash2: () => <span />,
    FiCheck: () => <span />,
    FiX: () => <span />
}));

vi.mock('../../shared/components/OptimizedImage', () => ({
    default: ({ alt }) => <img alt={alt} src="mock.jpg" />
}));

vi.mock('../../shared/components/LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading">Loading...</div>
}));

console.log = vi.fn();
console.error = vi.fn();
console.warn = vi.fn();

import useProduct from '../../shared/hooks/useProduct';

describe('AllProductPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useProduct).mockReturnValue(PRODUCT_HOOK_VALUE);
    });

    it('renders products list accurately', async () => {
        renderWithProviders(<AllProductPage />);

        await waitFor(() => {
            // Use role based selector or more specific string to avoid TabButton match
            expect(screen.getByRole('heading', { name: /All Products/i })).toBeInTheDocument();
            expect(screen.getByText('Test Product Alpha')).toBeInTheDocument();
            expect(screen.getByText('Alpha Seller')).toBeInTheDocument();
        }, { timeout: 45000 });
    });

    it('handles moderation state rendering', async () => {
        const PENDING_RESPONSE = {
            ...MOCK_API_RESPONSE,
            data: { data: [{ ...MOCK_PRODUCT, moderationStatus: 'pending', name: 'Waitlist Item' }] }
        };

        vi.mocked(useProduct).mockReturnValue({
            ...PRODUCT_HOOK_VALUE,
            getProducts: { ...PRODUCT_HOOK_VALUE.getProducts, data: PENDING_RESPONSE }
        });

        renderWithProviders(<AllProductPage />);

        await waitFor(() => {
            expect(screen.getByText('Waitlist Item')).toBeInTheDocument();
            // Match the button specifically
            expect(screen.getByTitle(/Approve Product/i)).toBeInTheDocument();
        }, { timeout: 15000 });
    });

    it('performs search filter accurately', async () => {
        renderWithProviders(<AllProductPage />);

        const searchInput = screen.getByPlaceholderText(/search products/i);

        await waitFor(() => {
            expect(screen.getByText('Test Product Alpha')).toBeInTheDocument();
        });

        fireEvent.change(searchInput, { target: { value: 'Zyzzyva' } });

        await waitFor(() => {
            expect(screen.queryByText('Test Product Alpha')).not.toBeInTheDocument();
            // Use queryAll to check for existence of at least one "no products found" message
            // or use specific text from the TableCell
            expect(screen.queryAllByText(/No products found/i).length).toBeGreaterThan(0);
        }, { timeout: 15000 });
    });
});
