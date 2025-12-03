// src/components/OrderDetail.js
import { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FaPrint,
  FaPen,
  FaUser,
  FaBox,
  FaCheck,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaCreditCard,
} from "react-icons/fa";
import { useGetOrderById } from '../../shared/hooks/useOrder';
import { useParams, Link } from "react-router-dom";
import { PATHS } from '../../routes/routhPath';
import useDynamicPageTitle from '../../shared/hooks/useDynamicPageTitle';

const OrderDetail = () => {
  const { id: orderId } = useParams();
  const { data: orderData } = useGetOrderById(orderId);
  const [status, setStatus] = useState("pending");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [customerNote, setCustomerNote] = useState(
    "Please leave the package at the front door if I'm not home."
  );
  const [order, setOrder] = useState(null);

  // SEO - Dynamic page title based on order
  useDynamicPageTitle({
    title: "Order Overview",
    dynamicTitle: order && `Order #${order._id?.slice(-8) || order._id} — Admin`,
    description: "Manage and view order details",
    defaultTitle: "Admin Panel",
  });

  console.log("order", order);

  useEffect(() => {
    if (orderData) {
      console.log("orderData", orderData);
      const orderform = orderData?.data?.data?.data;
      console.log("orderform", orderform);
      // Format dates
      const createdAt = new Date(orderform.createdAt);
      const formattedDate = createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = createdAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Map payment method to readable format
      const paymentMethodMap = {
        mobile_money: "Mobile Money",
        credit_card: "Credit Card",
        paypal: "PayPal",
        cash_on_delivery: "Cash on Delivery",
      };

      // Transform order items
      const items = orderform.orderItems.map((item, index) => ({
        id: item._id || `item-${index}`,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
        sku: item.product.defaultSku || "N/A",
      }));

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const shipping = orderform.sellerOrder?.[0]?.shippingCost || 0;
      const tax = orderform.tax || 0;
      const total = subtotal + shipping + tax;

      setOrder({
        id: orderform.id,
        orderNumber: orderform.orderNumber,
        date: formattedDate,
        time: formattedTime,
        status: orderform.orderStatus || orderform.status || 'pending', // Use orderStatus (set to 'confirmed' after payment)
        paymentStatus: orderform.paymentStatus || 'pending', // Include paymentStatus
        paymentMethod:
          paymentMethodMap[orderform.paymentMethod] || orderform.paymentMethod,
        customer: {
          name: orderform.user.name,
          email: orderform.user.email,
          phone: orderform.user.phone,
        },
        shippingAddress: {
          name: orderform.user.name,
          street: orderform.shippingAddress.streetAddress,
          landmark: orderform.shippingAddress.landmark,
          city: orderform.shippingAddress.city,
          region: orderform.shippingAddress.region,
          country: orderform.shippingAddress.country,
          digitalAddress: orderform.shippingAddress.digitalAddress,
        },
        items,
        summary: {
          subtotal,
          shipping,
          tax,
          total,
        },
        timeline: [
          {
            id: 1,
            title: "Order Placed",
            description: "Order confirmed and payment processed",
            date: formattedDate,
            completed: true,
          },
          {
            id: 2,
            title: orderform.orderStatus === "confirmed" ? "Confirmed" : "Processing",
            description: orderform.orderStatus === "confirmed" 
              ? "Order confirmed and payment received" 
              : "Order is being prepared for shipment",
            date: formattedDate,
            completed: orderform.orderStatus !== "pending" && orderform.orderStatus !== "pending_payment",
          },
          {
            id: 3,
            title: "Shipped",
            description: "Order has been shipped",
            date: formattedDate,
            completed:
              orderform.orderStatus === "shipped" ||
              orderform.orderStatus === "delivered",
          },
          {
            id: 4,
            title: "Delivered",
            description: "Package delivered to customer",
            date: formattedDate,
            completed: orderform.orderStatus === "delivered",
          },
        ],
      });

      setStatus(orderform.orderStatus);
    }
  }, [orderData]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    // In a real app, you would update the status on the server here
  };

  const handleNoteEdit = () => {
    setIsEditingNote(!isEditingNote);
  };

  const handleNoteChange = (e) => {
    setCustomerNote(e.target.value);
  };

  const handleSaveNote = () => {
    setIsEditingNote(false);
    // In a real app, you would save the note to the server here
  };

  if (!order) {
    return <LoadingContainer>Loading order details...</LoadingContainer>;
  }

  return (
    <OrderDetailContainer>
      <PageHeader>
        <HeaderInfo>
          <PageTitle>Order #{order.orderNumber}</PageTitle>
          <OrderDate>
            <FaCalendarAlt /> {order.date} at {order.time}
          </OrderDate>
        </HeaderInfo>
        <HeaderActions>
          <ActionButton>
            <FaPrint /> Print
          </ActionButton>
          <PrimaryButton>
            <FaPen /> Edit Order
          </PrimaryButton>
        </HeaderActions>
      </PageHeader>

      <StatusCard>
        <StatusInfo>
          <StatusTitle>Order Status</StatusTitle>
          <StatusBadge status={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </StatusBadge>
          <DeliveryInfo>
            <FaClock /> Last update: {order.date}
          </DeliveryInfo>
        </StatusInfo>
        <StatusActions>
          <StatusButton onClick={() => handleStatusChange("cancelled")}>
            Cancel Order
          </StatusButton>
          <Link to={`/dashboard/${PATHS.ORDER_STATUS.replace(':orderId', orderId)}`}>
            <PrimaryButton>
              Update Status (Full Tracking)
            </PrimaryButton>
          </Link>
        </StatusActions>
      </StatusCard>

      <InfoGrid>
        <CustomerCard>
          <CardTitle>Customer Information</CardTitle>
          <CustomerInfo>
            <CustomerAvatar>
              <FaUser />
            </CustomerAvatar>
            <CustomerDetails>
              <CustomerName>{order.customer.name}</CustomerName>
              <CustomerContact>{order.customer.email}</CustomerContact>
              <CustomerContact>{order.customer.phone}</CustomerContact>
            </CustomerDetails>
          </CustomerInfo>

          <CardTitle>Customer Notes</CardTitle>
          {isEditingNote ? (
            <NoteEditContainer>
              <NoteTextarea value={customerNote} onChange={handleNoteChange} />
              <SaveButton onClick={handleSaveNote}>Save</SaveButton>
            </NoteEditContainer>
          ) : (
            <NoteContainer>
              <NoteText>{customerNote}</NoteText>
              <EditButton onClick={handleNoteEdit}>Edit</EditButton>
            </NoteContainer>
          )}
        </CustomerCard>

        <ShippingBillingCard>
          <GridRow>
            <AddressSection>
              <CardTitle>
                <FaMapMarkerAlt /> Shipping Address
              </CardTitle>
              <AddressText>{order.shippingAddress.name}</AddressText>
              <AddressText>{order.shippingAddress.street}</AddressText>
              <AddressText>{order.shippingAddress.landmark}</AddressText>
              <AddressText>{order.shippingAddress.city}</AddressText>
              <AddressText>{order.shippingAddress.region}</AddressText>
              <AddressText>{order.shippingAddress.country}</AddressText>
              <AddressText>
                Digital Address: {order.shippingAddress.digitalAddress}
              </AddressText>
            </AddressSection>

            <AddressSection>
              <CardTitle>
                <FaCreditCard /> Payment Information
              </CardTitle>
              <PaymentSection>
                <PaymentMethod>{order.paymentMethod}</PaymentMethod>
                <PaymentStatus status={order.paymentStatus || orderData?.data?.data?.paymentStatus || 'pending'}>
                  Payment Status: {order.paymentStatus || orderData?.data?.data?.paymentStatus || 'pending'}
                </PaymentStatus>
                {order.paymentStatus === 'paid' && (
                  <PaymentDate>Paid on {order.date}</PaymentDate>
                )}
              </PaymentSection>
            </AddressSection>
          </GridRow>
        </ShippingBillingCard>
      </InfoGrid>

      <OrderItemsCard>
        <CardTitle>Order Items</CardTitle>
        <ItemsList>
          {order.items.map((item) => (
            <ItemRow key={item.id}>
              <ItemImage>
                <FaBox />
              </ItemImage>
              <ItemDetails>
                <ItemName>{item.name}</ItemName>
                <ItemSku>SKU: {item.sku}</ItemSku>
              </ItemDetails>
              <ItemPricing>
                <ItemPrice>₵{item.price.toFixed(2)}</ItemPrice>
                <ItemQuantity>Qty: {item.quantity}</ItemQuantity>
                <ItemTotal>₵{item.total.toFixed(2)}</ItemTotal>
              </ItemPricing>
            </ItemRow>
          ))}
        </ItemsList>
      </OrderItemsCard>

      <SummaryGrid>
        <SummaryCard>
          <CardTitle>Order Summary</CardTitle>
          <SummaryRow>
            <SummaryLabel>Subtotal</SummaryLabel>
            <SummaryValue>₵{order.summary.subtotal.toFixed(2)}</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Shipping</SummaryLabel>
            <SummaryValue>₵{order.summary.shipping.toFixed(2)}</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Tax</SummaryLabel>
            <SummaryValue>₵{order.summary.tax.toFixed(2)}</SummaryValue>
          </SummaryRow>
          <TotalRow>
            <TotalLabel>Total</TotalLabel>
            <TotalValue>₵{order.summary.total.toFixed(2)}</TotalValue>
          </TotalRow>
        </SummaryCard>

        <TimelineCard>
          <CardTitle>Order Timeline</CardTitle>
          <TimelineContainer>
            {order.timeline.map((event) => (
              <TimelineItem key={event.id}>
                <TimelineDot completed={event.completed}>
                  {event.completed ? <FaCheck /> : null}
                </TimelineDot>
                <TimelineContent>
                  <TimelineHeader>
                    <TimelineTitle>{event.title}</TimelineTitle>
                    <TimelineDate>
                      <FaCalendarAlt /> {event.date}
                    </TimelineDate>
                  </TimelineHeader>
                  <TimelineDescription>{event.description}</TimelineDescription>
                </TimelineContent>
              </TimelineItem>
            ))}
          </TimelineContainer>
        </TimelineCard>
      </SummaryGrid>
    </OrderDetailContainer>
  );
};

// Styled Components
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  color: #4f46e5;
`;

const OrderDetailContainer = styled.div`
  padding: 2rem;
  background-color: #f8fafc;
  max-width: 1400px;
  margin: 0 auto;
  font-family: var(--font-body);
`;

const PageHeader = styled.div`
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  background-color: #f8fafc;
`;

const HeaderInfo = styled.div`
  flex: 1;
  min-width: 300px;
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.5rem;
`;

const OrderDate = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 1rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  color: #334155;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;

  &:hover {
    background-color: #f8fafc;
    border-color: #94a3b8;
  }
`;

const PrimaryButton = styled(ActionButton)`
  background-color: #4f46e5;
  border-color: #4f46e5;
  color: white;

  &:hover {
    background-color: #4338ca;
    border-color: #4338ca;
  }
`;

const StatusCard = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatusInfo = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const StatusTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
`;

const StatusBadge = styled.span`
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 600;

  background-color: ${(props) =>
    props.status === "processing"
      ? "#fef9c3"
      : props.status === "shipped"
      ? "#dbeafe"
      : props.status === "delivered"
      ? "#dcfce7"
      : props.status === "cancelled"
      ? "#fee2e2"
      : "#e0f2fe"};

  color: ${(props) =>
    props.status === "processing"
      ? "#ca8a04"
      : props.status === "shipped"
      ? "#2563eb"
      : props.status === "delivered"
      ? "#16a34a"
      : props.status === "cancelled"
      ? "#dc2626"
      : "#0ea5e9"};
`;

const DeliveryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.95rem;
`;

const StatusActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const StatusButton = styled(ActionButton)`
  &:hover {
    background-color: #fee2e2;
    color: #dc2626;
    border-color: #fee2e2;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
`;

const CustomerCard = styled(Card)`
  display: flex;
  flex-direction: column;
`;

const ShippingBillingCard = styled(Card)``;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CustomerInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const CustomerAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
`;

const CustomerDetails = styled.div`
  margin-left: 1rem;
`;

const CustomerName = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const CustomerContact = styled.p`
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.4;
`;

const NoteContainer = styled.div`
  position: relative;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  font-style: italic;
  color: #475569;
  border-left: 3px solid #cbd5e1;
`;

const NoteText = styled.p`
  margin: 0;
`;

const EditButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: #4f46e5;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const NoteEditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const NoteTextarea = styled.textarea`
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: #94a3b8;
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.2);
  }
