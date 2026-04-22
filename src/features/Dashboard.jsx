import { useState, useMemo } from "react";
import useAuth from "../shared/hooks/useAuth";
import SupportAgentDashboard from "./dashboard/SupportAgentDashboard";
import { FaBox, FaChartLine, FaShoppingCart, FaUsers, FaCheckCircle, FaStar, FaSync } from "react-icons/fa";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import useAdminStats from "../shared/hooks/useAdminStats";
import { useGetAllOrders } from "../shared/hooks/useOrder";
import { useGetTopSellers } from "../shared/hooks/useGetTopSellers";
import { formatDate } from "../shared/utils/helpers";
import { LoadingState, ErrorState } from "../shared/components/ui/LoadingComponents";
import { orderService } from "../shared/services/orderApi";

const T = {
  primary:      'var(--color-primary-600)',
  primaryLight: 'var(--color-primary-500)',
  primaryBg:    'var(--color-primary-100)',
  border:       'var(--color-border)',
  cardBg:       'var(--color-card-bg)',
  bodyBg:       'var(--color-body-bg)',
  text:         'var(--color-grey-900)',
  textMuted:    'var(--color-grey-500)',
  textLight:    'var(--color-grey-400)',
  radius:       'var(--border-radius-xl)',
  radiusSm:     'var(--border-radius-md)',
  shadow:       'var(--shadow-sm)',
  shadowMd:     'var(--shadow-md)',
};

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
    confirmed: "#bb6c02",
    processing: "#985308",
    shipped: "#9b59b6",
    pending: "#f39c12",
    pending_payment: "#f39c12", // Orange for pending payment
    cancelled: "#e74c3c",
    failed: "#e74c3c",
    returned: "#95a5a6",
    paid: "#bb6c02",
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

