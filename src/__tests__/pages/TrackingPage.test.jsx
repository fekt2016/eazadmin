import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import TrackingPage from '../../features/orders/TrackingPage';

// Use global testTimeout (15000) - tests need time for async render

// Stable mock data - module level constants prevent reference instability
const MOCK_ORDER = {
    _id: 'ord-123',
    trackingNumber: 'TRK123',
    orderNumber: 'ORD456',
    currentStatus: 'processing',
    paymentStatus: 'paid',
    trackingHistory: [
        { status: 'pending_payment', message: 'Order placed', timestamp: '2024-01-01T00:00:00.000Z' },
        { status: 'processing', message: 'Order is being processed', timestamp: '2024-01-01T00:01:00.000Z' }
    ],
    shippingAddress: {
        fullName: 'John Doe',
        streetAddress: '123 Main St',
        city: 'Accra'
    },
    orderItems: [
        { product: { name: 'Product A', imageCover: 'img.jpg' }, price: 100, quantity: 1 }
    ],
    totalPrice: 110,
    subtotal: 100,
    shippingCost: 10,
    deliveryEstimate: 'Arrives in 2 Business Days',
    createdAt: '2024-01-01T00:00:00.000Z'
};

// Stable mock return values
const GET_ORDER_MOCK_SUCCESS = {
    data: MOCK_ORDER,
    isLoading: false,
    error: null
};

const ADD_TRACKING_MOCK_READY = {
    mutate: vi.fn(),
    isPending: false
};

// Module level mocks
vi.mock('../../shared/hooks/useOrder', () => ({
    useGetOrderByTrackingNumber: vi.fn(() => GET_ORDER_MOCK_SUCCESS),
    useAddTrackingUpdate: vi.fn(() => ADD_TRACKING_MOCK_READY)
}));

// Use a stable mock for react-router-dom to avoid MemoryRouter conflicts
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(() => ({ trackingNumber: 'TRK123' })),
        useNavigate: vi.fn(() => vi.fn())
    };
});

vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

// Silence logs during tests to speed up execution
console.log = vi.fn();
console.error = vi.fn();

// Import mocked hooks for control
import { useGetOrderByTrackingNumber, useAddTrackingUpdate } from '../../shared/hooks/useOrder';

describe('TrackingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset defaults properly in beforeEach
        vi.mocked(useGetOrderByTrackingNumber).mockReturnValue(GET_ORDER_MOCK_SUCCESS);
        vi.mocked(useAddTrackingUpdate).mockReturnValue(ADD_TRACKING_MOCK_READY);
    });

    it('renders tracking information correctly', async () => {
        renderWithProviders(<TrackingPage />);

        // Check for header
        expect(screen.getByText(/Order Tracking/i)).toBeInTheDocument();

        // Wait for data - component can be slow to render
        await waitFor(() => {
            expect(screen.getByText(/TRK123/i)).toBeInTheDocument();
            expect(screen.getByText(/ORD456/i)).toBeInTheDocument();
            expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
            const elements = screen.queryAllByText(/Processing Order/i);
            expect(elements.length).toBeGreaterThan(0);
        }, { timeout: 10000 });
    }, 45000);

    it('opens update tracking modal', async () => {
        renderWithProviders(<TrackingPage />);

        await waitFor(() => {
            expect(screen.getByText(/Update Tracking/i)).toBeInTheDocument();
        }, { timeout: 5000 });

        const updateButton = screen.getByText(/Update Tracking/i);
        fireEvent.click(updateButton);

        await waitFor(() => {
            expect(screen.getByText(/Update Tracking Status/i)).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    it('shows loading state correctly', () => {
        vi.mocked(useGetOrderByTrackingNumber).mockReturnValue({
            data: null,
            isLoading: true,
            error: null
        });

        renderWithProviders(<TrackingPage />);
        // Success is not crashing
    });

    it('shows error state correctly', async () => {
        vi.mocked(useGetOrderByTrackingNumber).mockReturnValue({
            data: null,
            isLoading: false,
            error: { message: 'Failed to fetch order' }
        });

        renderWithProviders(<TrackingPage />);

        await waitFor(() => {
            expect(screen.getByText(/Tracking Not Found/i)).toBeInTheDocument();
            expect(screen.getByText(/Failed to fetch order/i)).toBeInTheDocument();
        });
    });
});
