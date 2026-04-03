import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useGetShippingCharges, useGetShippingChargesSummary, useSettleShippingCharge } from '../../hooks/useShipping';
import { useOfficialStore } from '../../shared/hooks/useOfficialStore';
import { formatDate } from '../../shared/utils/helpers';
import { ConfirmationModal } from '../../shared/components/Modal/ConfirmationModal';
import {
  FaTruck,
  FaMoneyBillWave,
  FaPercentage,
  FaCheckCircle,
  FaExclamationCircle,
  FaAngleLeft,
  FaAngleRight,
  FaShoppingCart,
  FaSave,
} from 'react-icons/fa';
import Button from '../../components/ui/Button';

export default function ShippingDashboardPage({ embedded = false }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [chargeToSettle, setChargeToSettle] = useState(null);

  const { data: chargesData, isLoading, refetch } = useGetShippingCharges({ page, limit, status: statusFilter });
  const { data: summaryData, isLoading: summaryLoading } = useGetShippingChargesSummary();
  const settleMutation = useSettleShippingCharge();

  const { useGetOfficialStoreShippingFees, useUpdateOfficialStoreShippingFees } = useOfficialStore();
  const { data: platformFeesData, isLoading: platformFeesLoading } = useGetOfficialStoreShippingFees();
  const updatePlatformFeesMutation = useUpdateOfficialStoreShippingFees();

  const platformFees = platformFeesData ?? null;
  const [freeDeliveryThresholdInput, setFreeDeliveryThresholdInput] = useState('');

  useEffect(() => {
    if (!platformFees) return;
    const t = platformFees.freeDeliveryThreshold;
    if (t != null && Number(t) > 0) {
      setFreeDeliveryThresholdInput(String(Number(t)));
    } else {
      setFreeDeliveryThresholdInput('');
    }
  }, [platformFees]);

  const handleSaveFreeDeliveryThreshold = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(String(freeDeliveryThresholdInput).trim(), 10);
    const freeDeliveryThreshold =
      Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null;
    try {
      await updatePlatformFeesMutation.mutateAsync({ freeDeliveryThreshold });
      toast.success(
        freeDeliveryThreshold != null
          ? `Buyer cart will show free delivery at GH₵${freeDeliveryThreshold}+`
          : 'Buyer cart free-delivery banner disabled (no minimum).',
      );
    } catch (err) {
      toast.error(err?.message || 'Failed to update free delivery threshold');
    }
  };

  const charges = chargesData?.data || [];
  const pagination = chargesData?.pagination || { page: 1, limit: 10, totalPages: 1 };
  const totalItems = chargesData?.total || 0;

  const summary = summaryData?.data || {
    totalShippingRevenue: 0,
    totalPlatformCut: 0,
    totalDispatcherPayoutPaid: 0,
    totalDispatcherPayoutPending: 0
  };

  const hasNext = page < pagination.totalPages;
  const hasPrev = page > 1;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  const handleSettle = (charge) => {
    setChargeToSettle(charge);
  };

  const confirmSettle = async () => {
    if (!chargeToSettle) return;
    await settleMutation.mutateAsync(chargeToSettle._id);
    setChargeToSettle(null);
  };

  if (isLoading || summaryLoading) {
    return (
      <Container $embedded={embedded}>
        <p>Loading shipping dashboard...</p>
      </Container>
    );
  }

  const content = (
    <>
      <StatsContainer>
        <StatCard>
          <StatIcon $color="#3498db"><FaMoneyBillWave /></StatIcon>
          <StatContent>
            <StatValue>Gh₵{summary.totalShippingRevenue.toFixed(2)}</StatValue>
            <StatLabel>Total Shipping Revenue</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon $color="#9b59b6"><FaPercentage /></StatIcon>
          <StatContent>
            <StatValue>Gh₵{summary.totalPlatformCut.toFixed(2)}</StatValue>
            <StatLabel>Total Platform Cut</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon $color="#f39c12"><FaExclamationCircle /></StatIcon>
          <StatContent>
            <StatValue>Gh₵{summary.totalDispatcherPayoutPending.toFixed(2)}</StatValue>
            <StatLabel>Pending Payouts</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon $color="#2ecc71"><FaCheckCircle /></StatIcon>
          <StatContent>
            <StatValue>Gh₵{summary.totalDispatcherPayoutPaid.toFixed(2)}</StatValue>
            <StatLabel>Settled Payouts</StatLabel>
          </StatContent>
        </StatCard>
      </StatsContainer>

      <BuyerCartShippingCard>
        <BuyerCartShippingHeader>
          <FaShoppingCart />
          <div>
            <BuyerCartShippingTitle>Buyer app — free delivery minimum</BuyerCartShippingTitle>
            <BuyerCartShippingDesc>
              Controls the cart message &quot;Add GH₵X more for free shipping&quot; on{' '}
              <strong>saiisaiweb</strong>. Uses the same setting as Official Store → Shipping fees.
              Leave empty or save 0 to hide that promo on the cart.
            </BuyerCartShippingDesc>
          </div>
        </BuyerCartShippingHeader>
        <BuyerCartShippingForm onSubmit={handleSaveFreeDeliveryThreshold}>
          <BuyerCartField>
            <BuyerCartLabel htmlFor="free-delivery-threshold-dashboard">
              Minimum cart subtotal (GHS)
            </BuyerCartLabel>
            <BuyerCartInputRow>
              <BuyerCartInput
                id="free-delivery-threshold-dashboard"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 100 (empty = off)"
                value={freeDeliveryThresholdInput}
                onChange={(e) => setFreeDeliveryThresholdInput(e.target.value)}
                disabled={platformFeesLoading || updatePlatformFeesMutation.isPending}
              />
              <BuyerCartSaveBtn
                type="submit"
                disabled={platformFeesLoading || updatePlatformFeesMutation.isPending}
              >
                <FaSave />
                {updatePlatformFeesMutation.isPending ? 'Saving…' : 'Save'}
              </BuyerCartSaveBtn>
            </BuyerCartInputRow>
          </BuyerCartField>
        </BuyerCartShippingForm>
      </BuyerCartShippingCard>

      <ControlsContainer>
        <FilterGroup>
          <FilterLabel>Status</FilterLabel>
          <FilterSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="settled">Settled</option>
            <option value="refunded">Refunded</option>
          </FilterSelect>
        </FilterGroup>
      </ControlsContainer>

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <HeaderCell>Order</HeaderCell>
              <HeaderCell>Date</HeaderCell>
              <HeaderCell>Total Charge</HeaderCell>
              <HeaderCell>Platform Cut</HeaderCell>
              <HeaderCell>Dispatcher Payout</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Actions</HeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {charges.length > 0 ? (
              charges.map((charge) => (
                <TableRow key={charge._id}>
                  <TableCell>{charge.orderId?.orderNumber || 'Unknown'}</TableCell>
                  <TableCell>{formatDate(charge.createdAt)}</TableCell>
                  <TableCell>Gh₵{charge.totalShippingAmount.toFixed(2)}</TableCell>
                  <TableCell>Gh₵{charge.platformCut.toFixed(2)} ({charge.platformCutRate}%)</TableCell>
                  <TableCell>Gh₵{charge.dispatcherPayout.toFixed(2)}</TableCell>
                  <TableCell>
                    <StatusBadge $status={charge.status}>
                      {charge.status.charAt(0).toUpperCase() + charge.status.slice(1)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    {charge.status === 'pending' && (
                      <SettleBtn
                        onClick={() => handleSettle(charge)}
                        disabled={settleMutation.isPending}
                      >
                        Settle Payout
                      </SettleBtn>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No shipping charges found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <PaginationContainer>
        <PageSizeControl>
          <span>Items per page:</span>
          <PageSizeSelect
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </PageSizeSelect>
        </PageSizeControl>

        <PaginationInfo>
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} items
        </PaginationInfo>

        <PaginationControls>
          <PaginationButton disabled={!hasPrev} onClick={() => handlePageChange(1)}>
            <FaAngleLeft /><FaAngleLeft style={{ marginLeft: '-8px' }} />
          </PaginationButton>
          <PaginationButton disabled={!hasPrev} onClick={() => handlePageChange(page - 1)}>
            <FaAngleLeft />
          </PaginationButton>
          <PageInfo>Page {page} of {pagination.totalPages}</PageInfo>
          <PaginationButton disabled={!hasNext} onClick={() => handlePageChange(page + 1)}>
            <FaAngleRight />
          </PaginationButton>
          <PaginationButton disabled={!hasNext} onClick={() => handlePageChange(pagination.totalPages)}>
            <FaAngleRight /><FaAngleRight style={{ marginLeft: '-8px' }} />
          </PaginationButton>
        </PaginationControls>
      </PaginationContainer>

      <ConfirmationModal
        isOpen={!!chargeToSettle}
        onClose={() => setChargeToSettle(null)}
        onConfirm={confirmSettle}
        title="Settle Dispatcher Payout"
        message={`Are you sure you want to mark this payout of Gh₵${chargeToSettle?.dispatcherPayout?.toFixed(2) || 0} as settled for order ${chargeToSettle?.orderId?.orderNumber || 'Unknown'}?`}
        confirmText={settleMutation.isPending ? "Settling..." : "Mark as Settled"}
        confirmColor="#2ecc71"
      />
    </>
  );

  if (embedded) {
    return <Container $embedded={embedded}>{content}</Container>;
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaTruck /> Shipping Dashboard
        </Title>
        <Description>Track shipping charges, platform cuts, and dispatcher payouts</Description>
      </Header>
      {content}
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  padding: ${props => props.$embedded ? '0' : '2rem'};
  background-color: ${props => props.$embedded ? 'transparent' : '#f8fafc'};
  min-height: ${props => props.$embedded ? 'auto' : '100vh'};
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  color: #7f8c8d;
  font-size: 1rem;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
`;

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
  color: white;
  background-color: ${(props) => props.$color || "#3498db"};
`;

const StatContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #2c3e50;
`;

const StatLabel = styled.div`
  color: #7f8c8d;
  font-size: 0.875rem;
`;

const BuyerCartShippingCard = styled.div`
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2rem;
  color: #f8fafc;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
`;

const BuyerCartShippingHeader = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;

  svg:first-child {
    font-size: 1.5rem;
    color: #fbbf24;
    flex-shrink: 0;
    margin-top: 0.15rem;
  }
`;

const BuyerCartShippingTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.35rem 0;
  color: #fff;
`;

const BuyerCartShippingDesc = styled.p`
  font-size: 0.82rem;
  line-height: 1.5;
  margin: 0;
  color: rgba(248, 250, 252, 0.85);
`;

const BuyerCartShippingForm = styled.form`
  margin: 0;
`;

const BuyerCartField = styled.div`
  width: 100%;
`;

const BuyerCartLabel = styled.label`
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: rgba(248, 250, 252, 0.95);
`;

const BuyerCartInputRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
`;

const BuyerCartInput = styled.input`
  flex: 1;
  min-width: 160px;
  max-width: 280px;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(15, 23, 42, 0.5);
  color: #fff;
  font-size: 0.95rem;

  &::placeholder {
    color: rgba(248, 250, 252, 0.45);
  }

  &:focus {
    outline: none;
    border-color: #fbbf24;
    box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.25);
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const BuyerCartSaveBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.25rem;
  background: #fbbf24;
  color: #0f172a;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #f59e0b;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ControlsContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.25rem;
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  min-width: 150px;
  outline: none;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 10px;
  overflow-x: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background-color: #f8fafc;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background-color: #f1f5f9;
  }
`;

const HeaderCell = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  font-size: 0.875rem;
`;

const TableBody = styled.tbody``;

const TableCell = styled.td`
  padding: 1rem 1.5rem;
  color: #2c3e50;
  font-size: 0.9rem;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: ${(props) => {
    switch (props.$status) {
      case 'settled': return '#dcfce7';
      case 'refunded': return '#fee2e2';
      default: return '#fef9c3';
    }
  }};
  color: ${(props) => {
    switch (props.$status) {
      case 'settled': return '#166534';
      case 'refunded': return '#991b1b';
      default: return '#854d0e';
    }
  }};
`;

const SettleBtn = styled.button`
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background-color: #27ae60;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const PageSizeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4a5568;
`;

const PageSizeSelect = styled.select`
  padding: 0.35rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
`;

const PaginationInfo = styled.div`
  color: #7f8c8d;
  font-size: 0.875rem;
  margin: 1rem 0;

  @media (min-width: 768px) {
    margin: 0;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f1f5f9;
    color: #2c3e50;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  font-size: 0.875rem;
  color: #4a5568;
  margin: 0 0.5rem;
`;