export default function AdminDashboard() {
  const { adminData } = useAuth();
  const currentAdmin = useMemo(() => {
    if (!adminData) return null;
    const fromMe = adminData.data?.data?.data;
    if (fromMe) return fromMe;
    if (adminData.role && (adminData.email || adminData.name)) return adminData;
    if (adminData.data?.role) return adminData.data;
    return null;
  }, [adminData]);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useGetAllOrders();
  const { data: sellersData, isLoading: sellersLoading } = useGetTopSellers(5);

  const [backfillLoading, setBackfillLoading] = useState(false);
  const [lastBackfillErrors, setLastBackfillErrors] = useState(null);
  const runBackfill = async () => {
    setBackfillLoading(true);
    setLastBackfillErrors(null);
    try {
      const res = await orderService.backfillSellerCredits({ limit: 100 });
      const data = res?.data?.data ?? res?.data ?? res;
      const credited = data?.credited ?? 0;
      const processed = data?.processed ?? 0;
      const skipped = data?.skipped ?? 0;
      const errors = Array.isArray(data?.errors) ? data.errors : [];
      if (skipped > 0 && errors.length > 0) {
        setLastBackfillErrors(errors);
      }
      if (credited > 0) {
        queryClient.invalidateQueries({ queryKey: ["adminStats"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        toast.success(`Backfill complete: ${credited} order(s) credited, ${skipped} skipped (${processed} processed).`);
      } else if (processed === 0) {
        toast.info("No delivered orders needed crediting.");
      } else {
        toast.info(`Backfill complete: ${skipped} order(s) skipped (${processed} processed). See reasons below.`);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Backfill failed";
      toast.error(msg);
    } finally {
      setBackfillLoading(false);
    }
  };

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

  // Extract and format recent orders (support multiple API response shapes)
  const recentOrders = useMemo(() => {
    const rawOrders =
      ordersData?.data?.results ??
      ordersData?.data?.data ??
      ordersData?.results ??
      [];
    if (!Array.isArray(rawOrders) || rawOrders.length === 0) return [];

    const allOrders = rawOrders;
    const sorted = [...allOrders].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return dateB - dateA;
    });

    return sorted.slice(0, 5).map((order) => {
      const id = order._id ?? order.id;
      const u = order.user;
      const customerName =
        u && typeof u === "object"
          ? u.name || u.email || "—"
          : order.buyer?.name || order.shippingAddress?.fullName || order.shippingAddress?.name || "—";
      return {
        id: id?.toString?.() ?? id,
        orderNumber: order.orderNumber ?? order.order_number ?? "—",
        customer: (typeof customerName === 'string' ? customerName : 'Unknown Customer'),
        date: formatDate(order.createdAt || order.created_at),
        amount: `GH₵${(order.totalPrice || order.total_price || order.total || 0).toFixed(2)}`,
        status: order.orderStatus ?? order.currentStatus ?? order.status ?? "pending",
        statusColor: getStatusColor(order.orderStatus ?? order.currentStatus ?? order.status),
      };
    });
  }, [ordersData]);

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

  if (currentAdmin?.role === "support_agent") {
    return <SupportAgentDashboard admin={currentAdmin} />;
  }

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
            <BannerLeft>
              <BannerEyebrow>Platform overview</BannerEyebrow>
              <BannerTitle>Welcome back, Admin!</BannerTitle>
              <BannerSubtitle>
                Here&apos;s what&apos;s happening with your multi-vendor platform today.
                Monitor your vendors, track sales, and manage orders
                efficiently.
              </BannerSubtitle>
            </BannerLeft>
            <BannerActions>
              <BannerOutlineBtn
                type="button"
                onClick={runBackfill}
                disabled={backfillLoading}
                title="Credit sellers for delivered orders that were never credited"
              >
                {backfillLoading ? (
                  <>Running…</>
                ) : (
                  <>
                    <FaSync style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    Backfill seller credits
                  </>
                )}
              </BannerOutlineBtn>
              <BannerSolidBtn type="button">Generate Report</BannerSolidBtn>
            </BannerActions>
          </WelcomeBanner>

          {lastBackfillErrors && lastBackfillErrors.length > 0 && (
            <BackfillAlert>
              <h4>Why were orders skipped?</h4>
              <ul>
                {lastBackfillErrors.map((e, i) => (
                  <li key={e.orderId || i}>
                    <strong>{e.orderNumber || e.orderId || `Order ${i + 1}`}:</strong>{" "}
                    {e.message || "Unknown reason"}
                  </li>
                ))}
              </ul>
            </BackfillAlert>
          )}

          <StatsGrid>
            {metrics.map((metric, index) => (
              <StatCard key={index} $variant={metric.bg}>
                <StatCardTop>
                  <StatIconWrap $variant={metric.bg}>{metric.icon}</StatIconWrap>
                  <StatLabel>{metric.title}</StatLabel>
                </StatCardTop>
                <StatValue>{metric.value}</StatValue>
                <StatTrend>{metric.change}</StatTrend>
              </StatCard>
            ))}
          </StatsGrid>

          <ChartsRow>
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Revenue Analytics (Last 30 Days)</PanelTitle>
                </div>
              </PanelHeader>
              {stats?.revenueGraphData && stats.revenueGraphData.length > 0 ? (
                <RevenueChartScroll>
                  <ChartBars>
                    {stats.revenueGraphData.map((day, index) => {
                      const maxRevenue = Math.max(...stats.revenueGraphData.map((d) => d.revenue), 1);
                      const height = (day.revenue / maxRevenue) * 100;
                      const tip = `GH₵${day.revenue.toFixed(0)}`;
                      return (
                        <ChartBar key={index} title={tip}>
                          <BarFill $height={height} />
                          <BarLabel>
                            {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </BarLabel>
                        </ChartBar>
                      );
                    })}
                  </ChartBars>
                </RevenueChartScroll>
              ) : (
                <ChartPlaceholder>No revenue data available</ChartPlaceholder>
              )}
            </Panel>

            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Top Sellers</PanelTitle>
                </div>
              </PanelHeader>
              {vendors.length > 0 ? (
                <SellerList>
                  {vendors.map((vendor, idx) => (
                    <SellerRow
                      key={vendor.id}
                      onClick={() => navigate(`/dashboard/sellers/detail/${vendor.id}`)}
                    >
                      <SellerRank>{idx + 1}</SellerRank>
                      <SellerAvatar>{vendor.name.charAt(0).toUpperCase()}</SellerAvatar>
                      <SellerMeta>
                        <SellerName>{vendor.name}</SellerName>
                        <SellerStatsLine>
                          {vendor.products} products • {formatCurrency(vendor.sales)} sales
                        </SellerStatsLine>
                      </SellerMeta>
                      <SellerRating>
                        <FaStar />
                        {vendor.rating > 0 ? vendor.rating.toFixed(1) : "N/A"}
                      </SellerRating>
                    </SellerRow>
                  ))}
                </SellerList>
              ) : (
                <EmptyVendors>
                  <p>No sellers available</p>
                </EmptyVendors>
              )}
            </Panel>
          </ChartsRow>

          <Panel>
            <PanelHeader $row>
              <div>
                <PanelTitle>Recent Orders</PanelTitle>
              </div>
              <ViewAllLink to="/admin/dashboard/orders">View All</ViewAllLink>
            </PanelHeader>
            <TableWrap>
              <OrderTable>
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
                        onClick={() => navigate(`/dashboard/orders/detail/${order.id}`, { replace: false })}
                      >
                        <td className="mono">{order.orderNumber}</td>
                        <td>{order.customer}</td>
                        <td className="muted">{order.date}</td>
                        <td className="amount">{order.amount}</td>
                        <td>
                          <OrderBadge $color={order.statusColor}>{formatStatus(order.status)}</OrderBadge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-cell">
                        {ordersError ? "Failed to load orders" : "No recent orders"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </OrderTable>
            </TableWrap>
          </Panel>
        </Content>
      </MainContent>
    </DashboardContainer>
  );
}

const statAccent = {
  primary: "var(--color-primary-600)",
  success: "var(--color-green-700)",
  accent: "var(--color-primary-600)",
  warning: "var(--color-yellow-700)",
};

const statIconTint = {
  primary: "rgba(187, 108, 2, 0.12)",
  success: "rgba(21, 128, 61, 0.12)",
  accent: "rgba(187, 108, 2, 0.12)",
  warning: "rgba(161, 98, 7, 0.12)",
};

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${T.bodyBg};
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
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2.8rem 3.2rem;
  border-radius: ${T.radius};
  overflow: hidden;
  color: #fff;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
  align-items: center;
  justify-content: space-between;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at top right, rgba(226, 152, 0, 0.18) 0%, transparent 60%);
    pointer-events: none;
  }

  @media (max-width: 767px) {
    padding: 1.5rem 1.25rem;
    align-items: stretch;
  }

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const BannerLeft = styled.div`
  position: relative;
  z-index: 1;
  max-width: 40rem;
`;

const BannerEyebrow = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #e29800;
`;

const BannerTitle = styled.h1`
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  color: #fff;

  @media (min-width: 768px) {
    font-size: 2.4rem;
  }
`;

const BannerSubtitle = styled.p`
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.65);
`;

const BannerActions = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;

  @media (min-width: 768px) {
    flex-direction: row;
    width: auto;
    flex-shrink: 0;
  }
`;

