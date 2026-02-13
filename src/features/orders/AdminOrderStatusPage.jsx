import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTruck,
  FaBox,
  FaSpinner,
  FaCreditCard,
  FaUndo,
  FaSave,
  FaHistory,
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetOrderById } from '../../shared/hooks/useOrder';
import { useUpdateOrderStatus } from '../../shared/hooks/useUpdateOrderStatus';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { PATHS } from '../../routes/routhPath';

/**
 * AdminOrderStatusPage Component
 * Allows admin/seller to update order status with tracking history
 */
const AdminOrderStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data: orderData, isLoading, error, refetch } = useGetOrderById(orderId);
  const updateStatusMutation = useUpdateOrderStatus();

  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [optimisticTrackingEntry, setOptimisticTrackingEntry] = useState(null);

  // API returns { status: 'success', data: { data: doc } } — order doc at data.data.data
  const order =
    orderData?.data?.data?.data ??
    orderData?.data?.data ??
    orderData?.data ??
    orderData;

  useEffect(() => {
    if (!order) return;
    const rawPs = (
      order.paymentStatus ??
      orderData?.data?.data?.data?.paymentStatus ??
      orderData?.data?.data?.paymentStatus ??
      ''
    )
      .toString()
      .toLowerCase();
    const isPaidLocal = rawPs === 'paid' || rawPs === 'completed';
    const raw = (
      order.currentStatus ??
      order.status ??
      order.orderStatus ??
      'pending_payment'
    )
      .toString()
      .toLowerCase();
    const isPending = raw === 'pending' || raw === 'pending_payment';
    setStatus(
      isPaidLocal && isPending
        ? 'confirmed'
        : order.currentStatus ?? order.status ?? order.orderStatus ?? 'pending_payment',
    );
  }, [order, orderData]);

  const allStatusOptions = [
    { value: 'pending_payment', label: 'Pending Payment', icon: FaCreditCard },
    { value: 'payment_completed', label: 'Payment Completed', icon: FaCheckCircle },
    { value: 'processing', label: 'Processing', icon: FaSpinner },
    { value: 'confirmed', label: 'Confirmed', icon: FaCheckCircle },
    { value: 'preparing', label: 'Preparing', icon: FaBox },
    { value: 'ready_for_dispatch', label: 'Ready for Dispatch', icon: FaTruck },
    // International pre-order specific statuses
    { value: 'supplier_confirmed', label: 'Supplier Confirmed (Intl)', icon: FaBox },
    { value: 'awaiting_dispatch', label: 'Awaiting Intl Dispatch', icon: FaBox },
    { value: 'international_shipped', label: 'International Shipped', icon: FaTruck },
    { value: 'customs_clearance', label: 'Customs Clearance', icon: FaTruck },
    { value: 'arrived_destination', label: 'Arrived Destination', icon: FaTruck },
    { value: 'local_dispatch', label: 'Local Dispatch', icon: FaTruck },
    // Shared final statuses
    { value: 'out_for_delivery', label: 'Out for Delivery', icon: FaTruck },
    { value: 'delivered', label: 'Delivered', icon: FaCheckCircle },
    { value: 'cancelled', label: 'Cancelled', icon: FaTimesCircle },
    { value: 'refunded', label: 'Refunded', icon: FaUndo },
  ];

  const INTERNATIONAL_ONLY_STATUS_VALUES = new Set([
    'supplier_confirmed',
    'awaiting_dispatch',
    'international_shipped',
    'customs_clearance',
    'arrived_destination',
    'local_dispatch',
  ]);

  const rawPaymentStatus = (
    order?.paymentStatus ??
    orderData?.data?.data?.data?.paymentStatus ??
    orderData?.data?.data?.paymentStatus ??
    ''
  )
    .toString()
    .toLowerCase();
  const isPaid =
    rawPaymentStatus === 'paid' || rawPaymentStatus === 'completed';

  const isInternationalPreorder =
    order?.orderType === 'preorder_international';

  // Restrict international-only statuses to international pre-orders
  const baseStatusOptions = isInternationalPreorder
    ? allStatusOptions
    : allStatusOptions.filter(
        (opt) => !INTERNATIONAL_ONLY_STATUS_VALUES.has(opt.value),
      );

  // For unpaid orders, only allow cancellation (no progression)
  const selectableStatusOptions = isPaid
    ? baseStatusOptions
    : baseStatusOptions.filter((opt) => opt.value === 'cancelled');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!status) {
      alert('Please select a status');
      return;
    }

     // Guard on the client as well: do not allow updating unpaid orders
     // except to cancel them.
     if (!isPaid && status !== 'cancelled') {
       alert('Cannot update status while payment is pending. You may only cancel unpaid orders.');
       return;
     }

    // Create optimistic tracking entry for instant UI update
    const newTrackingEntry = {
      status,
      message: message.trim() || 'Order status updated',
      location: location.trim() || '',
      updatedBy: {
        name: 'You',
        email: '',
      },
      timestamp: new Date().toISOString(),
    };

    // Add optimistic entry immediately for instant UI feedback
    setOptimisticTrackingEntry(newTrackingEntry);

    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status,
        message: message.trim() || undefined,
        location: location.trim() || undefined,
      });

      // Refetch order data to get updated tracking history from server
      await refetch();
      
      // Clear optimistic entry (real data will replace it)
      setOptimisticTrackingEntry(null);
      
      // Clear form fields
      setMessage('');
      setLocation('');
      
      // Update status to the new status so form reflects the change
      setStatus(status);
      
      // Show success message
      alert('Order status updated successfully!');
      
      // Redirect to orders page after a brief delay to let user see the update
      setTimeout(() => {
        navigate(`/dashboard/${PATHS.ORDERS}`);
      }, 1500); // 1.5 second delay to let user see the update
    } catch (error) {
      console.error('Failed to update order status:', error);
      // Remove optimistic entry on error
      setOptimisticTrackingEntry(null);
      alert(error?.response?.data?.message || 'Failed to update order status');
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (error || !order) {
    return (
      <PageContainer>
        <ErrorMessage>
          <FaTimesCircle size={48} color="#e74c3c" />
          <h3>Order not found</h3>
          <p>{error?.message || 'Unable to load order details'}</p>
          <BackButton onClick={() => navigate(-1)}>Go Back</BackButton>
        </ErrorMessage>
      </PageContainer>
    );
  }

  const trackingHistory = order.trackingHistory || [];

  // Current status: if buyer has paid but backend still says pending_payment, show Confirmed so it matches payment
  const rawCurrentStatus = (order.currentStatus ?? order.status ?? order.orderStatus ?? 'pending_payment').toString().toLowerCase();
  const isPendingStatus = rawCurrentStatus === 'pending' || rawCurrentStatus === 'pending_payment';
  const displayStatusValue =
    isPaid && isPendingStatus
      ? 'confirmed'
      : (order.currentStatus || order.status || order.orderStatus || 'pending_payment');

  // Use the full status catalog to resolve the human‑readable label
  // for the current status (even if it is not selectable anymore).
  const currentStatusOption = allStatusOptions.find(
    (opt) => opt.value === displayStatusValue,
  );
  const currentStatusLabel = currentStatusOption?.label ?? 'Unknown';

  // Add optimistic entry if it exists (for instant UI update)
  let historyWithOptimistic = [...trackingHistory];
  if (optimisticTrackingEntry) {
    historyWithOptimistic = [...trackingHistory, optimisticTrackingEntry];
  }
  
  const sortedHistory = historyWithOptimistic.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  return (
    <PageContainer>
      <PageHeader>
        <HeaderTitle>
          <h1>Update Order Status</h1>
          <p>Order #{order.orderNumber ?? orderData?.data?.data?.data?.orderNumber ?? orderData?.data?.data?.orderNumber ?? "—"}</p>
        </HeaderTitle>
        <BackButton onClick={() => navigate(-1)}>← Back</BackButton>
      </PageHeader>

      <ContentGrid>
        {/* Status Update Form */}
        <FormCard>
          <CardHeader>
            <CardTitle>
              <FaSave />
              Update Status
            </CardTitle>
          </CardHeader>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Current Status</Label>
              <CurrentStatusBadge status={displayStatusValue}>
                {currentStatusLabel}
              </CurrentStatusBadge>
              {isPaid && isPendingStatus && (
                <PaymentNoteSpan>Payment received; order is confirmed.</PaymentNoteSpan>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="status">New Status *</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                disabled={!isPaid && selectableStatusOptions.length === 0}
              >
                <option value="">Select status...</option>
                {selectableStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {!isPaid && (
                <PaymentNoteSpan>
                  Payment is still pending. You can only cancel unpaid orders; other
                  status updates are disabled until payment is completed.
                </PaymentNoteSpan>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g., Order is being prepared, Rider has picked up the package..."
                rows={3}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Warehouse A, Accra Central..."
              />
            </FormGroup>

            <SubmitButton
              type="submit"
              disabled={
                updateStatusMutation.isPending ||
                (!isPaid && status !== 'cancelled')
              }
            >
              {updateStatusMutation.isPending ? (
                <>
                  <LoadingSpinner />
                  Updating...
                </>
              ) : (
                <>
                  <FaSave />
                  Update Status
                </>
              )}
            </SubmitButton>
          </Form>
        </FormCard>

        {/* Tracking History */}
        <HistoryCard>
          <CardHeader>
            <CardTitle>
              <FaHistory />
              Tracking History
            </CardTitle>
          </CardHeader>
          <HistoryList>
            {sortedHistory.length === 0 ? (
              <EmptyHistory>
                <p>No tracking history available yet</p>
              </EmptyHistory>
            ) : (
              sortedHistory.map((entry, index) => {
                const statusOption = allStatusOptions.find(
                  (opt) => opt.value === entry.status,
                );
                const Icon = statusOption?.icon || FaSpinner;
                const isLast = index === sortedHistory.length - 1;

                return (
                  <HistoryItem key={index} isLast={isLast}>
                    <HistoryIcon status={entry.status}>
                      <Icon />
                    </HistoryIcon>
                    <HistoryContent>
                      <HistoryStatus>{statusOption?.label || entry.status}</HistoryStatus>
                      {entry.message && <HistoryMessage>{entry.message}</HistoryMessage>}
                      {entry.location && (
                        <HistoryLocation>
                          📍 {entry.location}
                        </HistoryLocation>
                      )}
                      <HistoryTime>
                        {new Date(entry.timestamp).toLocaleString()}
                      </HistoryTime>
                      {entry.updatedBy && (
                        <HistoryUpdatedBy>
                          Updated by: {entry.updatedBy?.name || entry.updatedBy?.email || 'System'}
                        </HistoryUpdatedBy>
                      )}
                    </HistoryContent>
                  </HistoryItem>
                );
              })
            )}
          </HistoryList>
        </HistoryCard>
      </ContentGrid>
    </PageContainer>
  );
};

export default AdminOrderStatusPage;

// Styled Components
const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderTitle = styled.div`
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  p {
    color: #666;
    font-size: 0.95rem;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f8f9fa;
  color: #333;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e9ecef;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const FormCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const HistoryCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: 600px;
  overflow-y: auto;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
`;

const CardTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
`;

const Form = styled.form`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
`;

const CurrentStatusBadge = styled.div`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  background: ${(props) => {
    const status = props.status || 'pending_payment';
    if (status === 'delivered') return '#d4edda';
    if (status === 'confirmed') return '#d4edda';
    if (status === 'cancelled') return '#f8d7da';
    if (status === 'out_for_delivery') return '#d1ecf1';
    return '#fff3cd';
  }};
  color: ${(props) => {
    const status = props.status || 'pending_payment';
    if (status === 'delivered') return '#155724';
    if (status === 'confirmed') return '#155724';
    if (status === 'cancelled') return '#721c24';
    if (status === 'out_for_delivery') return '#0c5460';
    return '#856404';
  }};
`;

const PaymentNoteSpan = styled.span`
  display: block;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #155724;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4361ee;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #4361ee;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: #4361ee;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #4361ee;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #3a0ca3;
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;

const HistoryList = styled.div`
  padding: 1.5rem;
`;

const HistoryItem = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: ${(props) => (props.isLast ? '0' : '1.5rem')};
  padding-bottom: ${(props) => (props.isLast ? '0' : '1.5rem')};
  border-bottom: ${(props) => (props.isLast ? 'none' : '1px solid #f0f0f0')};
`;

const HistoryIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => {
    const status = props.status || 'pending_payment';
    if (status === 'delivered') return '#d4edda';
    if (status === 'cancelled') return '#f8d7da';
    if (status === 'out_for_delivery') return '#d1ecf1';
    return '#fff3cd';
  }};
  color: ${(props) => {
    const status = props.status || 'pending_payment';
    if (status === 'delivered') return '#155724';
    if (status === 'cancelled') return '#721c24';
    if (status === 'out_for_delivery') return '#0c5460';
    return '#856404';
  }};
  flex-shrink: 0;
`;

const HistoryContent = styled.div`
  flex: 1;
`;

const HistoryStatus = styled.div`
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
`;

const HistoryMessage = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const HistoryLocation = styled.div`
  color: #4361ee;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
`;

const HistoryTime = styled.div`
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
`;

const HistoryUpdatedBy = styled.div`
  color: #999;
  font-size: 0.75rem;
  font-style: italic;
`;

const EmptyHistory = styled.div`
  text-align: center;
  padding: 3rem;
  color: #999;
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  gap: 1rem;

  h3 {
    color: #e74c3c;
    margin-top: 1rem;
  }

  p {
    color: #666;
  }
`;

