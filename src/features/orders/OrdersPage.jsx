import styled from "styled-components";
import { useGetAllOrders } from '../../shared/hooks/useOrder';
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from '../../shared/utils/helpers';
import { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaEdit,
  FaExclamationCircle,
  FaEye,
  FaSearch,
  FaShoppingBag,
  FaTimesCircle,
  FaTruck,
  FaAngleLeft,
  FaAngleRight,
} from "react-icons/fa";

export default function OrdersPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Hook with pagination and filtering parameters
  // const { getAllOrders } = useOrder();
  const { data: ordersData, isLoading, error, refetch } = useGetAllOrders();
  console.log("Orders data:", ordersData);

  // Refetch data when parameters change
  useEffect(() => {
    refetch();
  }, [currentPage, pageSize, searchTerm, statusFilter, dateFilter, refetch]);

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoaderSpinner />
        <p>Loading orders...</p>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <FaExclamationCircle size={48} color="#e74c3c" />
        <h3>Failed to load orders</h3>
        <p>{error.message}</p>
        <p>Please try again later</p>
      </ErrorContainer>
    );
  }

  // Extract data from response
  // API returns: { status: 'success', results: [...], meta: {...} }
  // Axios wraps it in response.data, so ordersData = { status: 'success', results: [...], meta: {...} }
  const orders = ordersData?.results || ordersData?.data?.results || [];

  // Pagination is in meta object
  const pagination = ordersData?.meta || ordersData?.data?.pagination || {};
  const {
    total = 0,
    totalPages = 1,
    currentPage: currentPageFromApi = 1,
    itemsPerPage = 10,
  } = pagination;
  
  // Calculate pagination flags
  const hasNext = currentPageFromApi < totalPages;
  const hasPrev = currentPageFromApi > 1;
  const totalOrders = total || orders.length;

  // Stats from backend

  const stats = () => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        pendingCount: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };
    }

    return {
      totalOrders: orders.length,
      pendingCount: orders.filter((order) => {
        const status = order.orderStatus || order.currentStatus;
        return status === "pending" || status === "pending_payment";
      }).length,
      processing: orders.filter((order) => {
        const status = order.orderStatus || order.currentStatus;
        return status === "processing" || status === "preparing" || status === "ready_for_dispatch";
      }).length,
      confirmed: orders.filter((order) => {
        const status = order.orderStatus || order.currentStatus;
        return status === "confirmed";
      }).length,
      shipped: orders.filter((order) => {
        const status = order.orderStatus || order.currentStatus;
        return status === "shipped" || status === "out_for_delivery";
      }).length,
      delivered: orders.filter((order) => {
        const status = order.orderStatus || order.currentStatus;
        return status === "delivered";
      }).length,
      cancelled: orders.filter((order) => {
        const status = order.orderStatus || order.currentStatus;
        return status === "cancelled";
      }).length,
    };
  };
  console.log("stats", stats());

  // console.log("Stats:", stats());
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleStatusChange = (order) => {
    console.log("Selected order for status change:", order);
  };

  const calculateTotalQuantity = (order) => {
    if (!order.orderItems) return 0;

    // If orderItems are populated objects
    if (order.orderItems[0]?.quantity) {
      return order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    // If orderItems are just IDs (not populated)
    return order.orderItems.length;
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
      case "pending_payment":
        return <FaExclamationCircle />;
      case "processing":
      case "preparing":
      case "ready_for_dispatch":
        return <FaShoppingBag />;
      case "confirmed":
        return <FaCheckCircle />; // Confirmed status
      case "shipped":
      case "out_for_delivery":
        return <FaTruck />;
      case "delivered":
        return <FaCheckCircle />;
      case "cancelled":
        return <FaTimesCircle />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
      case "pending_payment":
        return "#f39c12";
      case "processing":
      case "preparing":
      case "ready_for_dispatch":
        return "#3498db";
      case "confirmed":
        return "#27ae60"; // Green for confirmed
      case "shipped":
      case "out_for_delivery":
        return "#9b59b6";
      case "delivered":
        return "#2ecc71";
      case "cancelled":
        return "#e74c3c";
      default:
        return "#7f8c8d";
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          <FaShoppingBag /> Order Management
        </Title>
        <Description>Manage and track customer orders</Description>
      </Header>

      <StatsContainer>
        <StatCard>
          <StatIcon $color="#3498db">
            <FaShoppingBag />
          </StatIcon>
          <StatContent>
            <StatValue>{stats().totalOrders}</StatValue>
            <StatLabel>Total Orders</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon $color="#f39c12">
            <FaExclamationCircle />
          </StatIcon>
          <StatContent>
            <StatValue>{stats().pendingCount}</StatValue>
            <StatLabel>Pending</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon $color="#3498db">
            <FaShoppingBag />
          </StatIcon>
          <StatContent>
            <StatValue>{stats().processing}</StatValue>
            <StatLabel>Processing</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon $color="#9b59b6">
            <FaTruck />
          </StatIcon>
          <StatContent>
            <StatValue>{stats().shipped}</StatValue>
            <StatLabel>Shipped</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon $color="#2ecc71">
            <FaCheckCircle />
          </StatIcon>
          <StatContent>
            <StatValue>{stats().delivered}</StatValue>
            <StatLabel>Delivered</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon $color="#e74c3c">
            <FaTimesCircle />
          </StatIcon>
          <StatContent>
            <StatValue>{stats().cancelled}</StatValue>
            <StatLabel>Cancelled</StatLabel>
          </StatContent>
        </StatCard>
      </StatsContainer>

      <ControlsContainer>
        <SearchContainer>
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search by order ID"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </SearchContainer>

        <FilterGroup>
          <FilterLabel>Status</FilterLabel>
          <FilterSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Date</FilterLabel>
          <FilterSelect
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </FilterSelect>
        </FilterGroup>
      </ControlsContainer>

      <OrdersTable>
        <TableHeader>
          <TableRow>
            <HeaderCell>Order ID</HeaderCell>
            <HeaderCell>Customer</HeaderCell>
            <HeaderCell>Date</HeaderCell>
            <HeaderCell>Tracking Number</HeaderCell>
            <HeaderCell>Items</HeaderCell>
            <HeaderCell>Amount</HeaderCell>
            <HeaderCell>Status</HeaderCell>
            <HeaderCell>Actions</HeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <TableRow key={order._id || order.id}>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.user?.name || "Unknown Customer"}</TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  {order.trackingNumber ? (
                    <TrackingLink 
                      onClick={() => navigate(`/dashboard/tracking/${order.trackingNumber}`, { replace: false })}
                      title="Track Order"
                    >
                      {order.trackingNumber}
                    </TrackingLink>
                  ) : (
                    <TrackingPending>Pending...</TrackingPending>
                  )}
                </TableCell>
                <TableCell>{calculateTotalQuantity(order)}</TableCell>
                <TableCell>
                  Gh₵{order.totalPrice?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  <StatusBadge $color={getStatusColor(order.orderStatus || order.currentStatus)}>
                    {getStatusIcon(order.orderStatus || order.currentStatus)}
                    {(order.orderStatus || order.currentStatus)?.charAt(0).toUpperCase() +
                      (order.orderStatus || order.currentStatus)?.slice(1) || "Unknown"}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <ActionButtons>
                    <ActionIcon
                      $color="#3498db"
                      title="View details"
                      to={`detail/${order._id || order.id}`}
                    >
                      <FaEye />
                    </ActionIcon>
                    <ActionIcon
                      $color="#2ecc71"
                      title="Update status"
                      onClick={() => handleStatusChange(order)}
                    >
                      <FaEdit />
                    </ActionIcon>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <NoOrdersRow>
              <td colSpan="7">
                <NoOrders>
                  <FaShoppingBag size={48} />
                  <h3>No orders found</h3>
                  <p>Try adjusting your filters or search criteria</p>
                </NoOrders>
              </td>
            </NoOrdersRow>
          )}
        </TableBody>
      </OrdersTable>

      {/* Pagination Controls */}
      <PaginationContainer>
        <PageSizeControl>
          <span>Orders per page:</span>
          <PageSizeSelect
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </PageSizeSelect>
        </PageSizeControl>

        <PaginationInfo>
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalOrders)} of {totalOrders}{" "}
          orders
        </PaginationInfo>

        <PaginationControls>
          <PaginationButton
            disabled={!hasPrev}
            onClick={() => handlePageChange(1)}
            title="First Page"
          >
            <FaAngleLeft />
          </PaginationButton>

          <PaginationButton
            disabled={!hasPrev}
            onClick={() => handlePageChange(currentPage - 1)}
            title="Previous Page"
          >
            <FaAngleLeft />
          </PaginationButton>

          <PageInfo>
            Page {currentPageFromApi} of {totalPages}
          </PageInfo>

          <PaginationButton
            disabled={!hasNext}
            onClick={() => handlePageChange(currentPage + 1)}
            title="Next Page"
          >
            <FaAngleRight />
          </PaginationButton>

          <PaginationButton
            disabled={!hasNext}
            onClick={() => handlePageChange(totalPages)}
            title="Last Page"
          >
            <FaAngleRight />
          </PaginationButton>
        </PaginationControls>
      </PaginationContainer>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
