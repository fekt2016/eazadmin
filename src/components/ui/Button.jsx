// Copy from EazSeller Button.jsx, but primary --color-brand-500 (blue for admin)
import styled, { css } from 'styled-components';
import { FaSpinner } from 'react-icons/fa';

const buttonBaseStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  line-height: 1.5;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  text-decoration: none;
  font-family: var(--font-body);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }

  svg {
    font-size: 1em;
  }
`;

const Button = styled.button`
  ${buttonBaseStyles}

  ${({ variant }) => {
    switch (variant) {
      case 'primary':
        return css`
          background: var(--color-brand-500); // Blue for admin
          color: var(--color-white-0);
          box-shadow: var(--shadow-sm);

          &:hover:not(:disabled) {
            background: var(--color-brand-600);
            box-shadow: var(--shadow-md);
          }
        `;
      // ... other variants same as EazSeller
      case 'secondary':
        return css`
          background: var(--color-grey-50);
          color: var(--color-grey-700);
          border: 1px solid var(--color-grey-200);

          &:hover:not(:disabled) {
            background: var(--color-grey-100);
            border-color: var(--color-grey-300);
          }
        `;
      case 'outline':
        return css`
          background: transparent;
          color: var(--color-brand-500);
          border: 1px solid var(--color-brand-500);

          &:hover:not(:disabled) {
            background: var(--color-brand-500);
            color: var(--color-white-0);
          }
        `;
      case 'danger':
        return css`
          background: var(--color-red-500);
          color: var(--color-white-0);
          border: 1px solid var(--color-red-500);

          &:hover:not(:disabled) {
            background: var(--color-red-600);
            border-color: var(--color-red-600);
          }
        `;
      default:
        return css`
          background: var(--color-brand-500);
          color: var(--color-white-0);
        `;
    }
  }}

  // Sizes and fullWidth same as before
  ${({ size }) => {
    switch (size) {
      case 'sm':
        return css`
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-sm);
        `;
      case 'lg':
        return css`
          padding: var(--space-lg) var(--space-xl);
          font-size: var(--text-lg);
        `;
      default:
        return css`
          padding: var(--space-md) var(--space-lg);
        `;
    }
  }}

  ${({ fullWidth }) => fullWidth && css`
    width: 100%;
  `}
`;

const Spinner = styled(FaSpinner)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ButtonComponent = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  loading = false, 
  disabled = false, 
  ...props 
}) => {
  return (
    <Button 
      variant={variant} 
      size={size} 
      fullWidth={fullWidth} 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </Button>
  );
};

export default ButtonComponent;