`;

const SaveButton = styled.button`
  align-self: flex-end;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.6rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4338ca;
  }
`;

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AddressSection = styled.div`
  &:first-child {
    border-right: 1px solid #e2e8f0;
    padding-right: 1.5rem;

    @media (max-width: 768px) {
      border-right: none;
      border-bottom: 1px solid #e2e8f0;
      padding-right: 0;
      padding-bottom: 1.5rem;
    }
  }
`;

const AddressText = styled.p`
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0.25rem 0;
`;

const PaymentSection = styled.div`
  margin-top: 1.5rem;
`;

const PaymentMethod = styled.div`
  color: #475569;
  font-weight: 500;
  margin-top: 0.5rem;
  font-size: 1.1rem;
`;

const PaymentStatus = styled.div`
  padding: 0.3rem 0.8rem;
  border-radius: 0.5rem;
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  background-color: ${(props) =>
    props.status === "completed"
      ? "#dcfce7"
      : props.status === "failed"
      ? "#fee2e2"
      : "#e0f2fe"};
  color: ${(props) =>
    props.status === "completed"
      ? "#166534"
      : props.status === "failed"
      ? "#b91c1c"
      : "#075985"};
`;

const PaymentDate = styled.p`
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const OrderItemsCard = styled(Card)`
  margin-bottom: 1.5rem;
`;

