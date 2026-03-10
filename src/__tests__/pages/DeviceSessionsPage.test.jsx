import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import DeviceSessionsPage from '../../features/sessions/DeviceSessionsPage';

// Mock the hooks
vi.mock('../../shared/hooks/useDeviceSessions', () => ({
    useDeviceSessions: vi.fn(() => ({
        data: {
            data: {
                sessions: [
                    {
                        sessionId: 'sess1',
                        user: { name: 'User One', email: 'user1@example.com' },
                        deviceType: 'desktop',
                        browser: 'Chrome',
                        os: 'Windows',
                        platform: 'eazmain',
                        ipAddress: '192.168.1.1',
                        location: 'Accra, Ghana',
                        loginTime: new Date().toISOString(),
                        lastActivity: new Date().toISOString(),
                        isActive: true,
                        deviceId: 'dev1'
                    }
                ],
                total: 1
            }
        },
        isLoading: false,
        error: null,
        refetch: vi.fn()
    })),
    useSuspiciousLogins: vi.fn(() => ({
        data: { data: { count: 0 } }
    })),
    useForceLogoutDevice: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useForceLogoutUser: vi.fn(() => ({ mutate: vi.fn(), isPending: false }))
}));

describe('DeviceSessionsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders device sessions correctly', async () => {
        renderWithProviders(<DeviceSessionsPage />);

        expect(screen.getByText('Device Sessions')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
            expect(screen.getByText('Accra, Ghana')).toBeInTheDocument();
        });
    });

    it('filters by search term', async () => {
        renderWithProviders(<DeviceSessionsPage />);

        const searchInput = screen.getByPlaceholderText(/Search by user, email, IP/i);
        fireEvent.change(searchInput, { target: { value: 'User One' } });

        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
        });
    });

    it('shows and hides filters panel', async () => {
        renderWithProviders(<DeviceSessionsPage />);

        const filterButton = screen.getByText(/Show Filters/i);
        fireEvent.click(filterButton);

        expect(screen.getAllByText('Status')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Device Type')[0]).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Hide Filters/i));
        expect(screen.queryByText('All Status')).not.toBeInTheDocument();
    });
});
