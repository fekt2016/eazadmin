import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * Premium Enterprise-Grade Admin Support Styles
 * Inspired by Stripe Dashboard, Vercel Console, Linear Admin, GitHub Enterprise
 */

// ============================================
// CONTAINER & LAYOUT
// ============================================

export const SupportContainer = styled.div`
  max-width: 140rem;
  margin: 0 auto;
  padding: 3rem 2.4rem;
  min-height: 100vh;
  background: #fafbfc;
  
  @media (max-width: 768px) {
    padding: 2rem 1.6rem;
  }
`;

// ============================================
// BREADCRUMB
// ============================================

export const Breadcrumb = styled(motion.nav)`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 3rem;
  font-size: 1.4rem;
`;

export const BreadcrumbLink = styled(Link)`
  color: ${props => props.$active ? '#1a202c' : '#64748b'};
  text-decoration: none;
  font-weight: ${props => props.$active ? '600' : '400'};
  transition: color 0.2s ease;
  
  &:hover {
    color: #3B82F6;
  }
`;

export const BreadcrumbSeparator = styled.span`
  color: #cbd5e1;
  font-size: 1rem;
  display: flex;
  align-items: center;
`;

// ============================================
// HERO SECTION
// ============================================

export const HeroSection = styled(motion.section)`
  background: linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%);
  border-radius: 1.6rem;
  padding: 5rem 4rem;
  margin-bottom: 4rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 50%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }
  
  @media (max-width: 968px) {
    padding: 4rem 3rem;
  }
  
  @media (max-width: 768px) {
    padding: 3rem 2rem;
  }
`;

export const HeroContent = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4rem;
  align-items: center;
  position: relative;
  z-index: 1;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 3rem;
    text-align: center;
  }
`;

export const HeroLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
`;

export const HeroRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 968px) {
    display: none;
  }
`;

export const HeroTitle = styled.h1`
  font-size: 3.2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 2.4rem;
  }
`;

export const HeroSubtitle = styled.p`
  font-size: 1.125rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.6;
  max-width: 60rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

export const HeroButton = styled(motion.button)`
  align-self: flex-start;
  background: #ffffff;
  color: #1E3A8A;
  border: none;
  padding: 1.2rem 2.4rem;
  border-radius: 0.8rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  &:hover {
    background: #f8fafc;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 968px) {
    align-self: center;
  }
`;

export const HeroIconBackground = styled.div`
  width: 12rem;
  height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.1);
  font-size: 8rem;
`;

// ============================================
// SECTION HEADERS
// ============================================

export const SectionHeader = styled.div`
  margin-bottom: 3rem;
  text-align: left;
  
  @media (max-width: 768px) {
    margin-bottom: 2rem;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 2.4rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.8rem 0;
  line-height: 1.2;
  letter-spacing: -0.01em;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

export const SectionDescription = styled.p`
  font-size: 1rem;
  font-weight: 400;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
`;

// ============================================
// ALERT SECTION
// ============================================

export const AlertSection = styled(motion.section)`
  margin-bottom: 5rem;
  
  @media (max-width: 768px) {
    margin-bottom: 4rem;
  }
`;

export const ThreeColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.4rem;
  
  @media (max-width: 1024px) {
    gap: 2rem;
  }
  
  @media (max-width: 968px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.6rem;
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }
`;

export const AlertCard = styled(motion.div)`
  background: #ffffff;
  border-radius: 1.2rem;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: ${props => {
      if (props.$priority === 'critical') return '#DC2626';
      if (props.$priority === 'high') return '#EA580C';
      return '#3B82F6';
    }};
  }
`;

export const AlertCardLeftBar = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background: ${props => {
    if (props.$priority === 'critical') return '#DC2626';
    if (props.$priority === 'high') return '#EA580C';
    return '#3B82F6';
  }};
`;

export const AlertCardContent = styled.div`
  padding: 2.4rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  
  @media (max-width: 768px) {
    padding: 2rem;
    gap: 1rem;
  }
