import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import PickupCentersPage from '../../features/official-store/PickupCentersPage';

// Mock the hooks
vi.mock('../../shared/hooks/useEazShop', () => ({
    useEazShop: vi.fn(() => ({
        useGetPickupCenters: vi.fn(() => ({
            data: {
                data: {
                    pickupCenters: [
                        {
                            _id: 'pc1',
                            pickupName: 'Center One',
                            city: 'ACCRA',
                            area: 'East Legon',
                            address: '123 Street',
                            isActive: true
                        }
                    ]
                }
            },
            isLoading: false,
            error: null
        }))
    }))
}));

// Mock react-query and api
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
        useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false }))
    };
});

vi.mock('../../shared/services/api', () => ({
    default: {
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
    }
}));

describe('PickupCentersPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders pickup centers correctly', async () => {
        renderWithProviders(<PickupCentersPage />);

        expect(screen.getByText('Pickup Centers')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Center One')).toBeInTheDocument();
            expect(screen.getByText('East Legon')).toBeInTheDocument();
        });
    });

    it('opens add pickup center modal', async () => {
        renderWithProviders(<PickupCentersPage />);

        const addButton = screen.getByText(/Add Pickup Center/i);
        fireEvent.click(addButton);

        await waitFor(() => {
            const titles = screen.getAllByText('Add Pickup Center');
            expect(titles.length).toBeGreaterThan(1);
            expect(screen.getByText(/Pickup Center Name/i)).toBeInTheDocument();
        });
    });

    it('filters by status', async () => {
        renderWithProviders(<PickupCentersPage />);

        const statusSelect = screen.getByDisplayValue('All Status');
        fireEvent.change(statusSelect, { target: { value: 'active' } });

        await waitFor(() => {
            expect(screen.getByText('Center One')).toBeInTheDocument();
        });
    });
});
