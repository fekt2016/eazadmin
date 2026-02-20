import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHeadset, FaBook, FaComments } from 'react-icons/fa';
import useDynamicPageTitle from '../../shared/hooks/useDynamicPageTitle';
import { PATHS } from '../../routes/routhPath';
import {
  SitemapContainer,
  HeroSection,
  HeroTitle,
  HeroSubtext,
  SearchSection,
  SearchLabel,
  SearchInput,
  SectionsGrid,
  SitemapSection,
  SectionHeader,
  LinksList,
  LinkItem,
  SitemapLink,
  FooterCTA,
  CTATitle,
  CTAButtons,
  CTAButton,
} from './sitemap.styles';

/**
 * Sitemap Page for EazAdmin
 * Displays all pages and resources in the admin portal
 */
const SitemapPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // SEO
  useDynamicPageTitle({
    title: 'Sitemap | EazAdmin',
    description: 'Explore all pages and resources in the admin portal.',
    keywords: 'sitemap, admin portal, navigation, EazAdmin',
    defaultTitle: 'Sitemap | EazAdmin',
    defaultDescription: 'Explore all pages and resources in the admin portal.',
  });

  // Sitemap sections data
  const sitemapSections = [
    {
      id: 'dashboard',
      title: 'Dashboard & Overview',
      links: [
        { label: 'Admin Dashboard', path: PATHS.DASHBOARD },
      ],
    },
    {
      id: 'orders',
      title: 'Orders Management',
      links: [
        { label: 'All Orders', path: PATHS.ORDERS },
        { label: 'Order Details', path: PATHS.ORDER_DETAIL },
        { label: 'Order Status', path: PATHS.ORDER_STATUS },
        { label: 'Order Tracking', path: PATHS.TRACKING },
      ],
    },
    {
      id: 'products',
      title: 'Products & Categories',
      links: [
        { label: 'All Products', path: PATHS.PRODUCTS },
        { label: 'Product Details', path: PATHS.PRODUCTDETAILS },
        { label: 'Categories', path: PATHS.CATEGORY },
        { label: 'Category Details', path: PATHS.CATEGORYDETAIL },
        { label: 'Discount Products', path: PATHS.DISCOUNTPRODUCT },
        { label: 'Advertisements', path: PATHS.ADS },
        { label: 'Saiisai Products', path: PATHS.EAZSHOP_PRODUCTS },
        { label: 'Reviews', path: PATHS.REVIEWS },
      ],
    },
    {
      id: 'users',
      title: 'Users & Sellers',
      links: [
        { label: 'All Users', path: PATHS.USERS },
        { label: 'User Details', path: PATHS.USERDETAIL },
        { label: 'Sellers', path: PATHS.SELLERS },
        { label: 'Seller Details', path: PATHS.SELLERDETAIL },
        { label: 'Admins', path: PATHS.ADMINS },
        { label: 'Admin Details', path: PATHS.ADMINDETAIL },
        { label: 'User Activity', path: PATHS.ACTIVITY },
      ],
    },
    {
      id: 'finance',
      title: 'Finance & Payments',
      links: [
        { label: 'Payment Requests', path: PATHS.PAYMENTS },
        { label: 'Payment Details', path: PATHS.PAYMENTDETAIL },
        { label: 'Balance History', path: PATHS.BALANCE_HISTORY },
        { label: 'Refunds', path: PATHS.REFUNDS },
        { label: 'Refund Details', path: PATHS.REFUND_DETAIL },
      ],
    },
    {
      id: 'shipping',
      title: 'Shipping & Logistics',
      links: [
        { label: 'Shipping Rates', path: PATHS.SHIPPING_RATES },
        { label: 'Distance Overview', path: PATHS.DISTANCE_OVERVIEW },
        { label: 'Saiisai Shipping Fees', path: PATHS.EAZSHOP_SHIPPING_FEES },
        { label: 'Pickup Centers', path: PATHS.EAZSHOP_PICKUP_CENTERS },
      ],
    },
    {
      id: 'system',
      title: 'System & Settings',
      links: [
        { label: 'Tax & VAT', path: PATHS.TAX },
        { label: 'Activity Logs', path: PATHS.ACTIVITY_LOGS },
        { label: 'Device Sessions', path: PATHS.DEVICE_SESSIONS },
      ],
    },
    {
      id: 'support',
      title: 'Support & Help',
      links: [
        { label: 'Support Center', path: PATHS.SUPPORT },
        { label: 'Chat Support', path: PATHS.CHAT_SUPPORT },
      ],
    },
    {
      id: 'external',
      title: 'External Resources',
      links: [
        { label: 'SaiisaiWeb (Buyer App)', path: 'https://saiisai.com', external: true },
        { label: 'EazSeller Portal', path: 'https://seller.saiisai.com', external: true },
        { label: 'Saiisai Website', path: 'https://saiisai.com', external: true },
      ],
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const heroVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <SitemapContainer>
      {/* Hero Section */}
      <HeroSection
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        <HeroTitle>Sitemap</HeroTitle>
        <HeroSubtext>
          Explore all pages and resources in the admin portal.
        </HeroSubtext>
      </HeroSection>

      {/* Search Bar */}
      <SearchSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <SearchLabel htmlFor="sitemap-search">
          Find a page
        </SearchLabel>
        <SearchInput
          id="sitemap-search"
          type="text"
          placeholder="Search for a page..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchSection>

      {/* Sitemap Sections Grid */}
      <SectionsGrid
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {sitemapSections.map((section) => (
          <SitemapSection
            key={section.id}
            variants={sectionVariants}
          >
            <SectionHeader>{section.title}</SectionHeader>
            <LinksList>
              {section.links.map((link, index) => (
                <LinkItem key={index}>
                  {link.external ? (
                    <SitemapLink
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </SitemapLink>
                  ) : (
                    <SitemapLink as={Link} to={`/dashboard/${link.path}`}>
                      {link.label}
                    </SitemapLink>
                  )}
                </LinkItem>
              ))}
            </LinksList>
          </SitemapSection>
        ))}
      </SectionsGrid>

      {/* Footer CTA */}
      <FooterCTA
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <CTATitle>Still can't find a page?</CTATitle>
        <CTAButtons>
          <CTAButton
            as={Link}
            to={`/dashboard/${PATHS.SUPPORT}`}
            $variant="primary"
          >
            <FaHeadset style={{ marginRight: 'var(--spacing-xs)' }} />
            Contact Support
          </CTAButton>
          <CTAButton
            as={Link}
            to={`/dashboard/${PATHS.CHAT_SUPPORT}`}
            $variant="secondary"
          >
            <FaComments style={{ marginRight: 'var(--spacing-xs)' }} />
            Open Chat
          </CTAButton>
        </CTAButtons>
      </FooterCTA>
    </SitemapContainer>
  );
};

export default SitemapPage;