const ItemsList = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
`;

const ItemRow = styled.div`
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8fafc;
  }
`;

const ItemImage = styled.div`
  width: 64px;
  height: 64px;
  background-color: #f1f5f9;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 1.5rem;
`;

const ItemDetails = styled.div`
  flex: 1;
  margin-left: 1rem;
`;

const ItemName = styled.h4`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const ItemSku = styled.p`
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const ItemPricing = styled.div`
  text-align: right;
  min-width: 120px;
`;

const ItemPrice = styled.p`
  color: #1e293b;
  margin: 0;
`;

const ItemQuantity = styled.p`
  color: #64748b;
  font-size: 0.9rem;
  margin: 0.25rem 0;
`;

const ItemTotal = styled.p`
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled(Card)``;

const TimelineCard = styled(Card)``;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px dashed #e2e8f0;
`;

const SummaryLabel = styled.span`
  color: #64748b;
`;

const SummaryValue = styled.span`
  color: #1e293b;
  font-weight: 500;
`;

const TotalRow = styled(SummaryRow)`
  border-bottom: none;
  border-top: 1px solid #e2e8f0;
  margin-top: 0.5rem;
  padding-top: 1rem;
  padding-bottom: 0;
`;

const TotalLabel = styled(SummaryLabel)`
  font-weight: 600;
  font-size: 1.1rem;
  color: #1e293b;
`;

const TotalValue = styled(SummaryValue)`
  font-weight: 700;
  font-size: 1.25rem;
  color: #1e293b;
`;

const TimelineContainer = styled.div`
  position: relative;
  padding-left: 1.5rem;

  &:before {
    content: "";
    position: absolute;
    left: 7px;
    top: 0;
    height: 100%;
    width: 2px;
    background-color: #e2e8f0;
  }
`;

const TimelineItem = styled.div`
  position: relative;
  padding-bottom: 1.5rem;

  &:last-child {
    padding-bottom: 0;
  }
`;

const TimelineDot = styled.div`
  position: absolute;
  left: -1.5rem;
  top: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  background-color: ${(props) => (props.completed ? "#4f46e5" : "#e2e8f0")};
  color: ${(props) => (props.completed ? "white" : "transparent")};

  svg {
    font-size: 0.75rem;
  }
`;

const TimelineContent = styled.div`
  background-color: white;
  border-radius: 0.5rem;
`;

const TimelineHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const TimelineTitle = styled.h4`
  font-weight: 600;
  color: #1e293b;
`;

const TimelineDate = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
`;

const TimelineDescription = styled.p`
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;
`;

export default OrderDetail;
