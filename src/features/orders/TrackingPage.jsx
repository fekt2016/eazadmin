import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaBox,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaExclamationCircle,
  FaShoppingBag,
  FaCreditCard,
  FaDollarSign,
  FaCalendarAlt,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import { toast } from "react-toastify";
import { useGetOrderByTrackingNumber, useAddTrackingUpdate } from "../../shared/hooks/useOrder";

const TrackingPage = () => {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Use React Query hook to fetch tracking data
  const {
    data: orderData,
    isLoading,
    error: queryError,
  } = useGetOrderByTrackingNumber(trackingNumber);

  // Use React Query mutation for adding tracking updates
  const addTrackingUpdateMutation = useAddTrackingUpdate();

  // Extract error message from query error
  const error = queryError?.message || (queryError ? "Failed to load tracking information" : null);

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (error || !orderData) {
    return (
      <PageContainer>
        <ErrorContainer>
          <ErrorTitle>Tracking Not Found</ErrorTitle>
          <ErrorMessage>{error || "Order not found with this tracking number"}</ErrorMessage>
        </ErrorContainer>
        <BackButton onClick={() => navigate(-1)}>
          <FaArrowLeft />
          Go Back
        </BackButton>
      </PageContainer>
    );
  }

  const getStatusIcon = (status, iconType) => {
    if (iconType === 'order') return <FaBox />;
    if (iconType === 'payment') return <FaCreditCard />;
    if (iconType === 'processing') return <FaBox />;
    if (iconType === 'preparing') return <FaBox />;
    if (iconType === 'rider') return <FaTruck />;
    if (iconType === 'delivery') return <FaTruck />;
    if (iconType === 'delivered') return <FaCheckCircle />;
    
    switch (status) {
      case "pending_payment":
        return <FaClock />;
      case "payment_completed":
        return <FaCreditCard />;
      case "processing":
      case "confirmed":
      case "preparing":
        return <FaBox />;
      case "ready_for_dispatch":
      case "out_for_delivery":
        return <FaTruck />;
      case "delivered":
        return <FaCheckCircle />;
      case "cancelled":
      case "refunded":
        return <FaExclamationCircle />;
      default:
        return <FaClock />;
    }
  };

  const getStepColor = (step) => {
    if (step.isCompleted) {
      return "#F7C948"; // Yellow for completed
    } else if (step.isActive) {
      return "#2D7FF9"; // Blue for active
    } else {
      return "#D1D5DB"; // Gray for pending
    }
  };

  const getStepBgColor = (step) => {
    if (step.isCompleted) {
      return "#F7C948"; // Yellow background
    } else if (step.isActive) {
      return "#2D7FF9"; // Blue background
    } else {
      return "#E5E7EB"; // Gray background
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatusLabel = (status) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const trackingHistory = orderData.trackingHistory || [];
  const currentStatus = orderData.currentStatus || "pending_payment";
  const orderItems = orderData.orderItems || [];
  const paymentStatus = orderData.paymentStatus || "pending";

  // Define all possible tracking steps in order
  const ALL_TRACKING_STEPS = [
    { status: 'pending_payment', label: 'Order Placed', icon: 'order' },
    { status: 'payment_completed', label: 'Payment Completed', icon: 'payment' },
    { status: 'processing', label: 'Processing Order', icon: 'processing' },
    { status: 'preparing', label: 'Preparing for Dispatch', icon: 'preparing' },
    { status: 'ready_for_dispatch', label: 'Rider Assigned', icon: 'rider' },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: 'delivery' },
    { status: 'delivered', label: 'Delivered', icon: 'delivered' },
  ];

  // Map currentStatus to active step index
  // If order is paid but status is still pending_payment, move to payment_completed
  const getActiveStepIndex = () => {
    // If payment is paid but status hasn't been updated, show payment_completed as active
    if ((paymentStatus === 'paid' || paymentStatus === 'completed') && currentStatus === 'pending_payment') {
      return 1; // payment_completed
    }
    
    const statusToIndex = {
      'pending_payment': 0,
      'payment_completed': 1,
      'processing': 2,
      'confirmed': 2,
      'preparing': 3,
      'ready_for_dispatch': 4,
      'out_for_delivery': 5,
      'delivered': 6,
    };
    return statusToIndex[currentStatus] ?? 0;
  };

  const activeStepIndex = getActiveStepIndex();

  // Build complete timeline with all steps
  const buildCompleteTimeline = () => {
    return ALL_TRACKING_STEPS.map((step, index) => {
      // Check if this step has a tracking history entry
      let historyEntry = trackingHistory.find(entry => entry.status === step.status);
      
      // Special handling: If payment is paid but no payment_completed entry exists,
      // create a virtual entry for display
      if (step.status === 'payment_completed' && (paymentStatus === 'paid' || paymentStatus === 'completed') && !historyEntry) {
        historyEntry = {
          status: 'payment_completed',
          message: 'Your payment has been confirmed.',
          timestamp: orderData.paidAt || orderData.createdAt,
        };
      }
      
      const isCompleted = index < activeStepIndex;
      const isActive = index === activeStepIndex;
      const isPending = index > activeStepIndex;

      return {
        ...step,
        historyEntry,
        isCompleted,
        isActive,
        isPending,
        stepIndex: index,
      };
    });
  };

  const completeTimeline = buildCompleteTimeline();

  // Get estimated delivery from shipping options (stored in order)
  const getEstimatedDelivery = () => {
    // Use the deliveryEstimate from shipping options if available
    if (orderData.deliveryEstimate) {
      // If it's already a formatted date string, return it
      if (orderData.deliveryEstimate.includes('Today') || 
          orderData.deliveryEstimate.includes('Business Day') ||
          orderData.deliveryEstimate.includes('Arrives')) {
        return orderData.deliveryEstimate;
      }
      
      // If it's a number (days), calculate the actual date
      const days = parseInt(orderData.deliveryEstimate);
      if (!isNaN(days) && orderData.createdAt) {
        const orderDate = new Date(orderData.createdAt);
        const estimatedDate = new Date(orderDate);
        estimatedDate.setDate(estimatedDate.getDate() + days);
        
        return estimatedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      
      // Return as-is if it's already a formatted string
      return orderData.deliveryEstimate;
    }
    
    // Fallback: calculate based on order date and shipping type if no estimate stored
    if (orderData.createdAt) {
      const orderDate = new Date(orderData.createdAt);
      const estimatedDate = new Date(orderDate);
      
      // Use shippingType to determine days
      if (orderData.shippingType === 'same_day') {
        return 'Arrives Today';
      } else if (orderData.shippingType === 'express') {
        estimatedDate.setDate(estimatedDate.getDate() + 1);
        return estimatedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } else {
        // Standard delivery: 2-3 business days
        estimatedDate.setDate(estimatedDate.getDate() + 3);
        return estimatedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    }
    
    return null;
  };

  const estimatedDelivery = getEstimatedDelivery();

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <FaArrowLeft />
          Back
        </BackButton>
        <Title>Order Tracking</Title>
        {orderData && orderData.currentStatus !== 'delivered' && (
          <UpdateTrackingButton onClick={() => setShowUpdateModal(true)}>
            <FaPlus />
            Update Tracking
          </UpdateTrackingButton>
        )}
      </Header>

      <ContentGrid>
        {/* Main Tracking Card */}
        <MainCard>
        <TrackingHeader>
          <TrackingNumber>
            Tracking Number: <strong>{orderData.trackingNumber}</strong>
          </TrackingNumber>
          <OrderNumber>
            Order Number: <strong>{orderData.orderNumber}</strong>
          </OrderNumber>
          {estimatedDelivery && (
            <EstimatedDeliveryHeader>
              <FaCalendarAlt style={{ marginRight: '0.5rem' }} />
              Expected Delivery: <strong>{estimatedDelivery}</strong>
            </EstimatedDeliveryHeader>
          )}
        </TrackingHeader>

        <CurrentStatus>
          <StatusLabel>Current Status</StatusLabel>
          <StatusBadge $color={getStepColor(completeTimeline.find(s => s.isActive) || completeTimeline[0])}>
            {getStatusIcon(currentStatus)}
            {formatStatusLabel(currentStatus)}
          </StatusBadge>
        </CurrentStatus>

        {estimatedDelivery && (
          <DeliveryEstimateSection>
            <DeliveryEstimateLabel>
              <FaCalendarAlt style={{ marginRight: '0.5rem' }} />
              Estimated Delivery Date
            </DeliveryEstimateLabel>
            <DeliveryEstimateValue>
              {estimatedDelivery}
            </DeliveryEstimateValue>
          </DeliveryEstimateSection>
        )}

        <TimelineSection>
          <TimelineTitle>Tracking History</TimelineTitle>
          <Timeline>
            {completeTimeline.map((step, index) => {
              const isLast = index === completeTimeline.length - 1;
              const stepColor = getStepColor(step);
              const stepBgColor = getStepBgColor(step);
              
              return (
                <TimelineItem key={step.status} $completed={step.isCompleted} $isActive={step.isActive} $isLast={isLast}>
                  <TimelineIcon $color={stepColor} $bgColor={stepBgColor} $completed={step.isCompleted} $isActive={step.isActive}>
                    {getStatusIcon(step.status, step.icon)}
                  </TimelineIcon>
                  <TimelineContent>
                    <TimelineStatus $color={stepColor}>
                      {step.isCompleted && <FaCheckCircle style={{ marginRight: '0.5rem', color: stepColor }} />}
                      {step.label}
                    </TimelineStatus>
                    {step.historyEntry && step.historyEntry.message && (
                      <TimelineMessage>{step.historyEntry.message}</TimelineMessage>
                    )}
                    {step.historyEntry && step.historyEntry.timestamp && (
                      <TimelineDate>{formatDate(step.historyEntry.timestamp)}</TimelineDate>
                    )}
                    {step.historyEntry && step.historyEntry.location && (
                      <TimelineLocation>
                        <FaMapMarkerAlt />
                        {step.historyEntry.location}
                      </TimelineLocation>
                    )}
                  </TimelineContent>
                  {!isLast && <TimelineLine $color={step.isCompleted ? stepColor : "#E5E7EB"} />}
                </TimelineItem>
              );
            })}
          </Timeline>
        </TimelineSection>

        <ShippingInfo>
          <InfoTitle>
            <FaMapMarkerAlt style={{ marginRight: '0.5rem' }} />
            Shipping Address
          </InfoTitle>
          {orderData.shippingAddress && Object.keys(orderData.shippingAddress).length > 0 ? (
            <AddressGrid>
              {orderData.shippingAddress.fullName && (
                <AddressItem>
                  <AddressLabel>Full Name</AddressLabel>
                  <AddressValue>{orderData.shippingAddress.fullName}</AddressValue>
                </AddressItem>
              )}
              {orderData.shippingAddress.streetAddress && (
                <AddressItem>
                  <AddressLabel>Street Address</AddressLabel>
                  <AddressValue>{orderData.shippingAddress.streetAddress}</AddressValue>
                </AddressItem>
              )}
              {orderData.shippingAddress.area && (
                <AddressItem>
                  <AddressLabel>Area/Neighborhood</AddressLabel>
                  <AddressValue>{orderData.shippingAddress.area}</AddressValue>
                </AddressItem>
              )}
              {orderData.shippingAddress.landmark && (
                <AddressItem>
                  <AddressLabel>Landmark</AddressLabel>
                  <AddressValue>{orderData.shippingAddress.landmark}</AddressValue>
                </AddressItem>
              )}
              {(orderData.shippingAddress.city || orderData.shippingAddress.state) && (
                <AddressItem>
                  <AddressLabel>City/State</AddressLabel>
                  <AddressValue>
                    {orderData.shippingAddress.city && typeof orderData.shippingAddress.city === 'string' && orderData.shippingAddress.city.charAt(0).toUpperCase() + orderData.shippingAddress.city.slice(1)}
                    {orderData.shippingAddress.city && orderData.shippingAddress.state && ', '}
                    {orderData.shippingAddress.state && typeof orderData.shippingAddress.state === 'string' && orderData.shippingAddress.state.charAt(0).toUpperCase() + orderData.shippingAddress.state.slice(1)}
                  </AddressValue>
                </AddressItem>
              )}
              {orderData.shippingAddress.region && (
                <AddressItem>
                  <AddressLabel>Region</AddressLabel>
                  <AddressValue>
                    {typeof orderData.shippingAddress.region === 'string' 
                      ? orderData.shippingAddress.region.split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')
                      : orderData.shippingAddress.region}
                  </AddressValue>
                </AddressItem>
              )}
              {(orderData.shippingAddress.digitalAddress || orderData.shippingAddress.digitalAdress) && (
                <AddressItem>
                  <AddressLabel>Digital Address</AddressLabel>
                  <AddressValue>{orderData.shippingAddress.digitalAddress || orderData.shippingAddress.digitalAdress}</AddressValue>
                </AddressItem>
              )}
              {orderData.shippingAddress.contactPhone && (
                <AddressItem>
                  <AddressLabel>Contact Phone</AddressLabel>
                  <AddressValue>{orderData.shippingAddress.contactPhone}</AddressValue>
                </AddressItem>
              )}
              {orderData.shippingAddress.country && (
                <AddressItem>
                  <AddressLabel>Country</AddressLabel>
                  <AddressValue>{orderData.shippingAddress.country}</AddressValue>
                </AddressItem>
              )}
              {orderData.shippingAddress.additionalInformation && (
                <AddressItem $fullWidth>
                  <AddressLabel>Additional Information</AddressLabel>
                  <AddressValue>{orderData.shippingAddress.additionalInformation}</AddressValue>
                </AddressItem>
              )}
            </AddressGrid>
          ) : (
            <EmptyAddress>
              Shipping address information is not available for this order.
            </EmptyAddress>
          )}
        </ShippingInfo>
        </MainCard>

        {/* Sidebar - Order Summary & Items */}
        <Sidebar>
          {/* Order Items */}
          {orderItems.length > 0 && (
            <SidebarCard>
              <CardTitle>
                <FaShoppingBag />
                Order Items
              </CardTitle>
              <ItemsList>
                {orderItems.map((item, index) => (
                  <ItemCard key={index}>
                    {item.product?.imageCover && (
                      <ItemImage src={item.product.imageCover} alt={item.product?.name || 'Product'} />
                    )}
                    <ItemInfo>
                      <ItemName>{item.product?.name || 'Product'}</ItemName>
                      <ItemDetails>
                        <ItemQuantity>Qty: {item.quantity || 1}</ItemQuantity>
                        <ItemPrice>GH₵{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</ItemPrice>
                      </ItemDetails>
                    </ItemInfo>
                  </ItemCard>
                ))}
              </ItemsList>
            </SidebarCard>
          )}

          {/* Order Summary */}
          <SidebarCard>
            <CardTitle>
              <FaDollarSign />
              Order Summary
            </CardTitle>
            <SummaryList>
              <SummaryRow>
                <SummaryLabel>Subtotal</SummaryLabel>
                <SummaryValue>GH₵{(orderData.subtotal || 0).toFixed(2)}</SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>Shipping</SummaryLabel>
                <SummaryValue>GH₵{(orderData.shippingCost || 0).toFixed(2)}</SummaryValue>
              </SummaryRow>
              {orderData.tax > 0 && (
                <SummaryRow>
                  <SummaryLabel>Tax</SummaryLabel>
                  <SummaryValue>GH₵{(orderData.tax || 0).toFixed(2)}</SummaryValue>
                </SummaryRow>
              )}
              <SummaryRow $total>
                <SummaryLabel>Total</SummaryLabel>
                <SummaryValue>GH₵{(orderData.totalPrice || 0).toFixed(2)}</SummaryValue>
              </SummaryRow>
            </SummaryList>
          </SidebarCard>

          {/* Payment Information */}
          <SidebarCard>
            <CardTitle>
              <FaCreditCard />
              Payment Information
            </CardTitle>
            <InfoList>
              <InfoRow>
                <InfoLabel>Payment Method</InfoLabel>
                <InfoValue>
                  {orderData.paymentMethod 
                    ? orderData.paymentMethod.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')
                    : 'N/A'}
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Payment Status</InfoLabel>
                <InfoValue>
                  <PaymentBadge $paid={orderData.paymentStatus === 'paid' || orderData.paymentStatus === 'completed'}>
                    {(orderData.paymentStatus === 'paid' || orderData.paymentStatus === 'completed') ? 'Paid' : 'Pending'}
                  </PaymentBadge>
                </InfoValue>
              </InfoRow>
              {orderData.paidAt && (
                <InfoRow>
                  <InfoLabel>Paid On</InfoLabel>
                  <InfoValue>{formatDate(orderData.paidAt)}</InfoValue>
                </InfoRow>
              )}
            </InfoList>
          </SidebarCard>

          {/* Delivery Information */}
          {(orderData.deliveryMethod || orderData.deliveryEstimate) && (
            <SidebarCard>
              <CardTitle>
                <FaTruck />
                Delivery Information
              </CardTitle>
              <InfoList>
                {orderData.deliveryMethod && (
                  <InfoRow>
                    <InfoLabel>Delivery Method</InfoLabel>
                    <InfoValue>
                      {orderData.deliveryMethod === 'pickup_center' 
                        ? 'Pickup from Saiisai Center'
                        : orderData.deliveryMethod === 'dispatch'
                        ? 'EazShop Dispatch Rider'
                        : orderData.deliveryMethod === 'seller_delivery'
                        ? "Seller's Own Delivery"
                        : orderData.deliveryMethod.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                    </InfoValue>
                  </InfoRow>
                )}
                {estimatedDelivery && (
                  <InfoRow>
                    <InfoLabel>
                      <FaCalendarAlt style={{ marginRight: '0.25rem' }} />
                      Estimated Delivery Date
                    </InfoLabel>
                    <InfoValue>{estimatedDelivery}</InfoValue>
                  </InfoRow>
                )}
                {orderData.deliveryZone && (
                  <InfoRow>
                    <InfoLabel>Delivery Zone</InfoLabel>
                    <InfoValue>
                      Zone {orderData.deliveryZone}
                      {orderData.deliveryZone === 'A' && ' (Same City)'}
                      {orderData.deliveryZone === 'B' && ' (Nearby City)'}
                      {orderData.deliveryZone === 'C' && ' (Nationwide)'}
                    </InfoValue>
                  </InfoRow>
                )}
                {orderData.deliveryMethod === 'pickup_center' && orderData.pickupCenter && (
                  <>
                    <InfoRow>
                      <InfoLabel>
                        <FaMapMarkerAlt style={{ marginRight: '0.25rem' }} />
                        Pickup Center
                      </InfoLabel>
                      <InfoValue>
                        <strong>{orderData.pickupCenter.pickupName || 'Saiisai Pickup Center'}</strong>
                      </InfoValue>
                    </InfoRow>
                    {orderData.pickupCenter.address && (
                      <InfoRow>
                        <InfoLabel>Address</InfoLabel>
                        <InfoValue>{orderData.pickupCenter.address}</InfoValue>
                      </InfoRow>
                    )}
                    {(orderData.pickupCenter.city || orderData.pickupCenter.area) && (
                      <InfoRow>
                        <InfoLabel>Location</InfoLabel>
                        <InfoValue>
                          {orderData.pickupCenter.area && (
                            <span>{orderData.pickupCenter.area}</span>
                          )}
                          {orderData.pickupCenter.area && orderData.pickupCenter.city && ', '}
                          {orderData.pickupCenter.city && (
                            <span>{orderData.pickupCenter.city.charAt(0).toUpperCase() + orderData.pickupCenter.city.slice(1)}</span>
                          )}
                        </InfoValue>
                      </InfoRow>
                    )}
                    {orderData.pickupCenter.openingHours && (
                      <InfoRow>
                        <InfoLabel>
                          <FaClock style={{ marginRight: '0.25rem' }} />
                          Opening Hours
                        </InfoLabel>
                        <InfoValue>{orderData.pickupCenter.openingHours}</InfoValue>
                      </InfoRow>
                    )}
                    {orderData.pickupCenter.instructions && (
                      <InfoRow $fullWidth>
                        <InfoLabel>Pickup Instructions</InfoLabel>
                        <InfoValue style={{ fontSize: '0.875rem', lineHeight: '1.5', color: '#4a5568' }}>
                          {orderData.pickupCenter.instructions}
                        </InfoValue>
                      </InfoRow>
                    )}
                    {orderData.pickupCenter.googleMapLink && (
                      <InfoRow>
                        <InfoLabel>Map</InfoLabel>
                        <InfoValue>
                          <PickupMapLink 
                            href={orderData.pickupCenter.googleMapLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <FaMapMarkerAlt style={{ marginRight: '0.25rem' }} />
                            View on Google Maps
                          </PickupMapLink>
                        </InfoValue>
                      </InfoRow>
                    )}
                  </>
                )}
              </InfoList>
            </SidebarCard>
          )}
        </Sidebar>
      </ContentGrid>

      {/* Update Tracking Modal */}
      {showUpdateModal && orderData && (
        <UpdateTrackingModal
          orderId={orderData._id}
          trackingNumber={trackingNumber}
          currentStatus={orderData.currentStatus}
          onClose={() => {
            setShowUpdateModal(false);
          }}
          mutation={addTrackingUpdateMutation}
        />
      )}
    </PageContainer>
  );
};

export default TrackingPage;

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: #f7fafc;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  color: #4a5568;
  transition: all 0.2s;

  &:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 1024px) {
    order: -1;
  }
`;

const SidebarCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const CardTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 1rem;
`;

const TrackingHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 2rem;
`;

const TrackingNumber = styled.div`
  font-size: 1.25rem;
  color: #4a5568;

  strong {
    color: #2d3748;
    font-weight: 700;
  }
`;

const OrderNumber = styled.div`
  font-size: 1rem;
  color: #718096;

  strong {
    color: #4a5568;
    font-weight: 600;
  }
`;

const EstimatedDeliveryHeader = styled.div`
  font-size: 1rem;
  color: #2d3748;
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f0f9ff;
  border-left: 4px solid #3182ce;
  border-radius: 4px;
  margin-top: 0.5rem;

  strong {
    color: #1e40af;
    font-weight: 700;
    margin-left: 0.25rem;
  }
`;

const CurrentStatus = styled.div`
  margin-bottom: 2rem;
`;

const StatusLabel = styled.div`
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: ${(props) => `${props.$color}15`};
  color: ${(props) => props.$color};
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;

  svg {
    font-size: 1.5rem;
  }
`;

const DeliveryEstimateSection = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const DeliveryEstimateLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  opacity: 0.9;
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DeliveryEstimateValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
`;

const TimelineSection = styled.div`
  margin-bottom: 2rem;
`;

const TimelineTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 1.5rem;
`;

const Timeline = styled.div`
  position: relative;
  padding-left: 2rem;
`;

const TimelineItem = styled.div`
  position: relative;
  padding-bottom: 2rem;
  padding-left: 3rem;

  &:not(:last-child)::before {
    content: "";
    position: absolute;
    left: 0.75rem;
    top: 2.5rem;
    width: 2px;
    height: calc(100% - 1rem);
    background: ${props => {
      if (props.$completed) return '#F7C948';
      if (props.$isActive) return '#2D7FF9';
      return '#E5E7EB';
    }};
  }
`;

const TimelineIcon = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: ${(props) => {
    if (props.$completed) return props.$bgColor || '#F7C948';
    if (props.$isActive) return props.$bgColor || '#2D7FF9';
    return props.$bgColor || '#E5E7EB';
  }};
  color: ${(props) => {
    if (props.$completed || props.$isActive) return "white";
    return "#9CA3AF";
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  z-index: 1;
  border: 2px solid ${(props) => props.$color || '#D1D5DB'};
`;

const TimelineContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TimelineStatus = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${(props) => props.$color || '#1a202c'};
  display: flex;
  align-items: center;
`;

const TimelineMessage = styled.div`
  font-size: 1rem;
  color: #4a5568;
  line-height: 1.5;
`;

const TimelineDate = styled.div`
  font-size: 0.875rem;
  color: #718096;
`;

const TimelineLocation = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #718096;
  margin-top: 0.25rem;

  svg {
    font-size: 0.75rem;
  }
`;

const TimelineLine = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 2.5rem;
  width: 2px;
  height: calc(100% - 1rem);
  background: ${(props) => props.$color || '#E5E7EB'};
  z-index: 0;
`;

const ShippingInfo = styled.div`
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
`;

const InfoTitle = styled.h3`
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 1rem;
`;

const AddressGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const AddressItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  ${props => props.$fullWidth && 'grid-column: 1 / -1;'}
`;

const AddressLabel = styled.div`
  font-size: 0.875rem;
  color: #718096;
  font-weight: 600;
`;

const AddressValue = styled.div`
  font-size: 1rem;
  color: #2d3748;
  font-weight: 500;
`;

const EmptyAddress = styled.div`
  text-align: center;
  padding: 2rem;
  color: #718096;
  font-style: italic;
  background: #f7fafc;
  border-radius: 8px;
`;

const ItemsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ItemCard = styled.li`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
`;

const ItemImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
`;

const ItemInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ItemName = styled.div`
  font-weight: 600;
  color: #1a202c;
`;

const ItemDetails = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #718096;
`;

const ItemQuantity = styled.span``;

const ItemPrice = styled.span`
  font-weight: 600;
  color: #2d3748;
`;

const SummaryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SummaryRow = styled.li`
  display: flex;
  justify-content: space-between;
  padding: ${props => props.$total ? '1rem 0' : '0.5rem 0'};
  border-top: ${props => props.$total ? '2px solid #e2e8f0' : 'none'};
  font-weight: ${props => props.$total ? '700' : '500'};
  font-size: ${props => props.$total ? '1.125rem' : '1rem'};
`;

const SummaryLabel = styled.span`
  color: #4a5568;
`;

const SummaryValue = styled.span`
  color: #1a202c;
`;

const InfoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  ${props => props.$fullWidth && 'grid-column: 1 / -1;'}
`;

const InfoLabel = styled.div`
  font-size: 0.875rem;
  color: #718096;
  font-weight: 600;
  display: flex;
  align-items: center;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  color: #2d3748;
  font-weight: 500;
`;

const PaymentBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${props => props.$paid ? '#d1fae5' : '#fef3c7'};
  color: ${props => props.$paid ? '#065f46' : '#92400e'};
`;

const PickupMapLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: #3182ce;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #2c5aa0;
    text-decoration: underline;
  }

  svg {
    font-size: 0.875rem;
  }
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #e74c3c;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: #718096;
`;

// Update Tracking Modal Component
const UpdateTrackingModal = ({ orderId, trackingNumber, currentStatus, onClose, mutation }) => {
  const [formData, setFormData] = useState({
    status: currentStatus || 'processing',
    message: '',
    location: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.status || !formData.message.trim()) {
      toast.error('Status and message are required');
      return;
    }
    
    mutation.mutate(
      {
        orderId,
        trackingNumber,
        trackingData: {
          status: formData.status,
          message: formData.message.trim(),
          location: formData.location.trim() || '',
        },
      },
      {
        onSuccess: () => {
          toast.success('Tracking update added successfully!');
          onClose();
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || error.message || 'Failed to update tracking');
        },
      }
    );
  };

  const statusOptions = [
    { value: 'payment_completed', label: 'Payment Completed' },
    { value: 'processing', label: 'Processing Order' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing for Dispatch' },
    { value: 'ready_for_dispatch', label: 'Rider Assigned' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Update Tracking Status</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Status *</Label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Message *</Label>
            <TextArea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter tracking update message..."
              rows={4}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>Location (Optional)</Label>
            <Input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter location if applicable..."
            />
          </FormGroup>
          <ButtonGroup>
            <CancelButton type="button" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update Tracking'}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

// Modal Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #f7fafc;
    color: #2d3748;
  }
`;

const Form = styled.form`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  color: #2d3748;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  color: #2d3748;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  color: #2d3748;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #4a5568;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f7fafc;
    border-color: #cbd5e0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #3182ce;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #2c5aa0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UpdateTrackingButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;

  &:hover {
    background: #2c5aa0;
  }

  svg {
    font-size: 0.875rem;
  }
`;

