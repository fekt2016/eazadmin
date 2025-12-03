import { useState, useMemo } from "react";
import { FaBox, FaChartLine, FaShoppingCart, FaUsers, FaCheckCircle, FaStar } from "react-icons/fa";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import useAdminStats from "../shared/hooks/useAdminStats";
import { useGetAllOrders } from "../shared/hooks/useOrder";
import { useGetTopSellers } from "../shared/hooks/useGetTopSellers";
import { formatDate } from "../shared/utils/helpers";
import { LoadingState, ErrorState } from "../shared/components/ui/LoadingComponents";

// Format currency
const formatCurrency = (amount) => {
  return `GH₵${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format number
const formatNumber = (num) => {
  return (num || 0).toLocaleString('en-US');
};

// Helper function to get status color
const getStatusColor = (status) => {
  const statusMap = {
    delivered: "#2ecc71",
    completed: "#2ecc71",
    confirmed: "#3498db", // Blue for confirmed orders
    processing: "#3498db",
    shipped: "#9b59b6",
    pending: "#f39c12",
    pending_payment: "#f39c12", // Orange for pending payment
    cancelled: "#e74c3c",
    failed: "#e74c3c",
    returned: "#95a5a6",
    paid: "#3498db", // Treat paid as confirmed
  };
  return statusMap[status?.toLowerCase()] || "#95a5a6";
};

// Helper function to format status for display
const formatStatus = (status) => {
  if (!status) return "Unknown";
  
  // Map status values to user-friendly names
  const statusMap = {
    pending_payment: "Pending Payment",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    completed: "Completed",
    pending: "Pending",
    cancelled: "Cancelled",
    failed: "Failed",
    returned: "Returned",
    paid: "Confirmed", // Map paid to confirmed for display
  };
  
  const normalizedStatus = status.toLowerCase();
  return statusMap[normalizedStatus] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
};

// Color maps for styled components
const bgColorMap = {
  primary: "var(--color-primary-100)",
  success: "var(--color-green-100)",
  accent: "var(--color-brand-100)",
  warning: "var(--color-yellow-100)",
};

const colorMap = {
  primary: "var(--color-primary-500)",
  success: "var(--color-green-700)",
  accent: "var(--color-brand-500)",
  warning: "var(--color-yellow-700)",
};

const statusBgMap = {
  Completed: "var(--color-green-100)",
  Pending: "var(--color-yellow-100)",
  Failed: "var(--color-red-100)",
};

const statusColorMap = {
  Completed: "var(--color-green-700)",
  Pending: "var(--color-yellow-700)",
  Failed: "var(--color-red-700)",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useGetAllOrders();
  const { data: sellersData, isLoading: sellersLoading } = useGetTopSellers(5);

  // Calculate metrics from stats
  const metrics = useMemo(() => {
    if (!stats) return [];

    return [
      {
        title: "Total Revenue",
        value: formatCurrency(stats.totalRevenue),
        change: `Today: ${formatCurrency(stats.todayRevenue)}`,
        icon: <FaShoppingCart />,
        bg: "primary",
      },
      {
        title: "Total Orders",
        value: formatNumber(stats.totalOrders),
        change: `${formatNumber(stats.totalDeliveredOrders)} delivered`,
        icon: <FaBox />,
        bg: "success",
      },
      {
        title: "This Month Revenue",
        value: formatCurrency(stats.thisMonthRevenue),
        change: `Last 30 days: ${formatCurrency(stats.last30DaysRevenue)}`,
        icon: <FaChartLine />,
        bg: "accent",
      },
      {
        title: "Delivered Orders",
        value: formatNumber(stats.totalDeliveredOrders),
        change: `${formatNumber(stats.totalPendingOrders)} pending`,
        icon: <FaCheckCircle />,
        bg: "warning",
      },
    ];
  }, [stats]);

  // Extract and format recent orders
  const recentOrders = useMemo(() => {
    if (!ordersData?.data?.results) return [];
    
    const allOrders = ordersData.data.results;
    // Sort by createdAt (most recent first) and take first 5
    const sorted = [...allOrders].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return dateB - dateA;
    });
    
    return sorted.slice(0, 5).map((order) => ({
      id: order.id || order._id,
      orderNumber: order.orderNumber || order.order_number || `#${order.id?.slice(-6) || 'N/A'}`,
      customer: order.user?.name || order.buyer?.name || "Unknown Customer",
      date: formatDate(order.createdAt || order.created_at),
      amount: `GH₵${(order.totalPrice || order.total_price || 0).toFixed(2)}`,
      status: order.orderStatus || order.currentStatus || order.status || "pending",
      statusColor: getStatusColor(order.orderStatus || order.currentStatus || order.status),
    }));
  }, [ordersData]);
  console.log("recentOrders", recentOrders);

  // Process sellers data
  const vendors = useMemo(() => {
    if (!sellersData?.data?.results) return [];
    
    return sellersData.data.results.map((seller) => ({
      id: seller._id || seller.id,
      name: seller.name || seller.shopName || "Unknown Seller",
      storeName: seller.shopName || seller.name || "Store",
      products: seller.productsCount || 0, // Will be calculated from products if not available
      sales: seller.totalSales || seller.balance || 0,
      rating: seller.rating || seller.averageRating || 0,
    }));
  }, [sellersData]);

  if (statsLoading || ordersLoading || sellersLoading) {
    return (
      <DashboardContainer>
        <MainContent>
          <Content>
            <LoadingState message="Loading dashboard..." />
          </Content>
        </MainContent>
      </DashboardContainer>
    );
  }

  if (statsError) {
    return (
      <DashboardContainer>
        <MainContent>
          <Content>
            <ErrorState
              title="Failed to load statistics"
              message={statsError?.response?.data?.message || statsError?.message || "Unable to load dashboard data"}
            />
          </Content>
        </MainContent>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <MainContent>
        <Content>
          <WelcomeBanner>
            <div>
              <h1>Welcome back, Admin!</h1>
              <p>
                Here's what's happening with your multi-vendor platform today.
                Monitor your vendors, track sales, and manage orders
                efficiently.
              </p>
            </div>
            <button>Generate Report</button>
          </WelcomeBanner>
          
          <CardsContainer>
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardIcon bg={metric.bg}>{metric.icon}</CardIcon>
                <CardContent>
                  <h3>{metric.value}</h3>
                  <p>{metric.title}</p>
                  <small style={{ color: "var(--color-green-700)", fontWeight: 500 }}>
                    {metric.change}
                  </small>
                </CardContent>
              </Card>
            ))}
          </CardsContainer>
          
          <ChartsContainer>
            <ChartCard>
              <ChartHeader>
                <h3>Revenue Analytics (Last 30 Days)</h3>
              </ChartHeader>
              {stats?.revenueGraphData && stats.revenueGraphData.length > 0 ? (
                <RevenueChart>
                  <ChartBars>
                    {stats.revenueGraphData.map((day, index) => {
                      const maxRevenue = Math.max(...stats.revenueGraphData.map(d => d.revenue), 1);
                      const height = (day.revenue / maxRevenue) * 100;
                      return (
                        <ChartBar key={index}>
                          <BarValue>GH₵{day.revenue.toFixed(0)}</BarValue>
                          <BarFill height={height} />
                          <BarLabel>{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</BarLabel>
                        </ChartBar>
                      );
                    })}
                  </ChartBars>
                </RevenueChart>
              ) : (
                <ChartPlaceholder>No revenue data available</ChartPlaceholder>
              )}
            </ChartCard>
            
            <ChartCard>
              <ChartHeader>
                <h3>Top Sellers</h3>
              </ChartHeader>
              {vendors.length > 0 ? (
                <VendorsList>
                  {vendors.map((vendor) => (
                    <VendorCard 
                      key={vendor.id}
                      onClick={() => navigate(`/dashboard/sellers/detail/${vendor.id}`)}
                    >
                      <VendorAvatar>{vendor.name.charAt(0).toUpperCase()}</VendorAvatar>
                      <VendorInfo>
                        <h4>{vendor.name}</h4>
                        <p>
                          {vendor.products} products • {formatCurrency(vendor.sales)} sales
                        </p>
                      </VendorInfo>
                      <VendorRating>
                        <FaStar style={{ color: '#FFD700', marginRight: '4px' }} />
                        {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'N/A'}
                      </VendorRating>
                    </VendorCard>
                  ))}
                </VendorsList>
              ) : (
                <EmptyVendors>
                  <p>No sellers available</p>
                </EmptyVendors>
              )}
            </ChartCard>
          </ChartsContainer>
          
          <ChartCard>
            <ChartHeader>
              <h3>Recent Orders</h3>
              <ViewAllButton to="/admin/dashboard/orders">
                View All
              </ViewAllButton>
            </ChartHeader>
            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr 
                        key={order.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/dashboard/orders/detail/${order.id}`)}
                      >
                        <td>{order.orderNumber}</td>
                        <td>{order.customer}</td>
                        <td>{order.date}</td>
                        <td>{order.amount}</td>
                        <td>
                          <StatusBadge $color={order.statusColor}>
                            {formatStatus(order.status)}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-grey-500)' }}>
                        {ordersError ? 'Failed to load orders' : 'No recent orders'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableContainer>
          </ChartCard>
        </Content>
      </MainContent>
    </DashboardContainer>
  );
}

// Styled components using global variables
const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: var(--color-grey-100);
  width: 100%;
  overflow-x: hidden;
  max-width: 100vw;
`;

const MainContent = styled.div`
  flex: 1;
  transition: all 0.3s;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
`;

const Content = styled.div`
  padding: 20px 15px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  
  @media (min-width: 640px) {
    padding: 25px 20px;
  }
  
  @media (min-width: 1024px) {
    padding: 30px;
  }
  
  @media (min-width: 1440px) {
    padding: 40px;
  }
`;

const WelcomeBanner = styled.div`
  background: linear-gradient(90deg, var(--color-primary-500), var(--color-brand-500));
  color: var(--color-white-0);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: center;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    padding: 25px;
  }

  h1 {
    font-size: 20px;
    margin-bottom: 8px;
    
    @media (min-width: 768px) {
      font-size: 28px;
      margin-bottom: 10px;
    }
  }

  p {
    opacity: 0.9;
    font-size: 14px;
    
    @media (min-width: 768px) {
      font-size: 16px;
      max-width: 600px;
    }
  }

  button {
    background: var(--color-white-0);
    border: none;
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 500;
    cursor: pointer;
    color: var(--color-primary-500);
    transition: all 0.3s;
    width: 100%;
    
    @media (min-width: 768px) {
      width: auto;
      padding: 10px 20px;
    }

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      background: var(--color-grey-50);
    }
  }
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  @media (min-width: 481px) and (max-width: 640px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }

  @media (min-width: 641px) and (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1025px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
`;

const Card = styled.div`
  background: var(--color-white-0);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s;
  min-height: 100px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;

  @media (min-width: 768px) {
    padding: 20px;
    gap: 15px;
    border-radius: 15px;
    min-height: auto;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const CardIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: ${(props) => bgColorMap[props.bg] || bgColorMap.primary};
  color: ${(props) => colorMap[props.bg] || colorMap.primary};
  flex-shrink: 0;

  @media (min-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 24px;
    border-radius: 12px;
  }
`;

const CardContent = styled.div`
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 18px;
    margin-bottom: 4px;
    word-break: break-word;
    
    @media (min-width: 768px) {
      font-size: 24px;
      margin-bottom: 5px;
    }
  }

  p {
    color: var(--color-grey-400);
    font-size: 12px;
    margin-bottom: 4px;
    
    @media (min-width: 768px) {
      font-size: 14px;
      margin-bottom: 5px;
    }
  }

  small {
    font-size: 11px;
    font-weight: 500;
    color: var(--color-green-700);
    
    @media (min-width: 768px) {
      font-size: 12px;
    }
  }
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  @media (max-width: 768px) {
    gap: 15px;
  }
`;

const ChartCard = styled.div`
  background: var(--color-white-0);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    font-size: 18px;
  }

  @media (max-width: 768px) {
    margin-bottom: 15px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    h3 {
      font-size: 16px;
    }
  }
`;

const ChartPlaceholder = styled.div`
  height: 300px;
  background: linear-gradient(120deg, var(--color-grey-50), var(--color-grey-200));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-grey-400);
  font-weight: 500;
  
  @media (max-width: 768px) {
    height: 200px;
  }
`;

const RevenueChart = styled.div`
  padding: 15px 0;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
  
  @media (min-width: 768px) {
    padding: 20px 0;
  }
`;

const ChartBars = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
  height: 200px;
  padding: 0 5px;
  min-width: 500px;
  width: max-content;
  box-sizing: border-box;
  
  @media (max-width: 480px) {
    min-width: 400px;
    gap: 4px;
    height: 180px;
    padding: 0 3px;
  }
  
  @media (min-width: 481px) and (max-width: 640px) {
    min-width: 450px;
    gap: 5px;
    height: 200px;
  }
  
  @media (min-width: 641px) {
    min-width: auto;
    gap: 8px;
    height: 250px;
    padding: 0 10px;
    width: 100%;
  }
  
  @media (min-width: 768px) {
    gap: 12px;
    height: 300px;
  }
`;

const ChartBar = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  position: relative;
  min-width: 30px;
  
  @media (min-width: 640px) {
    min-width: 40px;
  }
`;

const BarFill = styled.div`
  width: 100%;
  height: ${props => props.height}%;
  background: linear-gradient(180deg, var(--color-primary-500), var(--color-brand-500));
  border-radius: 8px 8px 0 0;
  min-height: 4px;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    opacity: 0.8;
  }
`;

const BarLabel = styled.div`
  font-size: 10px;
  color: var(--color-grey-500);
  margin-top: 8px;
  text-align: center;
  transform: rotate(-45deg);
  white-space: nowrap;
  overflow: visible;
  max-width: 60px;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 9px;
    margin-top: 6px;
    max-width: 50px;
  }

  @media (max-width: 480px) {
    font-size: 8px;
    margin-top: 4px;
    max-width: 40px;
  }
`;

const BarValue = styled.div`
  position: absolute;
  top: -25px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary-700);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
  
  ${ChartBar}:hover & {
    opacity: 1;
  }

  @media (max-width: 768px) {
    font-size: 10px;
    top: -20px;
  }

  @media (max-width: 480px) {
    font-size: 9px;
    top: -18px;
  }
`;

const TableContainer = styled.div`
  background: var(--color-white-0);
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  
  @media (min-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 10px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  font-size: 14px;
  table-layout: auto;

  @media (max-width: 480px) {
    min-width: 500px;
    font-size: 12px;
  }

  @media (min-width: 481px) and (max-width: 640px) {
    min-width: 550px;
    font-size: 13px;
  }

  @media (min-width: 768px) {
    font-size: 16px;
    min-width: auto;
    width: 100%;
  }

  th, td {
    padding: 12px 8px;
    text-align: left;
    border-bottom: 1px solid var(--color-grey-200);
    box-sizing: border-box;
    
    @media (max-width: 480px) {
      padding: 10px 6px;
    }
    
    @media (min-width: 768px) {
      padding: 15px 10px;
    }
    
    @media (min-width: 1024px) {
      padding: 15px 20px;
    }
  }

  th {
    color: var(--color-grey-500);
    font-weight: 500;
    font-size: 12px;
    white-space: nowrap;
    
    @media (max-width: 480px) {
      font-size: 11px;
    }
    
    @media (min-width: 768px) {
      font-size: 14px;
    }
  }

  td {
    font-size: 14px;
    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    
    @media (max-width: 480px) {
      font-size: 12px;
      max-width: 150px;
    }
    
    @media (min-width: 768px) {
      font-size: 16px;
      max-width: none;
    }
  }

  tbody tr {
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: rgba(67, 97, 238, 0.05);
    }
  }
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 500;
  background: ${(props) => props.$color ? `${props.$color}20` : statusBgMap.Completed};
  color: ${(props) => props.$color || statusColorMap.Completed};
  display: inline-block;
  white-space: nowrap;
  
  @media (min-width: 480px) {
    padding: 5px 10px;
    font-size: 12px;
  }
`;

const VendorsList = styled.div`
  width: 100%;
  max-width: 100%;
  overflow-y: auto;
  max-height: 400px;
`;

const VendorCard = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--color-grey-200);
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: rgba(67, 97, 238, 0.05);
  }

  @media (min-width: 768px) {
    padding: 15px;
    gap: 15px;
  }

  @media (max-width: 480px) {
    padding: 10px;
    gap: 10px;
  }
`;

const EmptyVendors = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: var(--color-grey-500);
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

const VendorAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary-500);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white-0);
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;

  @media (min-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 18px;
  }
`;

const VendorInfo = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;

  h4 {
    margin-bottom: 4px;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    
    @media (max-width: 480px) {
      font-size: 13px;
    }
    
    @media (min-width: 768px) {
      font-size: 16px;
      margin-bottom: 5px;
    }
  }

  p {
    color: var(--color-grey-400);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    
    @media (max-width: 480px) {
      font-size: 11px;
    }
    
    @media (min-width: 768px) {
      font-size: 13px;
    }
  }
`;

const VendorRating = styled.div`
  font-weight: 600;
  color: var(--color-sec-700);
  font-size: 14px;
  
  @media (min-width: 768px) {
    font-size: 16px;
  }
`;

const ViewAllButton = styled(Link)`
  background: var(--color-primary-500);
  color: var(--color-white-0);
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: var(--color-primary-700);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 12px;
  }

  @media (max-width: 480px) {
    padding: 5px 10px;
    font-size: 11px;
  }
`;