`;

export const AlertIconCircle = styled.div`
  width: 5.6rem;
  height: 5.6rem;
  border-radius: 50%;
  background: ${props => {
    if (props.$priority === 'critical') return '#FEE2E2';
    if (props.$priority === 'high') return '#FED7AA';
    return '#DBEAFE';
  }};
  color: ${props => {
    if (props.$priority === 'critical') return '#DC2626';
    if (props.$priority === 'high') return '#EA580C';
    return '#3B82F6';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  flex-shrink: 0;
  transition: transform 0.2s ease;
  
  ${AlertCard}:hover & {
    transform: scale(1.1);
  }
  
  @media (max-width: 768px) {
    width: 4.8rem;
    height: 4.8rem;
    font-size: 2rem;
  }
`;

export const AlertBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: fit-content;
  background: ${props => {
    if (props.$priority === 'critical') return '#FEE2E2';
    if (props.$priority === 'high') return '#FED7AA';
    return '#DBEAFE';
  }};
  color: ${props => {
    if (props.$priority === 'critical') return '#991B1B';
    if (props.$priority === 'high') return '#9A3412';
    return '#1E40AF';
  }};
`;

export const AlertTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

export const AlertDescription = styled.p`
  font-size: 0.9375rem;
  font-weight: 400;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
  flex: 1;
`;

export const AlertButton = styled(motion.button)`
  align-self: flex-start;
  background: ${props => {
    if (props.$priority === 'critical') return '#DC2626';
    if (props.$priority === 'high') return '#EA580C';
    return '#3B82F6';
  }};
  color: #ffffff;
  border: none;
  padding: 0.8rem 1.6rem;
  border-radius: 0.6rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => {
      if (props.$priority === 'critical') return '#B91C1C';
      if (props.$priority === 'high') return '#C2410C';
      return '#2563EB';
    }};
  }
`;

// ============================================
// TOOLS SECTION
// ============================================

export const ToolsSection = styled(motion.section)`
  margin-bottom: 4rem;
`;

export const ToolsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(28rem, 1fr));
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }
`;

export const ToolCard = styled(motion(Link))`
  display: flex;
  align-items: flex-start;
  gap: 1.6rem;
  padding: 2.4rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1.2rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  &:hover {
    border-color: #3B82F6;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.12);
  }
  
  @media (max-width: 768px) {
    padding: 2rem;
    gap: 1.2rem;
  }
`;

export const ToolIconCircle = styled.div`
  width: 5.6rem;
  height: 5.6rem;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  flex-shrink: 0;
  transition: transform 0.2s ease;
  
  ${ToolCard}:hover & {
    transform: scale(1.1);
    background: rgba(59, 130, 246, 0.15);
  }
  
  @media (max-width: 768px) {
    width: 4.8rem;
    height: 4.8rem;
    font-size: 2rem;
  }
`;

export const ToolCardContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

export const ToolTitle = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a202c;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

export const ToolDescription = styled.div`
  font-size: 0.875rem;
  font-weight: 400;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
`;

// ============================================
// LEGACY COMPONENTS (for backward compatibility)
// ============================================

export const SectionWrapper = styled(motion.section)`
  margin-bottom: 4rem;
  
  @media (max-width: 768px) {
    margin-bottom: 3rem;
  }
`;

// Legacy exports for backward compatibility
export const HeroIcon = styled.div`
  display: none;
`;

export const HeroSubtext = HeroSubtitle;

// Additional legacy components (if needed by other files)
export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(28rem, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }
`;

export const SupportCard = styled(motion.div)`
  background: #ffffff;
  border-radius: 1.2rem;
  padding: 2.4rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
`;

export const CardIcon = styled.div`
  width: 5.6rem;
  height: 5.6rem;
  border-radius: 50%;
  background: ${props => props.$bgColor || 'rgba(59, 130, 246, 0.1)'};
  color: ${props => props.$iconColor || '#3B82F6'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  margin-bottom: 1.6rem;
`;

export const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.8rem 0;
`;

export const CardDescription = styled.p`
  font-size: 0.9375rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
`;

export const CardButton = styled.button`
  background: ${props => props.$bgColor || '#3B82F6'};
  color: #ffffff;
  border: none;
  padding: 0.8rem 1.6rem;
  border-radius: 0.6rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1.6rem;
  width: 100%;
  
  &:hover {
    background: ${props => props.$hoverColor || '#2563EB'};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

export const QuickLinksSection = styled.section`
  margin-bottom: 4rem;
`;

export const LinksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.6rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const QuickLink = styled.a`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.6rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.8rem;
  text-decoration: none;
  color: #64748b;
  transition: all 0.2s ease;
  font-size: 0.9375rem;
  
  &:hover {
    border-color: ${props => props.$accentColor || '#3B82F6'};
    color: ${props => props.$accentColor || '#3B82F6'};
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

export const ChatSection = styled.section`
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 1.2rem;
  padding: 3rem;
  text-align: center;
  margin-bottom: 4rem;
  border: 1px solid #e2e8f0;
`;

export const ChatButton = styled.button`
  background: ${props => props.$bgColor || '#3B82F6'};
  color: #ffffff;
  border: none;
  padding: 1.2rem 2.4rem;
  border-radius: 0.8rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 1.6rem;
  
  &:hover {
    background: ${props => props.$hoverColor || '#2563EB'};
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
`;

export const ToolButton = ToolCard;
export const ToolIcon = ToolIconCircle;
export const ToolContent = ToolCardContent;
