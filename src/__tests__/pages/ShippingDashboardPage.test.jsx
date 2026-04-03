import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import ShippingDashboardPage from '../../features/shipping/ShippingDashboardPage';

// Mock the hooks
vi.mock('../../shared/hooks/useOfficialStore', () => ({
  useOfficialStore: () => ({
    useGetOfficialStoreShippingFees: () => ({
      data: {
        sameCity: 25,
        crossCity: 35,
        heavyItem: 60,
        freeDeliveryThreshold: 100,
      },
      isLoading: false,
    }),
    useUpdateOfficialStoreShippingFees: () => ({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    }),
  }),
}));

vi.mock('../../hooks/useShipping', () => ({
    useGetShippingCharges: vi.fn(() => ({
        data: {
            data: [
                {
                    _id: 'ch1',
                    orderId: { orderNumber: 'ORD-SHIP-1' },
                    totalShippingAmount: 50,
                    platformCut: 5,
                    platformCutRate: 10,
                    dispatcherPayout: 45,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                }
            ],
            pagination: { totalPages: 1, page: 1, limit: 10 },
            total: 1
        },
        isLoading: false,
        refetch: vi.fn()
    })),
    useGetShippingChargesSummary: vi.fn(() => ({
        data: {
            data: {
                totalShippingRevenue: 1000,
                totalPlatformCut: 100,
                totalDispatcherPayoutPaid: 800,
                totalDispatcherPayoutPending: 100
            }
        },
        isLoading: false
    })),
    useSettleShippingCharge: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false }))
}));

describe('ShippingDashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders shipping statistics and charges correctly', async () => {
        renderWithProviders(<ShippingDashboardPage />);

        expect(screen.getByText('Shipping Dashboard')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Gh₵1000.00')).toBeInTheDocument();
            expect(screen.getByText('ORD-SHIP-1')).toBeInTheDocument();
            expect(screen.getByText('Gh₵50.00')).toBeInTheDocument();
        });
    });

    it('filters by status', async () => {
        const { container } = renderWithProviders(<ShippingDashboardPage />);

        const statusSelect = container.querySelectorAll('select')[0];
        fireEvent.change(statusSelect, { target: { value: 'settled' } });

        await waitFor(() => {
            expect(screen.getByText('All Statuses')).toBeInTheDocument();
        });
    });

    it('opens settlement confirmation modal', async () => {
        renderWithProviders(<ShippingDashboardPage />);

        await waitFor(() => {
            const settleButton = screen.getByText(/Settle Payout/i);
            fireEvent.click(settleButton);
        });

        expect(screen.getByText(/Settle Dispatcher Payout/i)).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to mark this payout/i)).toBeInTheDocument();
    });
});
