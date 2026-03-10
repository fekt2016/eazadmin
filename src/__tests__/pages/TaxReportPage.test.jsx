import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../utils/testUtils';
import TaxReportPage from '../../features/tax/TaxReportPage';
import { useQuery } from '@tanstack/react-query';

const mockPlatformSettings = {
    vatRate: 0.125,
    nhilRate: 0.025,
    getfundRate: 0.025,
    platformCommissionRate: 0.1
};

const mockAuditLogsData = {
    auditLogs: [],
    pagination: { totalPages: 1, currentPage: 1 }
};

vi.mock('../../shared/hooks/usePlatformSettings', () => ({
    usePlatformSettings: vi.fn(() => ({
        data: mockPlatformSettings,
        isLoading: false,
        error: null
    })),
    useUpdatePlatformSettings: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    usePlatformSettingsAuditLogs: vi.fn(() => ({
        data: mockAuditLogsData,
        isLoading: false
    }))
}));

// Mock useQuery for VAT summary
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn()
    };
});

describe('TaxReportPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        const mockVatSummary = {
            summary: {
                totalSales: 10000,
                totalBasePrice: 8000,
                totalVAT: 1250,
                vatWithheldByPlatform: 500,
                totalNHIL: 250,
                totalGETFund: 250,
                totalTax: 1750,
                orderCount: 50
            },
            breakdown: { bySeller: [] }
        };

        // Implementation for vat summary query
        useQuery.mockImplementation(({ queryKey }) => {
            if (queryKey[0] === 'admin-tax-vat-summary') {
                return {
                    data: mockVatSummary,
                    isLoading: false,
                    isFetching: false,
                    error: null,
                    refetch: vi.fn()
                };
            }
            return { data: null, isLoading: false, isFetching: false, error: null, refetch: vi.fn() };
        });
    });

    it('renders tax tracking report correctly', async () => {
        renderWithProviders(<TaxReportPage />);

        expect(screen.getByText('Tax & VAT')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('GH₵10,000.00')).toBeInTheDocument();
            expect(screen.getByText('GH₵1,250.00')).toBeInTheDocument();
            expect(screen.getByText('VAT withheld by platform')).toBeInTheDocument();
        });
    });

    it('switches to settings tab and allows changing rates', async () => {
        renderWithProviders(<TaxReportPage />);

        const settingsTab = screen.getByText(/Settings/i);
        fireEvent.click(settingsTab);

        expect(screen.getByText('VAT Settings')).toBeInTheDocument();

        const vatInput = screen.getAllByDisplayValue('0.125')[0];
        fireEvent.change(vatInput, { target: { value: '0.15' } });

        expect(screen.getByText(/You have unsaved changes/i)).toBeInTheDocument();
    });
});
