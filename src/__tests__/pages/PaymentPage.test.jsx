import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import PaymentPage from '../../features/payment/PaymentPage';

const mockWithdrawalRequestsData = {
    data: {
        withdrawalRequests: [
            {
                _id: 'pay1',
                seller: { shopName: 'Seller One', _id: 's1' },
                amount: 1000,
                status: 'pending',
                createdAt: '2024-01-01T00:00:00.000Z',
                payoutMethod: 'bank',
                paymentDetails: { accountNumber: '123456789', bankName: 'Test Bank' }
            }
        ]
    }
};

// Mock the hooks
vi.mock('../../shared/hooks/usePayout', () => ({
    useGetWithdrawalRequests: vi.fn(() => ({
        data: mockWithdrawalRequestsData,
        isLoading: false,
        refetch: vi.fn()
    })),
    useApproveWithdrawalRequest: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useRejectWithdrawalRequest: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useVerifyTransferStatus: vi.fn(() => ({ mutate: vi.fn(), isPending: false }))
}));

describe('PaymentPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders withdrawal requests list correctly', async () => {
        renderWithProviders(<PaymentPage />);

        expect(screen.getByText('Withdrawal Requests')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getAllByText('Pending')[0]).toBeInTheDocument();
            // Using regex to be more flexible with formatting
            expect(screen.getByText(/1,000/)).toBeInTheDocument();
        });
    });

    it('filters by status', async () => {
        const { container } = renderWithProviders(<PaymentPage />);

        const statusSelect = container.querySelectorAll('select')[0]; // Status select is the first one
        fireEvent.change(statusSelect, { target: { value: 'paid' } });

        await waitFor(() => {
            // Since our mock only has pending, selecting 'paid' should show no results
            // Use getAllByText if there are multiple "not found" messages or just check the first one
            expect(screen.getAllByText(/No withdrawal requests found/i)[0]).toBeInTheDocument();
        });
    });

    it('filters by search term', async () => {
        renderWithProviders(<PaymentPage />);

        const searchInput = screen.getByPlaceholderText(/Search by seller or ID/i);
        fireEvent.change(searchInput, { target: { value: 'Seller One' } });

        await waitFor(() => {
            expect(screen.getByText('Seller One')).toBeInTheDocument();
        });
    });
});