const BannerOutlineBtn = styled.button`
  padding: 0.85rem 1.35rem;
  border-radius: ${T.radiusSm};
  font-size: 1.35rem;
  font-weight: 600;
  cursor: pointer;
  color: #fff;
  background: transparent;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  transition: background 0.2s, border-color 0.2s, transform 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const BannerSolidBtn = styled.button`
  padding: 0.85rem 1.35rem;
  border-radius: ${T.radiusSm};
  font-size: 1.35rem;
  font-weight: 600;
  cursor: pointer;
  color: #fff;
  border: none;
  background: linear-gradient(135deg, ${T.primaryLight} 0%, ${T.primary} 100%);
  box-shadow: ${T.shadow};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${T.shadowMd};
  }
`;

const BackfillAlert = styled.div`
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: ${T.radius};
  padding: 1.25rem 1.5rem;

  h4 {
    margin: 0 0 0.5rem;
    font-size: 1.35rem;
    font-weight: 600;
    color: ${T.text};
  }

  ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  li {
    margin-bottom: 0.4rem;
    font-size: 1.25rem;
    color: ${T.textMuted};
  }

  li:last-child {
    margin-bottom: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
  gap: 1.25rem;
  width: 100%;
`;

const StatCard = styled.div`
  background: ${T.cardBg};
  border: 1px solid ${T.border};
  border-radius: ${T.radius};
  padding: 2rem;
  box-shadow: ${T.shadow};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${T.shadowMd};
  }
`;

const StatCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
`;

const StatIconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.2rem;
  height: 4.2rem;
  border-radius: ${T.radiusSm};
  font-size: 1.8rem;
  flex-shrink: 0;
  background: ${(p) => statIconTint[p.$variant] || statIconTint.primary};
  color: ${(p) => statAccent[p.$variant] || statAccent.primary};
`;

const StatLabel = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${T.textLight};
  text-align: right;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${T.text};
  line-height: 1.2;
  margin-bottom: 0.35rem;
`;

