import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

/** Served from `eazadmin/public/newSaiisaiLogo.png` */
const WORDMARK_SRC = "/newSaiisaiLogo.png";

/**
 * Saiisai brand wordmark (PNG includes logotype + mark — no separate text).
 * Variants control display size only.
 */
const Logo = ({
  variant = "default", // "default" | "compact" | "icon"
  to = null,
  className = "",
  ...props
}) => {
  const logoContent = (
    <LogoContainer className={className} $variant={variant} {...props}>
      <WordmarkImg
        src={WORDMARK_SRC}
        alt="Saiisai"
        $variant={variant}
        decoding="async"
        fetchPriority={variant === "default" ? "high" : "auto"}
      />
    </LogoContainer>
  );

  if (to) {
    return <LogoLink to={to}>{logoContent}</LogoLink>;
  }

  return logoContent;
};

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(props) => (props.onClick || props.to ? "pointer" : "default")};
  transition: opacity 0.2s ease;

  &:hover {
    opacity: ${(props) => (props.onClick || props.to ? 0.92 : 1)};
  }
`;

const LogoLink = styled(Link)`
  text-decoration: none;
  display: inline-flex;
`;

const WordmarkImg = styled.img`
  display: block;
  width: auto;
  height: auto;
  object-fit: contain;

  ${(props) => {
    switch (props.$variant) {
      case "compact":
        return `
          max-width: 168px;
          max-height: 52px;
        `;
      case "icon":
        return `
          max-width: 44px;
          max-height: 44px;
        `;
      default:
        return `
          max-width: 260px;
          max-height: 80px;
        `;
    }
  }}
`;

export default Logo;
