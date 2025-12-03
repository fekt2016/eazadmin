import styled from "styled-components";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * Reusable Button component with built-in loading spinner
 * Usage:
 * <Button isLoading={mutation.isLoading} disabled={mutation.isLoading}>
 *   Save Changes
 * </Button>
 */
export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${({ size }) => {
    switch (size) {
      case "sm":
        return "0.5rem 1rem";
      case "lg":
        return "1rem 2rem";
      default:
        return "0.75rem 1.5rem";
    }
  }};
  font-size: ${({ size }) => {
    switch (size) {
      case "sm":
        return "0.875rem";
      case "lg":
        return "1.125rem";
      default:
        return "1rem";
    }
  }};
  font-weight: ${({ variant }) => (variant === "primary" ? "600" : "500")};
  border: ${({ variant }) => {
    switch (variant) {
      case "outline":
        return "2px solid #2563eb";
      case "ghost":
        return "2px solid transparent";
      default:
        return "none";
    }
  }};
  border-radius: ${({ rounded }) => (rounded ? "50px" : "8px")};
  background: ${({ variant, disabled }) => {
    if (disabled) return "#cbd5e1";
    switch (variant) {
      case "outline":
        return "transparent";
      case "ghost":
        return "transparent";
      case "danger":
        return "#ef4444";
      case "success":
        return "#10b981";
      default:
        return "#2563eb";
    }
  }};
  color: ${({ variant, disabled }) => {
    if (disabled) return "#64748b";
    switch (variant) {
      case "outline":
        return "#2563eb";
      case "ghost":
        return "#64748b";
      default:
        return "white";
    }
  }};
  cursor: ${({ disabled, isLoading }) =>
    disabled || isLoading ? "not-allowed" : "pointer"};
  transition: all 0.2s ease;
  opacity: ${({ disabled, isLoading }) =>
    disabled || isLoading ? 0.7 : 1};
  min-width: ${({ minWidth }) => minWidth || "auto"};

  &:hover:not(:disabled):not([aria-busy="true"]) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px
      ${({ variant }) => {
        switch (variant) {
          case "outline":
            return "rgba(37, 99, 235, 0.2)";
          case "danger":
            return "rgba(239, 68, 68, 0.3)";
          case "success":
            return "rgba(16, 185, 129, 0.3)";
          default:
            return "rgba(37, 99, 235, 0.3)";
        }
      }};
  }

  &:active:not(:disabled):not([aria-busy="true"]) {
    transform: translateY(0);
  }

  &:disabled,
  &[aria-busy="true"] {
    cursor: wait;
  }
`;

/**
 * Button with loading spinner wrapper
 * Automatically shows spinner when isLoading is true
 * Supports both isLoading and isPending (React Query v5 uses isPending)
 */
export const LoadingButton = ({
  children,
  isLoading = false,
  isPending = false,
  disabled = false,
  size = "md",
  variant = "primary",
  rounded = false,
  minWidth,
  ...props
}) => {
  const loading = isLoading || isPending;
  const spinnerColor = variant === "outline" || variant === "ghost" ? "#2563eb" : "white";
  
  return (
    <Button
      disabled={disabled || loading}
      isLoading={loading}
      size={size}
      variant={variant}
      rounded={rounded}
      minWidth={minWidth}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <SpinnerWrapper>
          <LoadingSpinner size="sm" color={spinnerColor} />
        </SpinnerWrapper>
      )}
      {children}
    </Button>
  );
};

const SpinnerWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: 0.5rem;
`;

export default LoadingButton;