const StatTrend = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--success);
`;

const Panel = styled.div`
  background: ${T.cardBg};
  border: 1px solid ${T.border};
  border-radius: ${T.radius};
  box-shadow: ${T.shadow};
  padding: 1.35rem 1.5rem;
  width: 100%;
  box-sizing: border-box;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-direction: ${(p) => (p.$row ? "row" : "column")};
  justify-content: ${(p) => (p.$row ? "space-between" : "flex-start")};
  align-items: ${(p) => (p.$row ? "center" : "flex-start")};
  gap: ${(p) => (p.$row ? "1rem" : "0")};
  margin-bottom: 1.25rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: ${T.text};
`;

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.25rem;
  width: 100%;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const RevenueChartScroll = styled.div`
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 0.5rem 0 0;
`;

const ChartPlaceholder = styled.div`
  height: 16rem;
  background: ${T.bodyBg};
  border-radius: ${T.radiusSm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${T.textMuted};
  font-weight: 600;
  font-size: 1.35rem;
`;

const ChartBars = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.6rem;
  height: 200px;
  padding: 0 0.4rem;
  min-width: 500px;
  width: max-content;
  box-sizing: border-box;

  @media (max-width: 480px) {
    min-width: 400px;
    gap: 0.4rem;
    height: 180px;
  }

  @media (min-width: 641px) {
    min-width: auto;
    gap: 0.8rem;
    height: 250px;
    width: 100%;
  }

  @media (min-width: 768px) {
    gap: 1rem;
    height: 280px;
  }
`;

const ChartBar = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  min-width: 2.8rem;

  @media (min-width: 640px) {
    min-width: 3.2rem;
  }
`;

const BarFill = styled.div`
  width: 100%;
  height: ${(p) => p.$height}%;
  min-height: 4px;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(180deg, #e29800 0%, #bb6c02 100%);
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.92;
  }
`;

const BarLabel = styled.div`
  font-size: 1rem;
  color: ${T.textMuted};
  margin-top: 0.6rem;
  text-align: center;
  transform: rotate(-40deg);
  white-space: nowrap;
  max-width: 5rem;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const SellerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const SellerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.5rem;
  border-radius: ${T.radiusSm};
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${T.bodyBg};
  }
`;

const SellerRank = styled.span`
  width: 1.8rem;
  flex-shrink: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${T.textLight};
  text-align: center;
`;

const SellerAvatar = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  color: #fff;
  background: linear-gradient(135deg, #bb6c02 0%, #e29800 100%);
`;

const SellerMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const SellerName = styled.div`
  font-weight: 700;
  font-size: 1.35rem;
  color: ${T.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SellerStatsLine = styled.div`
  font-size: 1.15rem;
  color: ${T.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SellerRating = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  font-weight: 700;
  font-size: 1.3rem;
  color: ${T.text};

  svg {
    color: #e29800;
    font-size: 1.2rem;
  }
`;

const EmptyVendors = styled.div`
  padding: 2.5rem 1rem;
  text-align: center;
  color: ${T.textMuted};

  p {
    margin: 0;
    font-size: 1.35rem;
  }
`;

const ViewAllLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  font-size: 1.25rem;
  font-weight: 600;
  text-decoration: none;
  color: ${T.primary};
  border: 1.5px solid ${T.border};
  background: transparent;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  white-space: nowrap;

  &:hover {
    background: ${T.primaryBg};
    border-color: ${T.primaryLight};
    color: ${T.primary};
  }
`;

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const OrderTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  font-size: 1.35rem;

  th,
  td {
    padding: 0.85rem 0.65rem;
    text-align: left;
    border-bottom: 1px solid ${T.border};
    vertical-align: middle;
  }

  th {
    background: ${T.bodyBg};
    color: ${T.textMuted};
    font-weight: 600;
    font-size: 1.1rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  td {
    color: ${T.text};
  }

  td.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 1.25rem;
    color: ${T.textMuted};
  }

  td.muted {
    color: ${T.textMuted};
    font-size: 1.25rem;
  }

  td.amount {
    font-weight: 700;
    color: ${T.text};
  }

  td.empty-cell {
    text-align: center;
    padding: 2rem;
    color: ${T.textMuted};
  }

  tbody tr {
    cursor: pointer;
    transition: background 0.15s;
  }

  tbody tr:hover {
    background: ${T.bodyBg};
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const OrderBadge = styled.span`
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 600;
  white-space: nowrap;
  color: ${(p) => p.$color || T.textMuted};
  background: ${(p) => (p.$color ? `${p.$color}18` : "rgba(107, 114, 128, 0.18)")};
`;