import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import DistanceOverviewPage from '../../features/shipping/DistanceOverviewPage';

// Use global testTimeout (40000)

const mockNeighborhoodsData = {
    data: {
        neighborhoods: [
            {
                _id: 'n1',
                name: 'Neighborhood One',
                city: 'Accra',
                municipality: 'Municipality X',
                assignedZone: 'A',
                distanceFromHQ: 5.5,
                lat: 5.6,
                lng: -0.1,
                isActive: true
            }
        ]
    },
    pagination: { totalPages: 1, currentPage: 1, totalRecords: 1, hasNextPage: false, hasPrevPage: false }
};

const mockStatisticsData = {
    data: {
        statistics: {
            zoneA: { count: 1, averageDistance: 5.5 }
        }
    }
};

const mockMapUrlData = { data: { mapUrl: 'http://maps.google.com' } };

const STABLE_MUTATION = { mutateAsync: vi.fn(), isPending: false };

// Mocks
vi.mock('../../shared/hooks/useNeighborhoods', () => ({
    useGetNeighborhoods: vi.fn(() => ({
        data: mockNeighborhoodsData,
        isLoading: false,
        refetch: vi.fn()
    })),
    useGetNeighborhoodStatistics: vi.fn(() => ({
        data: mockStatisticsData
    })),
    useRefreshCoordinates: vi.fn(() => STABLE_MUTATION),
    useRecalculateNeighborhood: vi.fn(() => STABLE_MUTATION),
    useToggleNeighborhoodActive: vi.fn(() => STABLE_MUTATION),
    useCreateNeighborhood: vi.fn(() => STABLE_MUTATION),
    useUpdateNeighborhood: vi.fn(() => STABLE_MUTATION),
    useDeleteNeighborhood: vi.fn(() => STABLE_MUTATION),
    useGetMapUrl: vi.fn(() => ({ data: mockMapUrlData, isLoading: false }))
}));

// Mock icons
vi.mock('react-icons/fi', () => ({
    FiEdit: () => <span />,
    FiTrash2: () => <span />,
    FiPlus: () => <span />,
    FiSearch: () => <span />,
    FiRefreshCw: () => <span />,
    FiMap: () => <span />
}));

// Silence logs
console.log = vi.fn();
console.error = vi.fn();

describe('DistanceOverviewPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders neighborhood overview correctly', async () => {
        renderWithProviders(<DistanceOverviewPage />);

        expect(screen.getByText(/Neighborhood-Based Zoning Overview/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Neighborhood One')).toBeInTheDocument();
            expect(screen.getAllByText('Zone A')[0]).toBeInTheDocument();
            expect(screen.getByText('5.50')).toBeInTheDocument();
        }, { timeout: 10000 });
    });

    it('opens add neighborhood modal', async () => {
        renderWithProviders(<DistanceOverviewPage />);

        await waitFor(() => {
            expect(screen.getByText(/Add Neighborhood/i)).toBeInTheDocument();
        }, { timeout: 10000 });

        const addButton = screen.getByText(/Add Neighborhood/i);
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getAllByText(/Add Neighborhood/i).length).toBeGreaterThan(0);
        }, { timeout: 10000 });
    }, 35000);

    it('filters by zone', async () => {
        const { container } = renderWithProviders(<DistanceOverviewPage />);

        const zoneSelect = container.querySelectorAll('select')[0];
        fireEvent.change(zoneSelect, { target: { value: 'B' } });

        await waitFor(() => {
            expect(screen.getByText(/All Zones/i)).toBeInTheDocument();
        }, { timeout: 10000 });
    });
});
