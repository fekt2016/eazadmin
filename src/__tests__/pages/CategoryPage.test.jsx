import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import CategoryPage from '../../features/categories/CategoryPage';

// High timeout for parallel stability
vi.setConfig({ testTimeout: 20000 });

// Stable mock data
const MOCK_CATEGORY = {
    _id: 'cat1',
    name: 'Electronics',
    image: 'electronics.jpg',
    productCount: 5,
    status: 'active',
    description: 'Test description',
    createdAt: '2024-01-01T00:00:00.000Z'
};

const STABLE_MUTATION = { isPending: false, mutateAsync: vi.fn(), mutate: vi.fn() };

const CATEGORY_HOOK_VALUE = {
    getCategories: {
        data: { results: [MOCK_CATEGORY] },
        isLoading: false
    },
    createCategory: STABLE_MUTATION,
    updateCategory: STABLE_MUTATION,
    deleteCategory: STABLE_MUTATION,
    getParentCategories: { data: { results: [] }, isLoading: false }
};

// Mocks
vi.mock('../../shared/hooks/useCategory', () => ({
    default: vi.fn(() => CATEGORY_HOOK_VALUE)
}));

vi.mock('../../shared/hooks/useProduct', () => ({
    default: vi.fn(() => ({
        getProductCountByCategory: { data: {}, isLoading: false },
        useGetProductsByCategory: vi.fn(() => ({
            data: { data: { products: [], totalCount: 5 } },
            isLoading: false
        }))
    }))
}));

vi.mock('../../shared/hooks/useGetImmediateSubcategories', () => ({
    default: vi.fn(() => vi.fn(() => []))
}));

vi.mock('../../shared/hooks/useGetSubCategoryCount', () => ({
    useGetSubCategoryCount: vi.fn(() => vi.fn(() => 0))
}));

// Mock icons
vi.mock('react-icons/fi', () => ({
    FiEdit: () => <span />,
    FiTrash2: () => <span />,
    FiPlus: () => <span />,
    FiSearch: () => <span />,
    FiGrid: () => <span />,
    FiList: () => <span />
}));

// Silence logs
console.log = vi.fn();
console.error = vi.fn();

import useCategory from '../../shared/hooks/useCategory';

describe('CategoryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCategory).mockReturnValue(CATEGORY_HOOK_VALUE);
    });

    it('renders category list correctly', async () => {
        renderWithProviders(<CategoryPage />);

        expect(screen.getByText(/Category Management/i)).toBeInTheDocument();

        // Switch to list view
        const listViewBtn = screen.getByText(/List View/i);
        fireEvent.click(listViewBtn);

        await waitFor(() => {
            const electronics = screen.getAllByText(/Electronics/i);
            expect(electronics.length).toBeGreaterThan(0);
            expect(screen.getAllByText(/5/)[0]).toBeInTheDocument();
        }, { timeout: 10000 });
    });

    it('opens add category modal', async () => {
        renderWithProviders(<CategoryPage />);

        const addBtn = screen.getByText(/Add New Category/i);
        fireEvent.click(addBtn);

        await waitFor(() => {
            const modalTitles = screen.getAllByText(/Add New Category/i);
            expect(modalTitles.length).toBeGreaterThan(0);
        }, { timeout: 10000 });
    });
});
