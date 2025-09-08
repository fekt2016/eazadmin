import styled, { keyframes } from "styled-components";

// Rotation animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Spinner component
export const ButtonSpinner = styled.div`
  width: ${({ size }) => size || "20px"};
  height: ${({ size }) => size || "20px"};
  border: ${({ thickness }) => thickness || "3px"} solid;
  border-color: ${({ theme }) => theme.primaryLight || "rgba(255,255,255,0.3)"};
  border-top-color: ${({ theme }) => theme.primary || "#ffffff"};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  display: inline-block;
  vertical-align: middle;
  margin-right: ${({ $hasText }) => ($hasText ? "8px" : "0")};
`;

// Button with loading state
export const LoadingButton = styled.button`
  position: relative;
  background: ${({ bg, theme }) => bg || theme.primary || "#4CAF50"};
  color: ${({ color }) => color || "white"};
  border: none;
  padding: ${({ size }) =>
    size === "sm" ? "8px 16px" : size === "lg" ? "14px 28px" : "12px 24px"};
  font-size: ${({ size }) =>
    size === "sm" ? "14px" : size === "lg" ? "18px" : "16px"};
  border-radius: ${({ pill }) => (pill ? "50px" : "4px")};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  min-width: ${({ minWidth }) => minWidth || "auto"};

  &:hover {
    background: ${({ hoverBg, theme }) =>
      hoverBg || theme.primaryDark || "#45a049"};
    transform: ${({ isLoading }) => (isLoading ? "none" : "translateY(-2px)")};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.8;
    background: ${({ disabledBg }) => disabledBg || "#cccccc"};
  }

  ${({ isLoading, fullWidth }) =>
    isLoading &&
    `
    cursor: wait;
    ${fullWidth && "width: 100%;"}
  `}
`;

export default ButtonSpinner;
