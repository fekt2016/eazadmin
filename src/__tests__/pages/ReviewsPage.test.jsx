import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import ReviewsPage from '../../features/reviews/ReviewsPage';

// Mock the hooks
vi.mock('../../shared/hooks/useReview', () => ({
    default: vi.fn(() => ({
        useGetAllReviews: vi.fn((params) => {
            const hasRatingFilter = params?.rating && params.rating !== 'all';
            return {
                data: {
                    data: {
                        reviews: hasRatingFilter ? [] : [
                            {
                                _id: 'rev1',
                                title: 'Great Product',
                                review: 'I love this product!',
                                rating: 5,
                                status: 'pending',
                                product: { name: 'Test Product' },
                                user: { name: 'User One' },
                                createdAt: new Date().toISOString()
                            }
                        ]
                    }
                },
                isLoading: false,
                error: null
            };
        }),
        useDeleteReview: vi.fn(() => ({ isPending: false, mutateAsync: vi.fn() })),
        useApproveReview: vi.fn(() => ({ isPending: false, mutateAsync: vi.fn() })),
        useRejectReview: vi.fn(() => ({ isPending: false, mutateAsync: vi.fn() })),
        useFlagReview: vi.fn(() => ({ isPending: false, mutateAsync: vi.fn() })),
        useHideReview: vi.fn(() => ({ isPending: false, mutateAsync: vi.fn() }))
    }))
}));

describe('ReviewsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders reviews correctly', async () => {
        renderWithProviders(<ReviewsPage />);

        expect(screen.getByText('Reviews Management')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Great Product')).toBeInTheDocument();
            expect(screen.getByText('User One')).toBeInTheDocument();
        });
    });

    it('filters reviews by rating', async () => {
        renderWithProviders(<ReviewsPage />);

        const filter = screen.getByDisplayValue('All Ratings');
        fireEvent.change(filter, { target: { value: '1' } });

        await waitFor(() => {
            expect(screen.queryByText('Great Product')).not.toBeInTheDocument();
            expect(screen.getByText(/No reviews found/i)).toBeInTheDocument();
        });
    });
});
