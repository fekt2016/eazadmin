import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import useDynamicPageTitle from '../../shared/hooks/useDynamicPageTitle';
import Container from '../../components/ui/Container';
import Grid from '../../components/ui/Grid';
import Card from '../../components/ui/Card';
import SectionTitle from '../../components/ui/SectionTitle';
import Button from '../../components/ui/Button';
import IconWrapper from '../../components/ui/IconWrapper';
import { FaChartBar, FaUsers, FaShoppingCart, FaDollarSign, FaBell } from 'react-icons/fa';
import { useAdminStats } from '../../shared/hooks/useAdminStats';
import { useNotifications, useUnreadCount } from '../../shared/hooks/notifications/useNotifications';
import { PATHS } from '../../routes/routhPath';

const AdminDashboardWrapper = styled.div`
  background: var(--color-grey-50);
`;

const StatsGrid = styled(Grid)`
  margin-bottom: var(--space-2xl);
`;

const StatCard = styled(Card)`
  text-align: center;
  padding: var(--space-xl) !important;
`;

const StatIcon = styled(IconWrapper)`
  background: var(--color-brand-100);
  color: var(--color-brand-500);
  margin-bottom: var(--space-md);
  font-size: var(--text-3xl);
`;

const StatNumber = styled.h3`
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-brand-500);
  margin: 0 0 var(--space-sm) 0;
`;

const StatLabel = styled.p`
  color: var(--color-grey-600);
  margin: 0;
  font-size: var(--text-base);
`;

const NotificationsWidget = styled(Card)`
  margin-top: var(--space-xl);
  padding: var(--space-lg) !important;
`;

const NotificationItem = styled.div`
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-grey-200);
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: var(--color-grey-50);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const NotificationTitle = styled.h4`
  margin: 0 0 var(--space-xs) 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-grey-900);
`;

const NotificationMessage = styled.p`
  margin: 0 0 var(--space-xs) 0;
  font-size: var(--text-xs);
  color: var(--color-grey-600);
  line-height: 1.4;
`;

const NotificationTime = styled.span`
  font-size: var(--text-xs);
  color: var(--color-grey-500);
`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  useDynamicPageTitle({
    title: "Admin Dashboard",
    description: "EazAdmin control panel.",
    defaultTitle: "Dashboard • EazAdmin",
  });

  const { data: stats, isLoading } = useAdminStats();
  const { data: notificationsData } = useNotifications({ limit: 5 });
  const { data: unreadData } = useUnreadCount();
  
  const unreadCount = unreadData?.data?.unreadCount || 0;
  const recentNotifications = notificationsData?.data?.notifications || [];

  if (isLoading) {
    return (
      <AdminDashboardWrapper>
        <Container>
          <StatsGrid responsiveColumns>
            <StatCard variant="elevated">
              <StatIcon size="lg"><FaChartBar /></StatIcon>
              <StatNumber>Loading...</StatNumber>
              <StatLabel>Total Users</StatLabel>
            </StatCard>
            {/* More stats */}
          </StatsGrid>
        </Container>
      </AdminDashboardWrapper>
    );
  }

  return (
    <AdminDashboardWrapper>
      <Container>
        <SectionTitle title="Admin Dashboard" subtitle="System overview" />
        
        <StatsGrid responsiveColumns columns={4}>
          <StatCard variant="elevated">
            <StatIcon size="lg"><FaUsers /></StatIcon>
            <StatNumber>{stats?.totalUsers || 0}</StatNumber>
            <StatLabel>Total Users</StatLabel>
          </StatCard>
          
          <StatCard variant="elevated">
            <StatIcon size="lg"><FaShoppingCart /></StatIcon>
            <StatNumber>{stats?.totalOrders || 0}</StatNumber>
            <StatLabel>Total Orders</StatLabel>
          </StatCard>
          
          <StatCard variant="elevated">
            <StatIcon size="lg"><FaDollarSign /></StatIcon>
            <StatNumber>{stats?.totalRevenue || 0}</StatNumber>
            <StatLabel>Revenue</StatLabel>
          </StatCard>
          
          <StatCard variant="elevated">
            <StatIcon size="lg"><FaChartBar /></StatIcon>
            <StatNumber>{stats?.growth || 0}%</StatNumber>
            <StatLabel>Growth</StatLabel>
          </StatCard>
        </StatsGrid>

        <NotificationsWidget variant="elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <SectionTitle title="Recent Notifications" />
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => navigate(`/dashboard/${PATHS.NOTIFICATIONS}`)}
            >
              View All
            </Button>
          </div>
          {recentNotifications.length === 0 ? (
            <p style={{ color: 'var(--color-grey-500)', textAlign: 'center', padding: 'var(--space-lg)' }}>
              No notifications yet
            </p>
          ) : (
            recentNotifications.slice(0, 5).map((notification) => (
              <NotificationItem
                key={notification._id}
                onClick={() => {
                  if (notification.actionUrl) {
                    // If actionUrl is already a full path starting with /dashboard, use it directly
                    if (notification.actionUrl.startsWith('/dashboard')) {
                      navigate(notification.actionUrl);
                    } else {
                      // Otherwise, prepend /dashboard
                      navigate(`/dashboard${notification.actionUrl}`);
                    }
                  } else if (notification.metadata?.orderId) {
                    navigate(`/dashboard/orders/detail/${notification.metadata.orderId}`);
                  } else if (notification.metadata?.ticketId) {
                    navigate(`/dashboard/support/tickets/${notification.metadata.ticketId}`);
                  } else if (notification.metadata?.productId) {
                    navigate(`/dashboard/product-details/${notification.metadata.productId}`);
                  } else if (notification.metadata?.sellerId) {
                    navigate(`/dashboard/sellers/detail/${notification.metadata.sellerId}`);
                  } else if (notification.metadata?.refundId) {
                    navigate(`/dashboard/refunds/${notification.metadata.refundId}`);
                  } else if (notification.metadata?.withdrawalId) {
                    navigate(`/dashboard/payment-request/detail/${notification.metadata.withdrawalId}`);
                  } else {
                    navigate(`/dashboard/${PATHS.NOTIFICATIONS}`);
                  }
                }}
              >
                <NotificationTitle>{notification.title}</NotificationTitle>
                <NotificationMessage>{notification.message}</NotificationMessage>
                <NotificationTime>
                  {new Date(notification.createdAt).toLocaleDateString()}
                </NotificationTime>
              </NotificationItem>
            ))
          )}
        </NotificationsWidget>

        <Button variant="primary">Generate Report</Button>
      </Container>
    </AdminDashboardWrapper>
  );
};

export default AdminDashboard;
