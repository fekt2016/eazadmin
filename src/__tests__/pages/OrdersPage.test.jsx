import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import OrdersPage from '../../features/orders/OrdersPage';

// Mock the hooks
const mockRefetch = vi.fn().mockResolvedValue({});
vi.mock('../../shared/hooks/useOrder', () => ({
    useGetAllOrders: vi.fn(() => ({
        data: {
            data: {
                data: [
                    {
                        _id: 'order1',
                        orderNumber: 'ORD-123',
                        createdAt: new Date().toISOString(),
                        totalPrice: 500,
                        orderStatus: 'pending',
                        user: { name: 'Jane Doe' }
                    }
                ],
                total: 1
            }
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch
    })),
    useGetOrderStats: vi.fn(() => ({
        data: {
            data: {
                totalOrders: 100,
                pendingCount: 20,
                processing: 10,
                shipped: 30,
                delivered: 40,
                cancelled: 0
            }
        },
        isLoading: false
    })),
    useDeleteOrder: vi.fn(() => ({
        isPending: false,
        mutateAsync: vi.fn()
    }))
}));

describe('OrdersPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders orders list correctly', async () => {
        renderWithProviders(<OrdersPage />);

        // Title is singular "Order Management" in this feature
        const titles = screen.getAllByRole('heading', { name: /Order Management/i });
        expect(titles.length).toBeGreaterThan(0);
        expect(titles[0]).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/ORD-123/i)).toBeInTheDocument();
            expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
            // Price might be formatted as 500.00 or ₵500.00
            expect(screen.getByText(/500\.00/)).toBeInTheDocument();
        }).catch(err => {
            console.log('OrdersPage DOM during failure:');
            screen.debug();
            throw err;
        });
    });

    it('displays order status statistics', async () => {
        renderWithProviders(<OrdersPage />);

        await waitFor(() => {
            // Check for stat cards (might use regex if text is split)
            expect(screen.getByText(/Total Orders/i)).toBeInTheDocument();
            expect(screen.getByText('100')).toBeInTheDocument();
        });
    });
});
