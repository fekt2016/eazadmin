import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import Dashboard from '../../features/Dashboard';

// Mock the hooks
vi.mock('../../shared/hooks/useAdminStats', () => ({
    default: vi.fn(),
}));

vi.mock('../../shared/hooks/useOrder', () => ({
    useGetAllOrders: vi.fn(),
}));

vi.mock('../../shared/hooks/useGetTopSellers', () => ({
    useGetTopSellers: vi.fn(),
}));

// Mock the services
vi.mock('../../shared/services/orderApi', () => ({
    orderService: {
        backfillSellerCredits: vi.fn(),
    },
}));

import useAdminStats from '../../shared/hooks/useAdminStats';
import { useGetAllOrders } from '../../shared/hooks/useOrder';
import { useGetTopSellers } from '../../shared/hooks/useGetTopSellers';

describe('Admin Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementation
        useAdminStats.mockReturnValue({
            data: {
                totalRevenue: 50000,
                todayRevenue: 1200,
                totalOrders: 150,
                totalDeliveredOrders: 120,
                thisMonthRevenue: 15000,
                last30DaysRevenue: 14500,
                totalPendingOrders: 30,
                revenueGraphData: [],
            },
            isLoading: false,
            error: null,
        });

        useGetAllOrders.mockReturnValue({
            data: {
                data: {
                    results: [
                        {
                            _id: '1',
                            orderNumber: 'ORD-001',
                            createdAt: new Date().toISOString(),
                            totalPrice: 250,
                            orderStatus: 'delivered',
                            user: { name: 'John Doe' },
                        },
                    ],
                },
            },
            isLoading: false,
            error: null,
        });

        useGetTopSellers.mockReturnValue({
            data: {
                data: {
                    results: [],
                },
            },
            isLoading: false,
        });
    });

    it('renders dashboard metrics correctly', async () => {
        renderWithProviders(<Dashboard />);

        expect(screen.getByText(/Welcome back, Admin!/i)).toBeInTheDocument();
        expect(screen.getByText(/GH₵50,000/i)).toBeInTheDocument();
        expect(screen.getByText(/150/i)).toBeInTheDocument();
        expect(screen.getByText(/120 delivered/i)).toBeInTheDocument();
    });

    it('renders recent orders', async () => {
        renderWithProviders(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('ORD-001')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('GH₵250.00')).toBeInTheDocument();
        });
    });

    it('shows loading state', () => {
        useAdminStats.mockReturnValue({ isLoading: true });
        useGetAllOrders.mockReturnValue({ isLoading: true });
        useGetTopSellers.mockReturnValue({ isLoading: true });

        renderWithProviders(<Dashboard />);
        expect(screen.getByText(/Loading dashboard.../i)).toBeInTheDocument();
    });

    it('shows error state when stats fail', () => {
        useAdminStats.mockReturnValue({
            isLoading: false,
            error: { message: 'Failed to fetch stats' },
        });

        renderWithProviders(<Dashboard />);
        expect(screen.getByText(/Failed to load statistics/i)).toBeInTheDocument();
    });
});
