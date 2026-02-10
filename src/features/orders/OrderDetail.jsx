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
  FaMoneyBillWave,
  FaCheckCircle,
  FaSpinner,
  FaStore,
  FaEnvelope,
} from "react-icons/fa";
import { useGetOrderById, useConfirmPayment } from '../../shared/hooks/useOrder';
import { useUpdateOrderStatus } from '../../shared/hooks/useUpdateOrderStatus';
import { useParams, Link } from "react-router-dom";
import { PATHS } from '../../routes/routhPath';
import useDynamicPageTitle from '../../shared/hooks/useDynamicPageTitle';
import { toast } from 'react-toastify';
import { useQueryClient, useQueries } from '@tanstack/react-query';
import { orderService } from '../../shared/services/orderApi';
import adminSellerApi from '../../shared/services/adminSellerApi';

// Platform store ID – display "EazShop Store" when seller details are not available
const EAZSHOP_STORE_ID = '6970b22eaba06cadfd4b8035';

const OrderDetail = () => {
  const { id: orderId } = useParams();
  const { data: orderData, refetch: refetchOrder } = useGetOrderById(orderId);
  console.log("[OrderDetail] Order data:", orderData);
  const queryClient = useQueryClient();
  const confirmPaymentMutation = useConfirmPayment();
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const [status, setStatus] = useState("pending");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [customerNote, setCustomerNote] = useState(
    "Please leave the package at the front door if I'm not home."
  );
  const [order, setOrder] = useState(null);

  // Seller IDs from the fetched order – use sellerId (actual seller), not id (SellerOrder id).
  // Exclude EazShop store ID so we don't fetch it (display "EazShop Store" instead).
  const sellerIdsToFetch = order?.sellers?.length
    ? [...new Set(
        order.sellers
          .filter((s) => s.sellerId && String(s.sellerId) !== EAZSHOP_STORE_ID)
          .map((s) => String(s.sellerId))
      )]
    : [];  

  const sellerQueries = useQueries({
    queries: sellerIdsToFetch.map((sellerId) => ({
      queryKey: ['seller', sellerId],
      queryFn: async () => {
        try {
          const res = await adminSellerApi.getSellerDetails(sellerId);
          const data = res?.data?.data ?? res?.data ?? res;
          return data?.data ?? data ?? null;
        } catch (err) {
          if (err?.response?.status === 404) {
            console.warn(`[OrderDetail] Seller not found (may be inactive): ${sellerId}`, err?.response?.data?.message);
            return null;
          }
          throw err;
        }
      },
      enabled: !!sellerId,
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });

  const sellerById = sellerIdsToFetch.length
    ? sellerIdsToFetch.reduce((acc, id, i) => {
        const result = sellerQueries[i]?.data;
        if (result) acc[id] = result;
        return acc;
      }, {})
    : {};

  // SEO - Dynamic page title based on order
  useDynamicPageTitle({
    title: "Order Overview",
    dynamicTitle: order && `Order #${order.orderNumber ?? "—"} — Admin`,
    description: "Manage and view order details",
    defaultTitle: "Admin Panel",
  });

  useEffect(() => {
    if (orderData) {
      // Support multiple API response shapes: { data: { data: doc } }, { data: { order: doc } }, { data: doc }
      // Axios response: orderData.data = body; handleFactory returns { status, data: { data: doc } }
      const body = orderData?.data ?? null;
      const inner = body?.data ?? body ?? null;
      const rawOrder = inner?.data ?? inner?.order ?? inner ?? null;
      if (!rawOrder || typeof rawOrder.orderNumber === "undefined") {
        return;
      }
      // sellerOrder: from fetched order doc (rawOrder) — seller IDs come from here
      const sellerOrderList = Array.isArray(rawOrder.sellerOrder)
        ? rawOrder.sellerOrder
        : Array.isArray(inner?.sellerOrder)
          ? inner.sellerOrder
          : Array.isArray(body?.sellerOrder)
            ? body.sellerOrder
            : [];
      // Format dates (use rawOrder as source of truth)
      const createdAt = new Date((rawOrder.createdAt ?? orderform?.createdAt));
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
        bank_transfer: "Bank Transfer",
        payment_on_delivery: "Cash on Delivery",
        paystack: "Paystack",
        credit_balance: "Credit Balance",
      };

      // Transform order items – use product ref when present, fallback to snapshot fields
      const items = (rawOrder.orderItems || orderform?.orderItems || []).map((item, index) => {
        const name = item.product?.name ?? item.productName ?? "Product";
        const price = item.price ?? item.product?.price ?? 0;
        const sku = item.sku ?? item.product?.defaultSku ?? "N/A";
        const image = item.productImage ?? item.product?.imageCover ?? null;
        const description = item.product?.description ?? null;
        const variantName = item.variantName ?? null;
        const variantAttributes = item.variantAttributes ?? [];
        return {
          id: item._id || `item-${index}`,
          name,
          price,
          quantity: item.quantity,
          total: price * item.quantity,
          sku,
          image,
          description,
          variantName,
          variantAttributes,
        };
      });

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const shipping = (sellerOrderList?.[0]?.shippingCost ?? rawOrder.sellerOrder?.[0]?.shippingCost ?? orderform?.sellerOrder?.[0]?.shippingCost) || 0;
      const tax = (rawOrder.tax ?? orderform?.tax) || 0;
      const total = subtotal + shipping + tax;

      const currentStatus = (rawOrder.currentStatus || rawOrder.orderStatus || rawOrder.status || "").toString().toLowerCase();
      const isDelivered = currentStatus === "delivered" || currentStatus === "delievered" || rawOrder.status === "completed";

      const trackingNumber =
        rawOrder.trackingNumber ?? orderform?.trackingNumber ?? null;

      // Backend uses both 'paid' and 'completed' for payment status (e.g. Paystack webhook sets 'completed')
      const rawPaymentStatus = (rawOrder.paymentStatus || "pending").toString().toLowerCase();
      const isPaid = rawPaymentStatus === "paid" || rawPaymentStatus === "completed";
      const paidAtDate = rawOrder.paidAt ? new Date(rawOrder.paidAt) : null;
      const paidAtFormatted = paidAtDate
        ? paidAtDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : null;

      // Display status: if paid but backend still says pending_payment/pending, show "confirmed" so Order Status matches Payment Status
      const rawOrderStatus = (rawOrder.currentStatus || rawOrder.orderStatus || rawOrder.status || "pending").toString().toLowerCase();
      const isPendingStatus = rawOrderStatus === "pending" || rawOrderStatus === "pending_payment";
      const displayStatus = isDelivered
        ? "delivered"
        : isPaid && isPendingStatus
          ? "confirmed"
          : rawOrder.orderStatus || rawOrder.status || rawOrder.currentStatus || "pending";

      setOrder({
        id: rawOrder._id ?? orderform?.id,
        orderNumber: rawOrder.orderNumber ?? orderform?.orderNumber,
        trackingNumber: trackingNumber && String(trackingNumber).trim() ? String(trackingNumber).trim() : null,
        date: formattedDate,
        time: formattedTime,
        status: displayStatus,
        paymentStatus: rawOrder.paymentStatus || 'pending',
        isPaid,
        paidAtFormatted: paidAtFormatted || formattedDate,
        paymentMethod:
          paymentMethodMap[rawOrder.paymentMethod] ?? rawOrder.paymentMethod,
        rawPaymentMethod: rawOrder.paymentMethod,
        customer: {
          name: rawOrder.user?.name ?? "—",
          email: rawOrder.user?.email ?? "—",
          phone: rawOrder.user?.phone ?? "—",
        },
        shippingAddress: {
          name: rawOrder.user?.name ?? "—",
          street: rawOrder.shippingAddress?.streetAddress ?? "—",
          landmark: rawOrder.shippingAddress?.landmark ?? "—",
          city: rawOrder.shippingAddress?.city ?? "—",
          region: rawOrder.shippingAddress?.region ?? "—",
          country: rawOrder.shippingAddress?.country ?? "—",
          digitalAddress: rawOrder.shippingAddress?.digitalAddress ?? "—",
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
            title: rawOrder.orderStatus === "confirmed" ? "Confirmed" : "Processing",
            description: isPaid ? "Order confirmed and payment received" : (rawOrder.orderStatus === "confirmed"
              ? "Order confirmed and payment received"
              : "Order is being prepared for shipment"),
            date: formattedDate,
            completed: isPaid || (rawOrder.orderStatus !== "pending" && rawOrder.orderStatus !== "pending_payment"),
          },
          {
            id: 3,
            title: "Shipped",
            description: "Order has been shipped",
            date: formattedDate,
            completed:
              currentStatus === "shipped" ||
              currentStatus === "out_for_delivery" ||
              isDelivered,
          },
          {
            id: 4,
            title: "Delivered",
            description: "Package delivered to customer",
            date: formattedDate,
            completed: isDelivered,
          },
        ],
        // Seller IDs from the fetched order: look for id in sellerOrder[].sellerId, .seller.id, .seller._id, or .seller (ref)
        sellers: (sellerOrderList || []).map((so) => {
          const rawSellerRef = so.seller;
          const isPopulatedSeller = rawSellerRef && typeof rawSellerRef === "object" && rawSellerRef !== null && (rawSellerRef.name != null || rawSellerRef.email != null || rawSellerRef.shopName != null);
          const sellerObj = isPopulatedSeller ? rawSellerRef : null;
          const sellerIdFromOrder =
            so.sellerId != null ? so.sellerId
            : sellerObj?.id ?? sellerObj?._id
            ?? (rawSellerRef != null ? (typeof rawSellerRef === "string" ? rawSellerRef : rawSellerRef.id ?? rawSellerRef.toString?.()) : null)
            ?? null;
          const sellerId = sellerIdFromOrder != null ? String(sellerIdFromOrder) : null;
          const sellerEmail = sellerObj?.email ?? "—";
          return {
            id: so._id,
            name: sellerObj?.name ?? "—",
            shopName: sellerObj?.shopName ?? "—",
            email: sellerEmail,
            sellerId,
            subtotal: so.subtotal ?? 0,
            total: so.total ?? 0,
            shippingCost: so.shippingCost ?? 0,
            totalBasePrice: so.totalBasePrice ?? 0,
            status: so.status ?? "pending",
            payoutStatus: so.payoutStatus ?? so.sellerPayoutStatus ?? "pending",
          };
        }),
        sellerEmails: (sellerOrderList || [])
          .map((so) => {
            const sellerObj = so.seller && typeof so.seller === "object" && so.seller !== null ? so.seller : null;
            return sellerObj?.email;
          })
          .filter(Boolean),
      });

      console.log("[OrderDetail] Raw API response:", orderData);
      console.log("[OrderDetail] Extracted order document (rawOrder):", rawOrder);
      console.log("[OrderDetail] Formatted order summary:", {
        id: rawOrder._id ?? rawOrder.id,
        orderNumber: rawOrder.orderNumber,
        customer: { name: rawOrder.user?.name ?? "—", email: rawOrder.user?.email ?? "—", phone: rawOrder.user?.phone ?? "—" },
        shippingAddress: rawOrder.shippingAddress,
        itemsCount: items.length,
        summary: { subtotal, shipping, tax, total },
        status: rawOrder.orderStatus ?? rawOrder.status,
        paymentStatus: rawOrder.paymentStatus,
        sellersCount: (sellerOrderList || []).length,
      });

      setStatus(displayStatus);
    }
  }, [orderData]);

  useEffect(() => {
    if (order) {
      console.log("[OrderDetail] Order:", order);
    }
  }, [order]);

  // Log each seller's information (e.g. for orders with 2 sellers)
  useEffect(() => {
    if (!order?.sellers?.length) return;
    const sellersInfo = order.sellers.map((s, index) => {
      const fetched = s.sellerId ? sellerById[String(s.sellerId)] : null;
      return {
        index: index + 1,
        sellerId: s.sellerId,
        name: fetched?.name ?? s.name,
        shopName: fetched?.shopName ?? s.shopName,
        email: fetched?.email ?? s.email,
        subtotal: s.subtotal,
        total: s.total,
        shippingCost: s.shippingCost,
        status: s.status,
        payoutStatus: s.payoutStatus,
        fromFetch: !!fetched,
      };
    });
    console.log(`[OrderDetail] Sellers (${sellersInfo.length}):`, sellersInfo);
    sellersInfo.forEach((info, i) => {
      console.log(`[OrderDetail] Seller ${i + 1}:`, info);
    });
  }, [order?.sellers, sellerById]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId,
        status: newStatus,
        message: `Order status changed to ${newStatus} by admin`,
      });
      setStatus(newStatus);
      toast.success('Order status updated successfully');
      await refetchOrder();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleNoteEdit = () => {
    setIsEditingNote(!isEditingNote);
  };

  const handleNoteChange = (e) => {
    setCustomerNote(e.target.value);
  };

  const handleSaveNote = async () => {
    try {
      await orderService.updateOrder(orderId, {
        adminNotes: customerNote,
      });
      setIsEditingNote(false);
      toast.success('Customer note saved successfully');
      await refetchOrder();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(error.response?.data?.message || 'Failed to save note');
    }
  };

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    if (!orderId) {
      toast.error('Order ID is missing');
      return;
    }

    // Get current payment status and method from order or orderData
    const rawPs = (order?.paymentStatus || orderData?.data?.data?.paymentStatus || 'pending').toString().toLowerCase();
    const currentPaymentMethod = order?.rawPaymentMethod || orderData?.data?.data?.paymentMethod;

    // Double-check conditions (treat both 'paid' and 'completed' as already paid)
    if (rawPs === 'paid' || rawPs === 'completed') {
      toast.error('Payment has already been confirmed');
      return;
    }

    if (!['bank_transfer', 'payment_on_delivery'].includes(currentPaymentMethod)) {
      toast.error('Manual payment confirmation is only available for bank transfer and cash on delivery');
      return;
    }

    // Show confirmation dialog
    const confirmMessage = currentPaymentMethod === 'bank_transfer'
      ? 'Confirm bank transfer payment for this order?'
      : 'Mark cash on delivery payment as received?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await confirmPaymentMutation.mutateAsync(orderId);
      toast.success(
        currentPaymentMethod === 'bank_transfer'
          ? 'Bank transfer payment confirmed successfully!'
          : 'Cash on delivery payment confirmed successfully!'
      );
      
      // Refetch order data to update UI
      await refetchOrder();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to confirm payment';
      toast.error(errorMessage);
      console.error('Error confirming payment:', error);
    }
  };

  if (!order || order.orderNumber == null) {
    return <LoadingContainer>Loading order details...</LoadingContainer>;
  }

  return (
    <OrderDetailContainer>
      <PageHeader>
        <HeaderInfo>
          <PageTitle>Order #{order.orderNumber ?? "—"}</PageTitle>
          <OrderDate>
            <FaCalendarAlt /> {order.date} at {order.time}
          </OrderDate>
          <TrackingNumberRow>
            <strong>Tracking:</strong>{" "}
            {order.trackingNumber ? (
              <Link to={`/dashboard/tracking/${order.trackingNumber}`} style={{ marginLeft: "0.25rem", color: "var(--color-primary-600)", fontWeight: 600 }}>
                {order.trackingNumber}
              </Link>
            ) : (
              <span style={{ marginLeft: "0.25rem", color: "var(--color-neutral-500)" }}>—</span>
            )}
          </TrackingNumberRow>
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
                <PaymentStatus status={order.isPaid ? 'paid' : (order.paymentStatus || orderData?.data?.data?.paymentStatus || 'pending')}>
                  Payment Status: {order.isPaid ? 'Paid' : (order.paymentStatus || orderData?.data?.data?.paymentStatus || 'pending')}
                </PaymentStatus>
                {order.isPaid && (
                  <PaymentDate>Paid on {order.paidAtFormatted ?? order.date}</PaymentDate>
                )}
                
                {/* Payment Confirmation Button */}
                {(() => {
                  const orderform = orderData?.data?.data?.data || orderData?.data?.data;
                  const rawPs = (order?.paymentStatus || orderform?.paymentStatus || 'pending').toString().toLowerCase();
                  const currentPaymentStatus = rawPs; // keep raw for button logic
                  const currentPaymentMethod = order?.rawPaymentMethod || orderform?.paymentMethod;
                  const currentStatus = orderform?.currentStatus || orderform?.orderStatus || orderform?.status || 'pending';
                  
                  // Show button only if payment is truly pending (not paid or completed)
                  const paymentIsPending = currentPaymentStatus !== 'paid' && currentPaymentStatus !== 'completed';
                  const isDelivered = currentStatus === 'delivered' || currentStatus === 'delievered'; // Note: typo in backend enum
                  
                  const shouldShowButton = 
                    paymentIsPending &&
                    (currentPaymentMethod === 'bank_transfer' || currentPaymentMethod === 'payment_on_delivery') &&
                    isDelivered;
                  
                  if (!shouldShowButton) {
                    return null;
                  }
                  
                  const buttonText = currentPaymentMethod === 'bank_transfer'
                    ? 'Confirm Bank Payment'
                    : 'Mark Cash Received';
                  
                  const buttonIcon = currentPaymentMethod === 'bank_transfer'
                    ? <FaMoneyBillWave />
                    : <FaCheckCircle />;
                  
                  return (
                    <ConfirmPaymentButton
                      onClick={handleConfirmPayment}
                      disabled={confirmPaymentMutation.isPending}
                    >
                      {confirmPaymentMutation.isPending ? (
                        <>
                          <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Processing...
                        </>
                      ) : (
                        <>
                          {buttonIcon} {buttonText}
                        </>
                      )}
                    </ConfirmPaymentButton>
                  );
                })()}
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
                {item.image ? (
                  <ProductThumb src={item.image} alt={item.name} />
                ) : (
                  <FaBox />
                )}
              </ItemImage>
              <ItemDetails>
                <ItemName>{item.name}</ItemName>
                {item.variantName && (
                  <ItemVariant>Variant: {item.variantName}</ItemVariant>
                )}
                {item.variantAttributes?.length > 0 && (
                  <ItemVariant>
                    {item.variantAttributes.map((a) => `${a.key}: ${a.value}`).join(" · ")}
                  </ItemVariant>
                )}
                <ItemSku>SKU: {item.sku}</ItemSku>
                {item.description && (
                  <ItemDescription title={item.description}>
                    {item.description.length > 120
                      ? `${item.description.slice(0, 120)}…`
                      : item.description}
                  </ItemDescription>
                )}
              </ItemDetails>
              <ItemPricing>
                <ItemPrice>₵{(item.price ?? 0).toFixed(2)}</ItemPrice>
                <ItemQuantity>Qty: {item.quantity}</ItemQuantity>
                <ItemTotal>₵{(item.total ?? 0).toFixed(2)}</ItemTotal>
              </ItemPricing>
            </ItemRow>
          ))}
        </ItemsList>
      </OrderItemsCard>

      <OrderItemsCard>
        <CardTitle>
          <FaStore style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
          Sellers in this order
        </CardTitle>
        {order.sellers && order.sellers.length > 0 ? (
          <SellersList>
            {order.sellers.map((seller) => {
              const sellerIdStr = seller.sellerId ? String(seller.sellerId) : null;
              const isEazShopStore = sellerIdStr === EAZSHOP_STORE_ID;
              const fetched = sellerIdStr ? sellerById[sellerIdStr] : null;
              const queryIndex = sellerIdStr ? sellerIdsToFetch.indexOf(sellerIdStr) : -1;
              const isLoadingSeller = queryIndex >= 0 && sellerQueries[queryIndex]?.isLoading;
              const name = isEazShopStore ? "EazShop Store" : (fetched?.name ?? seller.name ?? "—");
              const shopName = isEazShopStore ? "EazShop Store" : (fetched?.shopName ?? seller.shopName ?? "—");
              const email = isEazShopStore ? "Platform store" : (fetched?.email ?? seller.email ?? "—");
              const isInactive = fetched && (fetched.active === false || fetched.status !== "active");
              const fetchFailed = sellerIdStr && !isEazShopStore && !fetched && !isLoadingSeller;
              return (
                <SellerRow key={seller.id}>
                  <SellerInfo>
                    <SellerShopName>
                      <strong>Shop name:</strong> {shopName && shopName !== "—" ? shopName : "—"}
                    </SellerShopName>
                    <SellerName>
                      {shopName && shopName !== "—" ? shopName : name && name !== "—" ? name : "Seller"}
                    </SellerName>
                    {shopName !== "—" && name !== "—" && name && (
                      <SellerContact>{name}</SellerContact>
                    )}
                    <SellerContact>
                      <FaEnvelope style={{ marginRight: "0.25rem" }} />
                      {email && email !== "—" ? email : "—"}
                    </SellerContact>
                    {isLoadingSeller && !isEazShopStore && (
                      <SellerContact style={{ fontStyle: "italic", color: "#6b7280" }}>
                        <FaSpinner style={{ marginRight: "0.25rem" }} />
                        Loading seller…
                      </SellerContact>
                    )}
                    {fetchFailed && (
                      <SellerContact style={{ fontStyle: "italic", color: "#6b7280" }}>
                        Seller details unavailable (seller may be deactivated). Reactivate from Sellers to view.
                      </SellerContact>
                    )}
                    {isInactive && fetched && (
                      <SellerContact style={{ fontStyle: "italic", color: "#b45309" }}>
                        Account or status not active — set to active in Seller detail to enable full access.
                      </SellerContact>
                    )}
                    {sellerIdStr && !isEazShopStore && (
                      <SellerContact style={{ marginTop: "0.25rem" }}>
                        <Link
                          to={`/dashboard/${PATHS.SELLERDETAIL.replace(":id", sellerIdStr)}`}
                          style={{ color: "#4361ee", fontSize: "0.875rem" }}
                        >
                          View seller →
                        </Link>
                      </SellerContact>
                    )}
                  </SellerInfo>
                  <SellerAmounts>
                    <SellerAmountRow>
                      <span>Subtotal</span>
                      <span>₵{(seller.subtotal ?? 0).toFixed(2)}</span>
                    </SellerAmountRow>
                    {seller.shippingCost > 0 && (
                      <SellerAmountRow>
                        <span>Shipping</span>
                        <span>₵{(seller.shippingCost ?? 0).toFixed(2)}</span>
                      </SellerAmountRow>
                    )}
                    <SellerAmountRow>
                      <span>Total</span>
                      <span>₵{(seller.total ?? 0).toFixed(2)}</span>
                    </SellerAmountRow>
                    <SellerBadges>
                      <StatusBadge status={seller.status}>
                        {String(seller.status).charAt(0).toUpperCase() + String(seller.status).slice(1)}
                      </StatusBadge>
                      <PayoutBadge $status={seller.payoutStatus}>
                        Payout: {String(seller.payoutStatus).charAt(0).toUpperCase() + String(seller.payoutStatus).slice(1)}
                      </PayoutBadge>
                    </SellerBadges>
                  </SellerAmounts>
                </SellerRow>
              );
            })}
          </SellersList>
        ) : (
          <SellerEmptyState>No seller data for this order.</SellerEmptyState>
        )}
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

