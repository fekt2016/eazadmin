import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import RefundsPage from '../../features/refunds/RefundsPage';

const mockRefundsData = {
    data: {
        refunds: [
            {
                _id: 'ref1',
                order: { orderNumber: 'ORD-123' },
                buyer: { name: 'Customer One', email: 'cus1@example.com' },
                refundAmount: 100,
                status: 'pending',
                createdAt: '2024-01-01T00:00:00.000Z'
            }
        ]
    },
    pagination: { totalPages: 1, currentPage: 1, total: 1 }
};

// Mock the hooks
vi.mock('../../features/refunds/hooks/useAdminRefunds', () => ({
    useAdminRefundsList: vi.fn(() => ({
        data: mockRefundsData,
        isLoading: false,
        error: null,
        refetch: vi.fn()
    }))
}));

vi.mock('../../shared/hooks/useOrder', () => ({
    useGetAllOrders: vi.fn(() => ({
        data: { data: { results: [] } },
        isLoading: false,
        error: null,
        refetch: vi.fn()
    }))
}));

describe('RefundsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders refunds list correctly', async () => {
        renderWithProviders(<RefundsPage />);

        expect(screen.getByText('Refunds & Returns Management')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('ORD-123')).toBeInTheDocument();
            expect(screen.getByText('Customer One')).toBeInTheDocument();
        });
    });

    it('filters by search term', async () => {
        renderWithProviders(<RefundsPage />);

        const searchInput = screen.getByPlaceholderText(/Search by order number/i);
        fireEvent.change(searchInput, { target: { value: 'ORD-123' } });

        await waitFor(() => {
            expect(screen.getByText('ORD-123')).toBeInTheDocument();
        });
    });
});
