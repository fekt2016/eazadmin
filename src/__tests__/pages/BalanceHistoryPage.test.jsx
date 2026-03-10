import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import BalanceHistoryPage from '../../features/history/BalanceHistoryPage';
import { useQuery } from '@tanstack/react-query';

// Mock react-query's useQuery
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn()
    };
});

describe('BalanceHistoryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default implementation for useQuery
        useQuery.mockImplementation(({ queryKey }) => {
            if (queryKey[0] === 'admin-wallet-history') {
                return {
                    data: {
                        data: {
                            history: [
                                {
                                    _id: 'h1',
                                    type: 'TOPUP',
                                    amount: 100,
                                    balanceBefore: 0,
                                    balanceAfter: 100,
                                    description: 'Initial Topup',
                                    createdAt: new Date().toISOString(),
                                    userId: { name: 'User One', email: 'user1@example.com' }
                                }
                            ]
                        },
                        pagination: { total: 1, page: 1, pages: 1 }
                    },
                    isLoading: false,
                    error: null
                };
            }
            return { data: null, isLoading: false, error: null };
        });
    });

    it('renders wallet history by default', async () => {
        renderWithProviders(<BalanceHistoryPage />);

        expect(screen.getByText('Balance History Management')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Initial Topup')).toBeInTheDocument();
            expect(screen.getByText('User One')).toBeInTheDocument();
        });
    });

    it('switches to revenue history tab', async () => {
        renderWithProviders(<BalanceHistoryPage />);

        const revenueTab = screen.getByText(/Seller Revenue History/i);
        fireEvent.click(revenueTab);

        // After switching, useQuery should be called with 'admin-revenue-history'
        await waitFor(() => {
            expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({
                queryKey: expect.arrayContaining(['admin-revenue-history'])
            }));
        });
    });

    it('resets filters correctly', async () => {
        renderWithProviders(<BalanceHistoryPage />);

        const searchInput = screen.getByPlaceholderText(/User\/Seller name/i);
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        expect(searchInput.value).toBe('test search');

        const resetButton = screen.getByText('Reset');
        fireEvent.click(resetButton);

        expect(searchInput.value).toBe('');
    });
});