const TrackingNumberRow = styled.p`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
  font-size: 0.95rem;
  margin-top: 0.25rem;
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
    props.status === "paid" || props.status === "completed"
      ? "#dcfce7"
      : props.status === "failed"
      ? "#fee2e2"
      : "#e0f2fe"};
  color: ${(props) =>
    props.status === "paid" || props.status === "completed"
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

const ConfirmPaymentButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #059669;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
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

const ItemVariant = styled.p`
  color: #475569;
  font-size: 0.875rem;
  margin: 0.125rem 0;
`;

const ItemDescription = styled.p`
  color: #64748b;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  line-height: 1.4;
  max-width: 100%;
`;

const ProductThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
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

const SellerEmptyState = styled.p`
  padding: 1rem;
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
`;

const SellersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SellerRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
`;

const SellerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SellerShopName = styled.div`
  font-size: 0.9rem;
  color: #475569;
  margin-bottom: 0.25rem;
  strong {
    color: #1e293b;
  }
`;

const SellerName = styled.div`
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
`;

const SellerContact = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  display: flex;
  align-items: center;
`;

const SellerAmounts = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SellerAmountRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
  color: #475569;
`;

const SellerBadges = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
  flex-wrap: wrap;
`;

const PayoutBadge = styled.span`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: ${(p) => (p.$status === "paid" ? "#dcfce7" : p.$status === "pending" ? "#fef3c7" : "#e2e8f0")};
  color: ${(p) => (p.$status === "paid" ? "#166534" : p.$status === "pending" ? "#92400e" : "#475569")};
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
