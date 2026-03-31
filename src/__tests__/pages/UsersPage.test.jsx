import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import UsersPage from '../../features/users/UsersPage';

// Use global testTimeout (15000) - tests need time for async render

// Stable mock data
const MOCK_USERS_DATA = {
    results: [
        {
            _id: 'u1',
            name: 'User One',
            role: 'user',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z'
        }
    ],
    meta: { total: 1 }
};

const MOCK_SELLERS_DATA = { results: [], meta: { total: 0 } };
const MOCK_ADMINS_DATA = { results: [], meta: { total: 0 } };

// Stable hook return objects
const SELLER_ADMIN_MOCK = {
    sellers: MOCK_SELLERS_DATA,
    isSellerLoading: false,
    totalSellers: 0,
    setPage: vi.fn(),
    setSearchValue: vi.fn(),
    setSort: vi.fn(),
    sort: 'createdAt:desc',
    searchValue: '',
    approveVerification: vi.fn(),
    rejectVerification: vi.fn(),
    approvePayout: vi.fn(),
    rejectPayout: vi.fn(),
    meta: { total: 0 },
    page: 1
};

const USERS_ADMIN_MOCK = {
    users: MOCK_USERS_DATA,
    isLoading: false,
    totalUsers: 1
};

const ADMINS_ADMIN_MOCK = {
    admins: MOCK_ADMINS_DATA,
    isLoading: false,
    totalAdmins: 0
};

// Module level mocks
vi.mock('../../shared/hooks/useSellerAdmin', () => ({
    default: vi.fn(() => SELLER_ADMIN_MOCK)
}));

vi.mock('../../shared/hooks/useUsersAdmin', () => ({
    default: vi.fn(() => USERS_ADMIN_MOCK)
}));

vi.mock('../../shared/hooks/useAdminsAdmin', () => ({
    default: vi.fn(() => ADMINS_ADMIN_MOCK)
}));

vi.mock('../../shared/hooks/useSellerBalance', () => ({
    useResetSellerBalance: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false }))
}));

// Silence logs
console.log = vi.fn();
console.error = vi.fn();

import useSellerAdmin from '../../shared/hooks/useSellerAdmin';
import useUsersAdmin from '../../shared/hooks/useUsersAdmin';
import useAdminsAdmin from '../../shared/hooks/useAdminsAdmin';

describe('UsersPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useSellerAdmin).mockReturnValue(SELLER_ADMIN_MOCK);
        vi.mocked(useUsersAdmin).mockReturnValue(USERS_ADMIN_MOCK);
        vi.mocked(useAdminsAdmin).mockReturnValue(ADMINS_ADMIN_MOCK);
    });

    it('renders users tab by default', async () => {
        renderWithProviders(<UsersPage />);

        await waitFor(() => {
            expect(screen.getByText(/User Management/i)).toBeInTheDocument();
        }, { timeout: 10000 });
        await waitFor(() => {
            expect(screen.getByText(/User One/i)).toBeInTheDocument();
        }, { timeout: 10000 });
    }, 35000);

    it('switches to sellers tab', async () => {
        renderWithProviders(<UsersPage />);

        const sellersTab = screen.getByText(/Sellers/i);
        fireEvent.click(sellersTab);

        await waitFor(() => {
            expect(screen.getByText(/Total Sellers/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('opens add user modal', async () => {
        renderWithProviders(<UsersPage />);

        await waitFor(() => {
            expect(screen.getByText(/Add New User/i)).toBeInTheDocument();
        }, { timeout: 10000 });

        const addBtn = screen.getByText(/Add New User/i);
        fireEvent.click(addBtn);

        await waitFor(() => {
            expect(screen.getByText(/Create New Account/i)).toBeInTheDocument();
        }, { timeout: 10000 });
    }, 35000);
});
