import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { FaEye, FaExclamationCircle, FaShoppingCart } from "react-icons/fa";
import { useEazShop } from "../../shared/hooks/useEazShop";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import { formatDate } from "../../shared/utils/helpers";
import { PATHS } from "../../routes/routhPath";

const DASHBOARD_BASE = "/dashboard";

function getOrderDisplay(sellerOrder) {
  const order = sellerOrder?.order;
  if (!order) return null;
  return {
    _id: order._id ?? order.id,
    orderNumber: order.orderNumber ?? order._id ?? "—",
    customer:
      order.user?.name ??
      order.user?.email ??
      order.shippingAddress?.fullName ??
      order.shippingAddress?.name ??
      "—",
    date: order.createdAt,
    total: order.totalPrice ?? order.total ?? sellerOrder.subtotal ?? 0,
    status: order.currentStatus ?? order.orderStatus ?? order.status ?? "—",
  };
}

function getStatusColor(status) {
  const s = String(status || "").toLowerCase();
  if (["delivered", "completed"].includes(s)) return "#2ecc71";
  if (["shipped", "out_for_delivery"].includes(s)) return "#9b59b6";
  if (["processing", "confirmed", "preparing"].includes(s)) return "#3498db";
  if (["pending", "pending_payment"].includes(s)) return "#f39c12";
  if (["cancelled"].includes(s)) return "#e74c3c";
  return "#7f8c8d";
}

export default function EazShopOrdersPage() {
  const navigate = useNavigate();
  const { useGetEazShopOrders } = useEazShop();
  const { data: ordersList, isLoading, error } = useGetEazShopOrders();

  const orders = Array.isArray(ordersList) ? ordersList : [];

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <ErrorContainer>
        <FaExclamationCircle size={48} color="#e74c3c" />
        <h3>Failed to load EazShop orders</h3>
        <p>{error.message || "Please try again later."}</p>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaShoppingCart /> EazShop Orders
        </Title>
        <Description>Orders for the company store (EazShop)</Description>
      </Header>

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Order #</Th>
              <Th>Customer</Th>
              <Th>Date</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((sellerOrder) => {
                const row = getOrderDisplay(sellerOrder);
                if (!row) return null;
                return (
                  <tr key={sellerOrder._id || row._id}>
                    <Td>{row.orderNumber}</Td>
                    <Td>{row.customer}</Td>
                    <Td>{formatDate(row.date)}</Td>
                    <Td>Gh₵{(row.total || 0).toFixed(2)}</Td>
                    <Td>
                      <StatusBadge $color={getStatusColor(row.status)}>
                        {String(row.status).replace(/_/g, " ")}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <ViewButton
                        onClick={() =>
                          navigate(
                            `${DASHBOARD_BASE}/${PATHS.ORDERS}/detail/${row._id}`
                          )
                        }
                        title="View order"
                      >
                        <FaEye /> View
                      </ViewButton>
                    </Td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <Td colSpan={6}>
                  <EmptyState>
                    <FaShoppingCart size={40} />
                    <p>No EazShop orders yet.</p>
                  </EmptyState>
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableWrapper>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Header = styled.div``;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-grey-900, #111);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: var(--color-grey-600, #4b5563);
  margin: 0.25rem 0 0 0;
`;

const TableWrapper = styled.div`
  background: white;
  border: 1px solid var(--color-grey-200, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-grey-600, #4b5563);
  background: var(--color-grey-50, #f9fafb);
`;

const Td = styled.td`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-top: 1px solid var(--color-grey-200, #e5e7eb);
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${(p) => p.$color}22;
  color: ${(p) => p.$color};
`;

const ViewButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-primary, #2563eb);
  background: transparent;
  border: 1px solid var(--color-primary, #2563eb);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: var(--color-primary, #2563eb);
    color: white;
  }
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--color-grey-700, #374151);

  h3 {
    margin: 1rem 0 0.5rem 0;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: var(--color-grey-500, #6b7280);

  p {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
  }
`;
