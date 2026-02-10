import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { FaWallet, FaStore, FaFilter, FaSearch, FaDownload, FaHistory } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import api from '../../shared/services/api';

const BalanceHistoryPage = () => {
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' | 'revenue' | 'transactions'
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    search: '',
    minAmount: '',
    maxAmount: '',
  });
  const [userId, setUserId] = useState('');
  const [sellerId, setSellerId] = useState('');

  // Fetch wallet history
  const { data: walletData, isLoading: walletLoading, error: walletError } = useQuery({
    queryKey: ['admin-wallet-history', page, limit, filters, userId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      // Add filters only if they have values
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });
      
      // Only add userId if it's a valid non-empty string
      if (userId && userId.trim() !== '') {
        params.append('userId', userId.trim());
      }
      
      try {
        const response = await api.get(`/admin/wallet-history?${params}`);
        return response.data;
      } catch (error) {
        // Comprehensive error logging
        console.error('[BalanceHistoryPage] Wallet History API Error:', {
          url: `/admin/wallet-history?${params}`,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          fullError: error,
        });
        
        // Log response body if available
        if (error.response?.data) {
          console.error('[BalanceHistoryPage] Error Response Body:', JSON.stringify(error.response.data, null, 2));
        }
        
        throw error;
      }
    },
    enabled: activeTab === 'wallet',
  });

  // Fetch revenue history
  const { data: revenueData, isLoading: revenueLoading, error: revenueError } = useQuery({
    queryKey: ['admin-revenue-history', page, limit, filters, sellerId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      // Add filters only if they have values
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });
      
      // Only add sellerId if it's a valid non-empty string
      if (sellerId && sellerId.trim() !== '') {
        params.append('sellerId', sellerId.trim());
      }
      
      try {
        const response = await api.get(`/admin/revenue-history?${params}`);
        return response.data;
      } catch (error) {
        // Comprehensive error logging
        console.error('[BalanceHistoryPage] Revenue History API Error:', {
          url: `/admin/revenue-history?${params}`,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          fullError: error,
        });
        
        // Log response body if available
        if (error.response?.data) {
          console.error('[BalanceHistoryPage] Error Response Body:', JSON.stringify(error.response.data, null, 2));
        }
        
        throw error;
      }
    },
    enabled: activeTab === 'revenue',
  });

  // Fetch seller transactions (credits/debits) for all sellers
  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['admin-transactions', page, limit, filters, sellerId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add filters only if they have values
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          // For transactions, map type filter 'credit'/'debit' directly; other filters pass through
          params.append(key, value);
        }
      });

      // Only add sellerId if it's a valid non-empty string
      if (sellerId && sellerId.trim() !== '') {
        params.append('sellerId', sellerId.trim());
      }

      try {
        const response = await api.get(`/admin/transactions?${params}`);
        return response.data;
      } catch (error) {
        console.error('[BalanceHistoryPage] Transactions API Error:', {
          url: `/admin/transactions?${params}`,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          fullError: error,
        });
        if (error.response?.data) {
          console.error('[BalanceHistoryPage] Transactions Error Body:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
      }
    },
    enabled: activeTab === 'transactions',
  });

  let currentData;
  let isLoading;
  let currentError;
  if (activeTab === 'wallet') {
    currentData = walletData;
    isLoading = walletLoading;
    currentError = walletError;
  } else if (activeTab === 'revenue') {
    currentData = revenueData;
    isLoading = revenueLoading;
    currentError = revenueError;
  } else {
    currentData = transactionsData;
    isLoading = transactionsLoading;
    currentError = transactionsError;
  }
  const history = currentData?.data?.history || [];
  const pagination = currentData?.pagination || {};

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
      search: '',
      minAmount: '',
      maxAmount: '',
    });
    setUserId('');
    setSellerId('');
    setPage(1);
  };

  const formatCurrency = (amount) => {
    return `GH₵${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      // Wallet types
      TOPUP: '#10b981',
      PAYSTACK_TOPUP: '#10b981',
      ORDER_DEBIT: '#ef4444',
      REFUND_CREDIT: '#3b82f6',
      ADMIN_ADJUST: '#f59e0b',
      TRANSFER: '#8b5cf6',
      // Revenue types
      ORDER_EARNING: '#10b981',
      REFUND_DEDUCTION: '#ef4444',
      PAYOUT: '#6366f1',
      ADMIN_ADJUST: '#f59e0b',
      CORRECTION: '#8b5cf6',
      REVERSAL: '#ef4444',
    };
    return colors[type] || '#6b7280';
  };

  const getTypeLabel = (type) => {
    const labels = {
      TOPUP: 'Top-up',
      PAYSTACK_TOPUP: 'Paystack Top-up',
      ORDER_DEBIT: 'Order Payment',
      REFUND_CREDIT: 'Refund Credit',
      ADMIN_ADJUST: 'Admin Adjustment',
      TRANSFER: 'Transfer',
      ORDER_EARNING: 'Order Earning',
      REFUND_DEDUCTION: 'Refund Deduction',
      PAYOUT: 'Payout',
      CORRECTION: 'Correction',
      REVERSAL: 'Reversal',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <Title>
          <FaHistory />
          <h1>Balance History Management</h1>
        </Title>
        <Subtitle>View and manage buyer wallet, seller revenue, and seller transactions</Subtitle>
      </Header>

      <TabsContainer>
        <TabButton
          $active={activeTab === 'wallet'}
          onClick={() => {
            setActiveTab('wallet');
            setPage(1);
          }}
        >
          <FaWallet />
          Buyer Wallet History
        </TabButton>
        <TabButton
          $active={activeTab === 'revenue'}
          onClick={() => {
            setActiveTab('revenue');
            setPage(1);
          }}
        >
          <FaStore />
          Seller Revenue History
        </TabButton>
        <TabButton
          $active={activeTab === 'transactions'}
          onClick={() => {
            setActiveTab('transactions');
            setPage(1);
          }}
        >
          <FaStore />
          Seller Transactions
        </TabButton>
      </TabsContainer>

      <FiltersCard>
        <FiltersHeader>
          <FaFilter />
          <h3>Filters</h3>
          <ResetButton onClick={handleResetFilters}>Reset</ResetButton>
        </FiltersHeader>
        <FiltersGrid>
          <FilterGroup>
            <Label>Search</Label>
            <Input
              placeholder="User/Seller name, email, or reference"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </FilterGroup>
          {activeTab === 'wallet' && (
            <FilterGroup>
              <Label>User ID</Label>
              <Input
                placeholder="Filter by specific user ID"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setPage(1);
                }}
              />
            </FilterGroup>
          )}
          {(activeTab === 'revenue' || activeTab === 'transactions') && (
            <FilterGroup>
              <Label>Seller ID</Label>
              <Input
                placeholder="Filter by specific seller ID"
                value={sellerId}
                onChange={(e) => {
                  setSellerId(e.target.value);
                  setPage(1);
                }}
              />
            </FilterGroup>
          )}
          <FilterGroup>
            <Label>Type</Label>
            <Select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              {activeTab === 'wallet' && (
                <>
                  <option value="TOPUP">Top-up</option>
                  <option value="PAYSTACK_TOPUP">Paystack Top-up</option>
                  <option value="ORDER_DEBIT">Order Payment</option>
                  <option value="REFUND_CREDIT">Refund Credit</option>
                  <option value="ADMIN_ADJUST">Admin Adjustment</option>
                </>
              )}
              {activeTab === 'revenue' && (
                <>
                  <option value="ORDER_EARNING">Order Earning</option>
                  <option value="REFUND_DEDUCTION">Refund Deduction</option>
                  <option value="PAYOUT">Payout</option>
                  <option value="ADMIN_ADJUST">Admin Adjustment</option>
                  <option value="CORRECTION">Correction</option>
                  <option value="REVERSAL">Reversal</option>
                </>
              )}
              {activeTab === 'transactions' && (
                <>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </>
              )}
            </Select>
          </FilterGroup>
          <FilterGroup>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </FilterGroup>
          <FilterGroup>
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </FilterGroup>
          <FilterGroup>
            <Label>Min Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            />
          </FilterGroup>
          <FilterGroup>
            <Label>Max Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            />
          </FilterGroup>
        </FiltersGrid>
      </FiltersCard>

      <StatsCard>
        <StatItem>
          <StatLabel>Total Transactions</StatLabel>
          <StatValue>{pagination.total || 0}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Current Page</StatLabel>
          <StatValue>{pagination.page || 1} / {pagination.pages || 1}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Showing</StatLabel>
          <StatValue>{history.length} of {pagination.total || 0}</StatValue>
        </StatItem>
      </StatsCard>

      <TableCard>
        <Table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Order #</th>
              {activeTab === 'wallet' && <th>User</th>}
              {activeTab !== 'wallet' && <th>Seller</th>}
              <th>Type</th>
              <th>Amount</th>
              {activeTab !== 'transactions' && (
                <>
                  <th>Balance Before</th>
                  <th>Balance After</th>
                </>
              )}
              <th>Description</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={activeTab === 'transactions' ? 6 : 8}
                  style={{ textAlign: 'center', padding: '2rem' }}
                >
                  No history found
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item._id}>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    {(() => {
                      const order =
                        item.orderId ||
                        item.sellerOrder?.order ||
                        null;
                      const orderId = order?._id || order?.id;
                      const orderNumber = order?.orderNumber || orderId;

                      if (!orderId || !orderNumber) {
                        return 'N/A';
                      }

                      // Admin order detail route: /dashboard/orders/detail/:id
                      const to = `/dashboard/orders/detail/${orderId}`;
                      return <OrderLink to={to}>{orderNumber}</OrderLink>;
                    })()}
                  </td>
                  {activeTab === 'wallet' && (
                    <td>
                      <UserCell>
                        <strong>{item.userId?.name || 'N/A'}</strong>
                        <span>{item.userId?.email || ''}</span>
                      </UserCell>
                    </td>
                  )}
                  {activeTab !== 'wallet' && (
                    <td>
                      <UserCell>
                        <strong>
                          {item.sellerId?.shopName ||
                            item.sellerId?.name ||
                            item.seller?.shopName ||
                            item.seller?.name ||
                            'N/A'}
                        </strong>
                        <span>
                          {item.sellerId?.email ||
                            item.seller?.email ||
                            ''}
                        </span>
                      </UserCell>
                    </td>
                  )}
                  <td>
                    <TypeBadge $color={getTypeColor(item.type)}>
                      {getTypeLabel(item.type)}
                    </TypeBadge>
                  </td>
                  <td>
                    <Amount $isCredit={item.amount >= 0}>
                      {item.amount >= 0 ? '+' : '-'}{formatCurrency(item.amount)}
                    </Amount>
                  </td>
                  {activeTab !== 'transactions' && (
                    <>
                      <td>{formatCurrency(item.balanceBefore)}</td>
                      <td>
                        <strong>{formatCurrency(item.balanceAfter)}</strong>
                      </td>
                    </>
                  )}
                  <td>{item.description}</td>
                  <td>
                    <Reference>{item.reference || 'N/A'}</Reference>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableCard>

      {pagination.pages > 1 && (
        <Pagination>
          <PaginationButton
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={pagination.page === 1}
          >
            Previous
          </PaginationButton>
          <PageInfo>
            Page {pagination.page} of {pagination.pages}
          </PageInfo>
          <PaginationButton
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </PaginationButton>
        </Pagination>
      )}
    </PageContainer>
  );
};

export default BalanceHistoryPage;

// Styled Components
const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;

  svg {
    font-size: 2rem;
    color: var(--color-primary-600);
  }

  h1 {
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--color-grey-900);
    margin: 0;
  }
`;

const Subtitle = styled.p`
  color: var(--color-grey-600);
  font-size: 1.4rem;
  margin: 0;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--color-grey-200);
`;

const TabButton = styled.button`
  padding: 1rem 2rem;
  background: ${props => props.$active ? 'var(--color-primary-600)' : 'transparent'};
  color: ${props => props.$active ? 'white' : 'var(--color-grey-700)'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? 'var(--color-primary-600)' : 'transparent'};
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;

  &:hover {
    background: ${props => props.$active ? 'var(--color-primary-700)' : 'var(--color-grey-100)'};
  }

  svg {
    font-size: 1.6rem;
  }
`;

const FiltersCard = styled.div`
  background: white;
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
`;

const FiltersHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  svg {
    color: var(--color-primary-600);
    font-size: 1.8rem;
  }

  h3 {
    flex: 1;
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0;
  }
`;

const ResetButton = styled.button`
  padding: 0.5rem 1rem;
  background: var(--color-grey-200);
  color: var(--color-grey-700);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: var(--color-grey-300);
  }
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--color-grey-700);
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 1px solid var(--color-grey-300);
  border-radius: var(--border-radius-md);
  font-size: 1.4rem;

  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.8rem;
  border: 1px solid var(--color-grey-300);
  border-radius: var(--border-radius-md);
  font-size: 1.4rem;
  background: white;

  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const StatsCard = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatItem = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
