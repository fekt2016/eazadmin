import styled from "styled-components";
import { useGetAllOrders } from '../../shared/hooks/useOrder';
import { useAdminRefundsList } from './hooks/useAdminRefunds';
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from '../../shared/utils/helpers';
import { useState, useEffect, useMemo } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaEye,
  FaSearch,
  FaUndo,
  FaTimesCircle,
  FaAngleLeft,
  FaAngleRight,
  FaFilter,
  FaMoneyBillWave,
} from "react-icons/fa";
import { PATHS } from '../../routes/routhPath';
import RefundStatusBadge from './components/RefundStatusBadge';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';

export default function RefundsPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Try to use the new admin refunds API, fallback to orders if not available
  const filters = useMemo(() => ({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    startDate,
    endDate,
  }), [currentPage, pageSize, searchTerm, statusFilter, startDate, endDate]);

  const { data: refundsData, isLoading: isRefundsLoading, error: refundsError } = useAdminRefundsList(filters);
  const { data: ordersData, isLoading: isOrdersLoading, error: ordersError, refetch } = useGetAllOrders();

  // Use refunds API data if available, otherwise fallback to orders
  const isLoading = isRefundsLoading || isOrdersLoading;
  const error = refundsError || ordersError;
  const useRefundsAPI = useMemo(() => refundsData && !refundsError, [refundsData, refundsError]);

  // Get refunds data - use API response if available, otherwise filter from orders
  const refundsDataList = useMemo(() => {
    if (useRefundsAPI && refundsData?.data?.refunds) {
      return refundsData.data.refunds;
    }
    
    // Fallback: filter orders for refunds/returns
    if (!ordersData?.data?.results) return [];
    
    const orders = ordersData.data.results;
    
    // Filter orders that are refunded or have refund requests
    return orders.filter(order => {
      const isRefunded = order.orderStatus === 'refunded' || 
                        order.currentStatus === 'refunded' ||
                        order.status === 'refunded';
      
      const hasRefundRequest = order.refundRequested === true || 
                              order.refundStatus === 'pending' ||
                              order.refundStatus === 'processing';
      
      return isRefunded || hasRefundRequest;
    });
  }, [useRefundsAPI, refundsData, ordersData]);

  // Get pagination info from API or calculate locally
  const pagination = useMemo(() => {
    if (useRefundsAPI && refundsData?.pagination) {
      return refundsData.pagination;
    }
    return {
      currentPage,
      totalPages: Math.ceil(refundsDataList.length / pageSize),
      total: refundsDataList.length,
      limit: pageSize,
    };
  }, [useRefundsAPI, refundsData, refundsDataList, currentPage, pageSize]);

  // Get paginated refunds
  const paginatedRefunds = useMemo(() => {
    if (useRefundsAPI && refundsData?.data?.refunds) {
      return refundsData.data.refunds;
    }
    // Local pagination for fallback
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return refundsDataList.slice(startIndex, endIndex);
  }, [useRefundsAPI, refundsData, refundsDataList, currentPage, pageSize]);

  // Stats
  const stats = useMemo(() => {
    const refunded = refundsDataList.filter(r => 
      r.orderStatus === 'refunded' || r.currentStatus === 'refunded' || r.refundStatus === 'completed'
    ).length;
    const pending = refundsDataList.filter(r => 
      r.refundStatus === 'pending' || r.refundRequested === true
    ).length;
    const processing = refundsDataList.filter(r => 
      r.refundStatus === 'processing'
    ).length;
    
    const totalAmount = refundsDataList.reduce((sum, r) => {
      return sum + (r.refundAmount || r.totalPrice || 0);
    }, 0);

    return {
      total: refundsDataList.length,
      refunded,
      pending,
      processing,
      totalAmount,
    };
  }, [refundsDataList]);

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <p>Loading refunds...</p>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <FaExclamationCircle size={48} color="#e74c3c" />
        <h3>Failed to load refunds</h3>
        <p>{error.message}</p>
        <p>Please try again later</p>
      </ErrorContainer>
    );
  }

  const getStatusBadge = (refund) => {
    // Use the new RefundStatusBadge component
    if (refund.orderStatus === 'refunded' || refund.currentStatus === 'refunded') {
      return <RefundStatusBadge status="completed" />;
    }
    if (refund.refundStatus === 'processing') {
      return <RefundStatusBadge status="processing" />;
    }
    if (refund.refundStatus === 'approved') {
      return <RefundStatusBadge status="approved" />;
    }
    if (refund.refundStatus === 'rejected') {
      return <RefundStatusBadge status="rejected" />;
    }
    if (refund.refundStatus === 'pending' || refund.refundRequested) {
      return <RefundStatusBadge status="pending" />;
    }
    return <RefundStatusBadge status="unknown" />;
  };

  const getOrderNumber = (refund) => {
    return (
      refund.order?.orderNumber ||
      refund.orderNumber ||
      (refund._id ? String(refund._id).slice(-8) : 'N/A')
    );
  };

  const getCustomer = (refund) => {
    const buyer = refund.buyer || refund.user;
    return {
      name: buyer?.name || 'N/A',
      email: buyer?.email || 'N/A',
    };
  };

  const getAmount = (refund) => {
    // Prefer refund-specific amounts from RefundRequest API
    const amount =
      refund.totalRefundAmount ??
      refund.refundAmount ??
      refund.totalPrice ??
      0;
    return Number(amount) || 0;
  };

  const getCreatedAt = (refund) => {
    return (
      refund.createdAt ||
      refund.refundRequestDate ||
      refund.order?.createdAt ||
      refund.orderDate
    );
  };

  return (
    <Container>
      <Header>
        <TitleSection>
          <TitleIcon>
            <FaUndo />
          </TitleIcon>
          <div>
            <Title>Refunds & Returns Management</Title>
            <Subtitle>Manage order refunds and return requests</Subtitle>
          </div>
        </TitleSection>
      </Header>

      {/* Stats Cards */}
      <StatsGrid>
        <StatCard>
          <StatIcon $color="#3b82f6">
            <FaUndo />
          </StatIcon>
          <StatContent>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Total Refunds</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon $color="#10b981">
            <FaCheckCircle />
          </StatIcon>
          <StatContent>
            <StatValue>{stats.refunded}</StatValue>
            <StatLabel>Completed</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon $color="#f59e0b">
            <FaExclamationCircle />
          </StatIcon>
          <StatContent>
            <StatValue>{stats.pending}</StatValue>
            <StatLabel>Pending</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon $color="#8b5cf6">
            <FaMoneyBillWave />
          </StatIcon>
          <StatContent>
            <StatValue>GH₵{stats.totalAmount.toFixed(2)}</StatValue>
            <StatLabel>Total Amount</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>

      {/* Filters */}
      <FiltersSection>
        <SearchBox>
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search by order number, customer name, or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </SearchBox>
        <FilterSelect
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </FilterSelect>
        <DateFilterGroup>
          <DateInput
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
          />
          <DateInput
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
          />
        </DateFilterGroup>
      </FiltersSection>

      {/* Refunds Table */}
      <TableContainer>
        <Table>
          <thead>
            <TableRow>
              <TableHeader>Order Number</TableHeader>
              <TableHeader>Customer</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </thead>
          <tbody>
            {paginatedRefunds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} $center>
                  <EmptyState>
                    <FaUndo size={48} color="#9ca3af" />
                    <p>No refunds found</p>
                    <p style={{ fontSize: '1.4rem', color: '#6b7280' }}>
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'No refund requests at this time'}
                    </p>
                  </EmptyState>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRefunds.map((refund) => (
                <TableRow key={refund._id}>
                  <TableCell>
                    <OrderNumber>{getOrderNumber(refund)}</OrderNumber>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const customer = getCustomer(refund);
                      return (
                    <CustomerInfo>
                      <CustomerName>
                            {customer.name}
                      </CustomerName>
                      <CustomerEmail>
                            {customer.email}
                      </CustomerEmail>
                    </CustomerInfo>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Amount>GH₵{getAmount(refund).toFixed(2)}</Amount>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(refund)}
                  </TableCell>
                  <TableCell>
                    {formatDate(getCreatedAt(refund))}
                  </TableCell>
                  <TableCell>
                    <ActionButton
                      onClick={() => {
                        // Navigate to refund detail page
                        // Use the order ID as refund ID since refunds are orders with refund info
                        const refundId = refund._id || refund.orderId || refund.order?._id;
                        if (refundId) {
                          navigate(`/dashboard/${PATHS.REFUND_DETAIL.replace(':refundId', refundId.toString())}`);
                        } else {
                          console.error('Refund ID not found:', refund);
                        }
                      }}
                    >
                      <FaEye />
                      View Details
                    </ActionButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationButton
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={pagination.currentPage === 1}
          >
            <FaAngleLeft />
            Previous
          </PaginationButton>
          <PageInfo>
            Page {pagination.currentPage} of {pagination.totalPages}
          </PageInfo>
          <PaginationButton
            onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
            <FaAngleRight />
          </PaginationButton>
        </Pagination>
      )}
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const TitleIcon = styled.div`
  width: 5rem;
  height: 5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  border-radius: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.4rem;
`;

