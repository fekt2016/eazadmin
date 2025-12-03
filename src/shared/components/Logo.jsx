import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

/**
 * EazShop Logo Component
 * Can be used as a standalone logo or as a link to home
 */
const Logo = ({ 
  variant = "default", // "default" | "compact" | "icon"
  to = null, // If provided, wraps logo in Link
  className = "",
  ...props 
}) => {
  const logoContent = (
    <LogoContainer className={className} $variant={variant} {...props}>
      <LogoIcon $variant={variant}>
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          {/* Modern Shopping Cart Icon */}
          <g transform="translate(4, 4)">
            {/* Cart Base */}
            <rect x="4" y="20" width="24" height="20" rx="2.5" fill="currentColor" opacity="0.15"/>
            <rect x="4" y="20" width="24" height="20" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2.5"/>
            
            {/* Cart Handle */}
            <path 
              d="M8 20 L8 8 C8 5.8 9.8 4 12 4 L20 4 C22.2 4 24 5.8 24 8 L24 20" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
            
            {/* Shopping Items */}
            <circle cx="12" cy="28" r="3.5" fill="currentColor"/>
            <circle cx="20" cy="28" r="3.5" fill="currentColor"/>
            
            {/* Cart Wheels */}
            <circle cx="10" cy="36" r="2.5" fill="currentColor" opacity="0.6"/>
            <circle cx="22" cy="36" r="2.5" fill="currentColor" opacity="0.6"/>
          </g>
        </svg>
      </LogoIcon>
      {variant !== "icon" && (
        <LogoText $variant={variant}>
          <LogoTextPrimary>Eaz</LogoTextPrimary>
          <LogoTextSecondary>Shop</LogoTextSecondary>
        </LogoText>
      )}
    </LogoContainer>
  );

  if (to) {
    return (
      <LogoLink to={to}>
        {logoContent}
      </LogoLink>
    );
  }

  return logoContent;
};

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => (props.$variant === "compact" ? "0.5rem" : "0.75rem")};
  cursor: ${(props) => (props.onClick || props.to ? "pointer" : "default")};
  transition: opacity 0.2s ease;

  &:hover {
    opacity: ${(props) => (props.onClick || props.to ? 0.8 : 1)};
  }
`;

const LogoLink = styled(Link)`
  text-decoration: none;
  display: inline-flex;
`;

const LogoIcon = styled.div`
  width: ${(props) => {
    if (props.$variant === "compact") return "32px";
    if (props.$variant === "icon") return "40px";
    return "40px";
  }};
  height: ${(props) => {
    if (props.$variant === "compact") return "32px";
    if (props.$variant === "icon") return "40px";
    return "40px";
  }};
  color: #ffc400;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const LogoText = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.125rem;
  line-height: 1;
`;

const LogoTextPrimary = styled.span`
  font-size: ${(props) => {
    if (props.$variant === "compact") return "1.25rem";
    return "1.5rem";
  }};
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.5px;
`;

const LogoTextSecondary = styled.span`
  font-size: ${(props) => {
    if (props.$variant === "compact") return "1.25rem";
    return "1.5rem";
  }};
  font-weight: 700;
  color: #ffc400;
  letter-spacing: -0.5px;
`;

export default Logo;

