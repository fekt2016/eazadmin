import styled from 'styled-components';
import { motion } from 'framer-motion';

/**
 * Styled components for Sitemap Page (EazAdmin)
 * Modern, clean design
 */

// Container
export const SitemapContainer = styled.div`
  max-width: 140rem;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
  
  @media (max-width: 768px) {
    padding: var(--spacing-lg) var(--spacing-md);
  }
`;

// Hero Section
export const HeroSection = styled(motion.section)`
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl) var(--spacing-2xl);
  margin-bottom: var(--spacing-3xl);
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.1) 0%, 
    var(--color-white-0) 100%
  );
  border-radius: var(--border-radius-xl);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, 
      #3B82F6 0%, 
      #2563EB 100%
    );
  }
  
  @media (max-width: 768px) {
    padding: var(--spacing-2xl) var(--spacing-lg) var(--spacing-xl);
    margin-bottom: var(--spacing-2xl);
  }
`;

export const HeroTitle = styled.h1`
  font-size: var(--font-size-5xl);
  font-weight: var(--font-bold);
  color: var(--color-grey-900);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-heading);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-3xl);
  }
`;

export const HeroSubtext = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-grey-600);
  max-width: 60rem;
  margin: 0 auto;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-md);
  }
`;

// Search Bar Section
export const SearchSection = styled(motion.section)`
  margin-bottom: var(--spacing-3xl);
  max-width: 60rem;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    margin-bottom: var(--spacing-2xl);
  }
`;

export const SearchLabel = styled.label`
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-semibold);
  color: var(--color-grey-700);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-heading);
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--color-grey-300);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-md);
  font-family: var(--font-body);
  color: var(--color-grey-900);
  transition: all var(--transition-base);
  background: var(--color-white-0);
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: var(--color-grey-400);
  }
`;

// Sections Grid
export const SectionsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-2xl) var(--spacing-xl);
  margin-bottom: var(--spacing-3xl);
  
  @media (max-width: 968px) {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-xl) var(--spacing-lg);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }
`;

// Sitemap Section (Column)
export const SitemapSection = styled(motion.section)`
  display: flex;
  flex-direction: column;
`;

export const SectionHeader = styled.h2`
  font-size: var(--font-size-xl);
  font-weight: var(--font-bold);
  color: var(--color-grey-900);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-grey-200);
  font-family: var(--font-heading);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-md);
  }
`;

export const LinksList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
`;

export const LinkItem = styled.li`
  margin: 0;
`;

export const SitemapLink = styled.a`
  display: inline-block;
  font-size: var(--font-size-md);
  color: var(--color-grey-700);
  text-decoration: none;
  padding: var(--spacing-xs) 0;
  transition: all var(--transition-base);
  position: relative;
  font-family: var(--font-body);
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: #3B82F6;
    transition: width var(--transition-base);
  }
  
  &:hover {
    color: #3B82F6;
    padding-left: var(--spacing-sm);
    
    &::after {
      width: 100%;
    }
  }
  
  @media (max-width: 768px) {
    font-size: var(--font-size-sm);
  }
`;

// Footer CTA Section
export const FooterCTA = styled(motion.section)`
  background: linear-gradient(135deg, 
    var(--color-grey-50) 0%, 
    var(--color-white-0) 100%
  );
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-3xl) var(--spacing-xl);
  text-align: center;
  border: 1px solid var(--color-grey-200);
  margin-top: var(--spacing-3xl);
  
  @media (max-width: 768px) {
    padding: var(--spacing-2xl) var(--spacing-lg);
    margin-top: var(--spacing-2xl);
  }
`;

export const CTATitle = styled.h2`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-bold);
  color: var(--color-grey-900);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-heading);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-xl);
  }
`;

export const CTAButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  margin-top: var(--spacing-lg);
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const CTAButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-xl);
  background: ${props => props.$variant === 'primary' 
    ? '#3B82F6' 
    : 'var(--color-white-0)'};
  color: ${props => props.$variant === 'primary' 
    ? 'var(--color-white-0)' 
    : 'var(--color-grey-700)'};
  border: 2px solid ${props => props.$variant === 'primary' 
    ? '#3B82F6' 
    : 'var(--color-grey-300)'};
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: all var(--transition-base);
  font-family: var(--font-body);
  min-width: 16rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    background: ${props => props.$variant === 'primary' 
      ? '#2563EB' 
      : 'var(--color-grey-50)'};
    border-color: ${props => props.$variant === 'primary' 
      ? '#2563EB' 
      : 'var(--color-grey-400)'};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 640px) {
    width: 100%;
  }
`;

