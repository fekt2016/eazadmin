import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import UsersActivityPage from '../../features/users/UsersActivityPage';

describe('UsersActivityPage', () => {
    it('renders activity logs correctly', async () => {
        renderWithProviders(<UsersActivityPage />);

        expect(screen.getByText('Activity Logs')).toBeInTheDocument();
        expect(screen.getAllByText('vendor1@example.com')[0]).toBeInTheDocument();
        expect(screen.getByText('Product Created')).toBeInTheDocument();
    });

    it('filters by action type', async () => {
        const { container } = renderWithProviders(<UsersActivityPage />);

        const filter = container.querySelector('select[name="actionType"]');
        fireEvent.change(filter, { target: { value: 'USER_UPDATE' } });

        await waitFor(() => {
            expect(screen.getByText('User Updated')).toBeInTheDocument();
            expect(screen.queryByText('Product Created')).not.toBeInTheDocument();
        });
    });

    it('filters by search term', async () => {
        renderWithProviders(<UsersActivityPage />);

        const searchInput = screen.getByPlaceholderText(/Search user, target or IP/i);
        fireEvent.change(searchInput, { target: { value: '192.168.1.5' } });

        await waitFor(() => {
            expect(screen.getAllByText('192.168.1.5').length).toBeGreaterThan(0);
            expect(screen.queryByText('203.0.113.42')).not.toBeInTheDocument();
        });
    });
});
