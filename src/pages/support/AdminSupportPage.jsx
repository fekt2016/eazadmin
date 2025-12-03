import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaTools,
  FaServer,
  FaShieldAlt,
  FaCreditCard,
  FaFileAlt,
  FaStore,
  FaDesktop,
  FaChevronRight,
  FaTicketAlt,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { PATHS } from '../../routes/routhPath';
import {
  SupportContainer,
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbSeparator,
  SectionWrapper,
  HeroSection,
  HeroContent,
  HeroLeft,
  HeroRight,
  HeroTitle,
  HeroSubtitle,
  HeroButton,
  HeroIconBackground,
  AlertSection,
  SectionHeader,
  SectionTitle,
  SectionDescription,
  ThreeColumnGrid,
  AlertCard,
  AlertCardLeftBar,
  AlertIconCircle,
  AlertBadge,
  AlertCardContent,
  AlertTitle,
  AlertDescription,
  AlertButton,
  ToolsSection,
  ToolsGrid,
  ToolCard,
  ToolIconCircle,
  ToolCardContent,
  ToolTitle,
  ToolDescription,
} from './support.styles';

/**
 * Admin Internal Support Page
 * Premium enterprise-grade admin support interface
 */
const AdminSupportPage = () => {
  const navigate = useNavigate();

  // Critical alert panels
  const criticalAlerts = [
    {
      id: 'system',
      title: 'System Monitoring & Outages',
      description:
        'Report critical system issues, server outages, database problems, or infrastructure failures that require immediate attention.',
      priority: 'critical',
      icon: <FaServer />,
    },
    {
      id: 'compliance',
      title: 'Seller Verification & Compliance Issues',
      description:
        'Flag compliance violations, verification problems, or seller account issues that need administrative review.',
      priority: 'high',
      icon: <FaShieldAlt />,
    },
    {
      id: 'payments',
      title: 'Payment Gateway & Wallet Issues',
      description:
        'Report payment processing failures, wallet system errors, transaction discrepancies, or financial system problems.',
      priority: 'high',
      icon: <FaCreditCard />,
    },
  ];

  // Admin quick tools
  const adminTools = [
    {
      title: 'Support Tickets',
      path: PATHS.SUPPORT_TICKETS,
      icon: <FaTicketAlt />,
      description: 'View and manage all support tickets from buyers, sellers, and admins',
    },
    {
      title: 'Error Logs Dashboard',
      path: '/admin/logs',
      icon: <FaFileAlt />,
      description: 'View system error logs and diagnostics',
    },
    {
      title: 'Payment Issues',
      path: '/admin/payments',
      icon: <FaCreditCard />,
      description: 'Manage payment problems and transactions',
    },
    {
      title: 'Seller Disputes',
      path: '/admin/disputes',
      icon: <FaStore />,
      description: 'Handle seller disputes and complaints',
    },
    {
      title: 'System Monitoring',
      path: '/admin/system',
      icon: <FaDesktop />,
      description: 'Monitor system health and performance',
    },
  ];


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <SupportContainer>
      {/* Breadcrumb */}
      <Breadcrumb
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <BreadcrumbLink to="/admin">Admin</BreadcrumbLink>
        <BreadcrumbSeparator>
          <FaChevronRight />
        </BreadcrumbSeparator>
        <BreadcrumbLink as="span" $active>Support</BreadcrumbLink>
      </Breadcrumb>

      {/* Hero Section */}
      <HeroSection
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <HeroContent>
          <HeroLeft>
            <HeroTitle>Admin Support & Ticket Management</HeroTitle>
            <HeroSubtitle>
              View and respond to support tickets from buyers and sellers. Manage ticket status, priority, and provide assistance.
            </HeroSubtitle>
            <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
              <HeroButton
                onClick={() => navigate(`/dashboard/${PATHS.SUPPORT_TICKETS}`)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaTicketAlt style={{ marginRight: '0.5rem' }} />
                View All Tickets
              </HeroButton>
              <HeroButton
                onClick={() => navigate(`/dashboard/${PATHS.SUPPORT_TICKETS}?role=admin`)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <FaShieldAlt style={{ marginRight: '0.5rem' }} />
                My Tickets
              </HeroButton>
            </div>
          </HeroLeft>
          <HeroRight>
            <HeroIconBackground>
              <FaTools />
            </HeroIconBackground>
          </HeroRight>
        </HeroContent>
      </HeroSection>

      {/* Critical Alert Panels */}
      <AlertSection
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <SectionHeader>
          <SectionTitle>Common Support Categories</SectionTitle>
          <SectionDescription>
            Filter tickets by category to quickly find and respond to specific types of issues
          </SectionDescription>
        </SectionHeader>
        <ThreeColumnGrid>
          {criticalAlerts.map((alert) => {
            const departmentMap = {
              system: 'Infrastructure',
              compliance: 'Compliance',
              payments: 'Payments',
            };

            return (
              <AlertCard
                key={alert.id}
                variants={itemVariants}
                $priority={alert.priority}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(`/dashboard/${PATHS.SUPPORT_TICKETS}?department=${encodeURIComponent(departmentMap[alert.id])}`)}
                style={{ cursor: 'pointer' }}
              >
                <AlertCardLeftBar $priority={alert.priority} />
                <AlertCardContent>
                  <AlertIconCircle $priority={alert.priority}>
                    {alert.icon}
                  </AlertIconCircle>
                  <AlertBadge $priority={alert.priority}>
                    {alert.priority === 'critical' ? 'Critical' : 'High Priority'}
                  </AlertBadge>
                  <AlertTitle $priority={alert.priority}>{alert.title}</AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                  <AlertButton
                    $priority={alert.priority}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/${PATHS.SUPPORT_TICKETS}?department=${encodeURIComponent(departmentMap[alert.id])}`);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Tickets
                  </AlertButton>
                </AlertCardContent>
              </AlertCard>
            );
          })}
        </ThreeColumnGrid>
      </AlertSection>

      {/* My Tickets Section */}
      <SectionWrapper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{ marginBottom: '4rem' }}
      >
        <SectionHeader>
          <SectionTitle>My Support Tickets</SectionTitle>
          <SectionDescription>
            View tickets you've created for internal support and system issues
          </SectionDescription>
        </SectionHeader>
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 2rem',
          background: '#ffffff',
          borderRadius: '1.2rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <p style={{ 
            color: '#64748b', 
            marginBottom: '2rem',
            fontSize: '1.5rem'
          }}>
            Track and manage your own support requests
          </p>
          <HeroButton
            onClick={() => navigate(`/dashboard/${PATHS.SUPPORT_TICKETS}?role=admin`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: '#3B82F6',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.8rem'
            }}
          >
            <FaTicketAlt />
            View My Tickets
          </HeroButton>
        </div>
      </SectionWrapper>

      {/* Admin Quick Tools */}
      <ToolsSection
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <SectionHeader>
          <SectionTitle>Admin Quick Tools</SectionTitle>
          <SectionDescription>
            Quick access to essential administrative dashboards and tools
          </SectionDescription>
        </SectionHeader>
        <ToolsGrid>
          {adminTools.map((tool, index) => (
            <ToolCard
              key={index}
              as={Link}
              to={tool.path}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            >
              <ToolIconCircle>
                {tool.icon}
              </ToolIconCircle>
              <ToolCardContent>
                <ToolTitle>{tool.title}</ToolTitle>
                <ToolDescription>{tool.description}</ToolDescription>
              </ToolCardContent>
            </ToolCard>
          ))}
        </ToolsGrid>
      </ToolsSection>

    </SupportContainer>
  );
};

export default AdminSupportPage;