const Title = styled.h1`
  font-size: 2.8rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  color: #6b7280;
  margin: 0.5rem 0 0 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 1.2rem;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const StatIcon = styled.div`
  width: 5rem;
  height: 5rem;
  border-radius: 1rem;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 2.4rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1.4rem;
  color: #6b7280;
`;

const FiltersSection = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  flex: 1;
  min-width: 300px;
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1.5rem;
  color: #9ca3af;
  font-size: 1.6rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1.2rem 1.5rem 1.2rem 4.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.8rem;
  font-size: 1.5rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 1.2rem 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.8rem;
  font-size: 1.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const DateFilterGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const DateInput = styled.input`
  padding: 1.2rem 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.8rem;
  font-size: 1.5rem;
  background: white;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 1.2rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  padding: 1.5rem;
  text-align: left;
  font-size: 1.4rem;
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.2s;

  &:hover {
    background: #f9fafb;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1.5rem;
  font-size: 1.4rem;
  color: #374151;
  text-align: ${props => props.$center ? 'center' : 'left'};
`;

const OrderNumber = styled.div`
  font-weight: 600;
  color: #6366f1;
`;

const CustomerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const CustomerName = styled.div`
  font-weight: 500;
  color: #1f2937;
`;

const CustomerEmail = styled.div`
  font-size: 1.3rem;
  color: #6b7280;
`;

const Amount = styled.div`
  font-weight: 700;
  color: #059669;
  font-size: 1.5rem;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 0.6rem;
  font-size: 1.3rem;
  font-weight: 600;
  background: ${props => {
    if (props.$status === 'refunded') return '#d1fae5';
    if (props.$status === 'processing') return '#fef3c7';
    if (props.$status === 'pending') return '#fee2e2';
    return '#e5e7eb';
  }};
  color: ${props => {
    if (props.$status === 'refunded') return '#065f46';
    if (props.$status === 'processing') return '#92400e';
    if (props.$status === 'pending') return '#991b1b';
    return '#374151';
  }};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.2rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 0.6rem;
  font-size: 1.3rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  svg {
    font-size: 1.2rem;
  }
`;

const EmptyState = styled.div`
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;

  p {
    margin: 1rem 0 0 0;
    font-size: 1.6rem;
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #6366f1;
    color: #6366f1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  font-size: 1.4rem;
  color: #6b7280;
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1.5rem;
`;

const LoaderSpinner = styled.div`
  width: 4rem;
  height: 4rem;
  border: 4px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1.5rem;
  text-align: center;

  h3 {
    font-size: 2rem;
    color: #1f2937;
    margin: 0;
  }

  p {
    font-size: 1.5rem;
    color: #6b7280;
    margin: 0.5rem 0;
  }
`;

