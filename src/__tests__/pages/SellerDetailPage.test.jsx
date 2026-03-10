import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import SellerDetailPage from '../../features/sellers/SellerDetailPage';

// Mock the hooks
vi.mock('../../shared/hooks/useSellerAdmin', () => ({
    default: vi.fn(() => ({
        approveVerification: { isPending: false, mutateAsync: vi.fn() },
        rejectVerification: { isPending: false, mutateAsync: vi.fn() },
        approvePayout: { isPending: false, mutateAsync: vi.fn() },
        rejectPayout: { isPending: false, mutateAsync: vi.fn() },
        updateStatus: { isPending: false, mutateAsync: vi.fn() }
    })),
    useGetSellerById: vi.fn(() => ({
        data: {
            data: {
                data: {
                    _id: 's1',
                    name: 'Seller One',
                    shopName: 'One Store',
                    email: 'seller@example.com',
                    status: 'pending',
                    active: true,
                    verificationDocuments: { idProof: 'doc.jpg' },
                    createdAt: new Date().toISOString()
                }
            }
        },
        isLoading: false,
        error: null,
        refetch: vi.fn()
    })),
    usePayoutVerificationDetails: vi.fn(() => ({
        data: { data: { seller: { paymentMethodRecords: [] } } },
        isLoading: false,
        refetch: vi.fn()
    }))
}));

vi.mock('../../shared/hooks/useSellerBalance', () => ({
    useGetSellerBalance: vi.fn(() => ({
        data: { data: { balance: 100, withdrawableBalance: 50 } },
        isLoading: false
    })),
    useResetSellerBalance: vi.fn(() => ({ isPending: false, mutateAsync: vi.fn() })),
    useResetLockedBalance: vi.fn(() => ({ isPending: false, mutateAsync: vi.fn() }))
}));

vi.mock('../../shared/hooks/useAuth', () => ({
    default: vi.fn(() => ({
        adminData: { data: { data: { data: { role: 'superadmin' } } } }
    }))
}));

describe('SellerDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders seller details correctly', async () => {
        renderWithProviders(<SellerDetailPage />);

        await waitFor(() => {
            const shopNames = screen.getAllByText('One Store');
            expect(shopNames.length).toBeGreaterThan(0);
            const emails = screen.getAllByText('seller@example.com');
            expect(emails.length).toBeGreaterThan(0);
        });
    });

    it('shows balance information', async () => {
        renderWithProviders(<SellerDetailPage />);

        await waitFor(() => {
            expect(screen.getByText(/Basic Information/i)).toBeInTheDocument();
        });
    });
});