`;

const StatLabel = styled.div`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const ControlsContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
`;

const SearchContainer = styled.div`
  flex: 1;
  min-width: 300px;
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  gap: 0.75rem;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  outline: none;
`;

const SearchIcon = styled.div`
  color: #7f8c8d;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
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
`;

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
`;

const TableHeader = styled.thead`
  background-color: #f8fafc;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;

  &:nth-child(even) {
    background-color: #f8fafc;
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
`;

const TrackingLink = styled.span`
  color: #3498db;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #2980b9;
  }
`;

const TrackingPending = styled.span`
  color: #95a5a6;
  font-style: italic;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: ${(props) =>
    props.$color ? `${props.$color}20` : "#f1f5f9"};
  color: ${(props) => props.$color || "#4a5568"};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionIcon = styled(Link)`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${(props) =>
    props.$color ? `${props.$color}20` : "#f1f5f9"};
  color: ${(props) => props.$color || "#4a5568"};
  border: none;
  text-decoration: none;

  &:hover {
    background-color: ${(props) => props.$color || "#e2e8f0"};
    color: white;
  }
`;

const NoOrdersRow = styled.tr`
  td {
    padding: 3rem;
    text-align: center;
  }
`;

const NoOrders = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #7f8c8d;

  h3 {
    color: #2c3e50;
    margin: 0;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-top: 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const PageSizeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

const PageSizeSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
`;

const PaginationInfo = styled.div`
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;

  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PageInfo = styled.div`
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: #4a5568;
`;

const PaginationButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background-color: white;
  color: #2c3e50;
  border: 1px solid #e2e8f0;

  &:hover:not(:disabled) {
    background-color: #f8f9fa;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  font-size: 1.2rem;
  color: #3498db;
`;

const LoaderSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 2rem auto;

  h3 {
    color: #e74c3c;
    margin: 1rem 0 0.5rem;
  }

  p {
    color: #7f8c8d;
    font-size: 1rem;
    margin: 0.25rem 0;
  }
`;
