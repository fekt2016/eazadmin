import React from 'react';
import styled from 'styled-components';
import useDynamicPageTitle from '../../shared/hooks/useDynamicPageTitle';
import Container from '../../components/ui/Container';
import Grid from '../../components/ui/Grid';
import Card from '../../components/ui/Card';
import SectionTitle from '../../components/ui/SectionTitle';
import Button from '../../components/ui/Button';
import IconWrapper from '../../components/ui/IconWrapper';
import { FaChartBar, FaUsers, FaShoppingCart, FaDollarSign } from 'react-icons/fa';
import { useAdminStats } from '../../shared/hooks/useAdminStats'; // Assume

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

const AdminDashboard = () => {
  useDynamicPageTitle({
    title: "Admin Dashboard",
    description: "EazAdmin control panel.",
    defaultTitle: "Dashboard • EazAdmin",
  });

  const { data: stats, isLoading } = useAdminStats();

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

        <SectionTitle title="Recent Activity" />
        <Grid responsiveColumns>
          {/* Activity cards */}
          {stats?.recentActivity?.map(activity => (
            <Card key={activity.id} clickable variant="elevated">
              <h4>{activity.type}</h4>
              <p>{activity.description}</p>
              <Button variant="primary" size="sm">View</Button>
            </Card>
          ))}
        </Grid>

        <Button variant="primary">Generate Report</Button>
      </Container>
    </AdminDashboardWrapper>
  );
};

export default AdminDashboard;
