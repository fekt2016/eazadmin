import styled from "styled-components";
import { LoadingSpinner } from "../LoadingSpinner";
import { FaExclamationCircle } from "react-icons/fa";

/**
 * LoadingState Component
 * Displays a loading spinner with an optional message
 */
export const LoadingState = ({ message = "Loading..." }) => {
  return (
    <LoadingContainer>
      <LoadingSpinner size="lg" />
      {message && <LoadingMessage>{message}</LoadingMessage>}
    </LoadingContainer>
  );
};

/**
 * ErrorState Component
 * Displays an error message with an icon
 */
export const ErrorState = ({ title = "Error", message = "Something went wrong" }) => {
  return (
    <ErrorContainer>
      <ErrorIcon>
        <FaExclamationCircle size={48} />
      </ErrorIcon>
      <ErrorTitle>{title}</ErrorTitle>
      <ErrorMessage>{message}</ErrorMessage>
    </ErrorContainer>
  );
};

// Styled Components
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  gap: 1rem;
`;

const LoadingMessage = styled.p`
  color: var(--color-grey-500);
  font-size: 1rem;
  margin: 0;
  text-align: center;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
`;

const ErrorIcon = styled.div`
  color: var(--color-red-500, #ef4444);
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-grey-800, #1e293b);
  margin: 0 0 0.5rem 0;
`;

const ErrorMessage = styled.p`
  color: var(--color-grey-600, #64748b);
  font-size: 1rem;
  margin: 0;
  max-width: 500px;
`;