`;

const StatLabel = styled.div`
  font-size: 1.3rem;
  color: var(--color-grey-600);
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-grey-900);
`;

const TableCard = styled.div`
  background: white;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    background: var(--color-grey-50);
    border-bottom: 2px solid var(--color-grey-200);
  }

  th {
    padding: 1.2rem;
    text-align: left;
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--color-grey-700);
  }

  tbody tr {
    border-bottom: 1px solid var(--color-grey-100);

    &:hover {
      background: var(--color-grey-50);
    }
  }

  td {
    padding: 1.2rem;
    font-size: 1.4rem;
    color: var(--color-grey-700);
  }
`;

const UserCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  strong {
    color: var(--color-grey-900);
  }

  span {
    font-size: 1.2rem;
    color: var(--color-grey-500);
  }
`;

const TypeBadge = styled.span`
  display: inline-block;
  padding: 0.4rem 0.8rem;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  border-radius: var(--border-radius-sm);
  font-size: 1.2rem;
  font-weight: 600;
`;

const Amount = styled.span`
  font-weight: 600;
  color: ${props => props.$isCredit ? 'var(--color-green-700)' : 'var(--color-red-700)'};
`;

const Reference = styled.code`
  font-size: 1.2rem;
  color: var(--color-grey-600);
  background: var(--color-grey-100);
  padding: 0.2rem 0.4rem;
  border-radius: var(--border-radius-sm);
`;

const OrderLink = styled(Link)`
  font-size: 1.2rem;
  color: var(--color-primary-600, #2563eb);
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
`;

const PaginationButton = styled.button`
  padding: 0.8rem 1.6rem;
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 1.4rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: var(--color-primary-700);
  }

  &:disabled {
    background: var(--color-grey-300);
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const PageInfo = styled.span`
  font-size: 1.4rem;
  color: var(--color-grey-700);
  font-weight: 500;
`;

