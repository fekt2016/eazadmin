/* eslint-disable react/prop-types */
import React from 'react';
import styled, { css, keyframes } from "styled-components";
import { spin } from '../styles/animations';

// Modern dual-ring spinner animation
const dualRingSpin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Primary Loading Spinner Component - GLOBAL STANDARD (Modern Design)
const SpinnerWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const OuterRing = styled.div`
  position: absolute;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: ${({ $color, theme }) => 
    $color || 
    (theme?.colors?.primary) || 
    'var(--color-primary-500)' || 
    'var(--primary)' || 
    '#3b82f6'
  };
  border-right-color: ${({ $color, theme }) => 
    $color || 
    (theme?.colors?.primary) || 
    'var(--color-primary-500)' || 
    'var(--primary)' || 
    '#3b82f6'
  };
  animation: ${dualRingSpin} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  width: ${({ $size = "md" }) => {
    switch ($size) {
      case "sm":
        return "16px";
      case "lg":
        return "40px";
      case "xl":
        return "56px";
      default:
        return "28px";
    }
  }};
  height: ${({ $size = "md" }) => {
    switch ($size) {
      case "sm":
        return "16px";
      case "lg":
        return "40px";
      case "xl":
        return "56px";
      default:
        return "28px";
    }
  }};
`;

const InnerRing = styled.div`
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: ${({ $color, theme }) => 
    $color || 
    (theme?.colors?.primary) || 
    'var(--color-primary-500)' || 
    'var(--primary)' || 
    '#3b82f6'
  };
  border-right-color: ${({ $color, theme }) => 
    $color ? 'transparent' : 
    (theme?.colors?.grey?.[300]) || 
    'var(--color-grey-300)' || 
    'var(--gray-300)' || 
    '#d1d5db'
  };
  animation: ${dualRingSpin} 0.8s linear infinite reverse;
  width: ${({ $size = "md" }) => {
    switch ($size) {
      case "sm":
        return "10px";
      case "lg":
        return "26px";
      case "xl":
        return "38px";
      default:
        return "18px";
    }
  }};
  height: ${({ $size = "md" }) => {
    switch ($size) {
      case "sm":
        return "10px";
      case "lg":
        return "26px";
      case "xl":
        return "38px";
      default:
        return "18px";
    }
  }};
  opacity: 0.6;
`;

const Spinner = styled.div`
  position: relative;
  width: ${({ $size = "md" }) => {
    switch ($size) {
      case "sm":
        return "16px";
      case "lg":
        return "40px";
      case "xl":
        return "56px";
      default:
        return "28px";
    }
  }};
  height: ${({ $size = "md" }) => {
    switch ($size) {
      case "sm":
        return "16px";
      case "lg":
        return "40px";
      case "xl":
        return "56px";
      default:
        return "28px";
    }
  }};
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  ${({ $centered, $fullScreen }) => {
    if ($fullScreen) {
      return css`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        z-index: 1000;
      `;
    }
    if ($centered) {
      return css`
        min-height: 100vh;
        width: 100%;
      `;
    }
    return '';
  }}
`;

/**
 * Global LoadingSpinner Component - SINGLE SOURCE OF TRUTH
 * 
 * This is the SINGLE SOURCE OF TRUTH for all loading spinners across the application.
 * All other spinner components should be deprecated and replaced with this one.
 * 
 * @param {string} size - Spinner size: 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} color - Spinner color (CSS color value)
 * @param {boolean} centered - Center the spinner in its container
 * @param {boolean} fullScreen - Show as full-screen overlay
 * @param {string} ariaLabel - Accessibility label (default: "Loading...")
 * 
 * @example
 * <LoadingSpinner size="sm" /> // For buttons
 * <LoadingSpinner size="md" centered /> // For page sections
 * <LoadingSpinner size="lg" fullScreen /> // For full-page loading
 * <LoadingSpinner size="md" color="#ff0000" /> // Custom color
 */
function LoadingSpinner({ 
  size = "md", 
  color, 
  centered = false, 
  fullScreen = false,
  ariaLabel = "Loading...",
  ...props 
}) {
  return (
    <Container 
      $centered={centered} 
      $fullScreen={fullScreen}
      role="status" 
      aria-live="polite"
      {...props}
    >
      <SpinnerWrapper>
        <Spinner $size={size} aria-label={ariaLabel}>
          <OuterRing $size={size} $color={color} />
          <InnerRing $size={size} $color={color} />
        </Spinner>
      </SpinnerWrapper>
    </Container>
  );
}

// Export as default for convenience
export default LoadingSpinner;

// Also export as named export for flexibility
export { LoadingSpinner };

// Export ButtonSpinner for backward compatibility (deprecated - use LoadingSpinner size="sm")
export const ButtonSpinner = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ size = "sm" }) => {
    switch (size) {
      case "sm":
        return "16px";
      case "md":
        return "20px";
      case "lg":
        return "24px";
      default:
        return "16px";
    }
  }};
  height: ${({ size = "sm" }) => {
    switch (size) {
      case "sm":
        return "16px";
      case "md":
        return "20px";
      case "lg":
        return "24px";
      default:
        return "16px";
    }
  }};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-right-color: currentColor;
    animation: ${spin} 0.6s linear infinite;
  }
`;

// Export PageSpinner for backward compatibility (deprecated - use LoadingSpinner size="lg" fullScreen)
export const PageSpinner = styled.div`
  display: inline-block;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: var(--primary, var(--color-primary-500, #3b82f6));
  border-right-color: var(--primary, var(--color-primary-500, #3b82f6));
  border-bottom-color: var(--gray-200, var(--color-grey-200, #e5e7eb));
  border-left-color: var(--gray-200, var(--color-grey-200, #e5e7eb));
  animation: ${spin} 0.8s linear infinite;
`;

// Export SpinnerContainer for backward compatibility
export const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  
  ${({ fullScreen }) => fullScreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    z-index: 1000;
  `}
`;

// Export LoadingContainer as alias for SpinnerContainer (backward compatibility)
export const LoadingContainer = SpinnerContainer;
