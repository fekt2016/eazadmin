import { Link, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Logo from './Logo';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(
    135deg,
    var(--color-body-bg) 0%,
    var(--color-primary-100) 50%,
    var(--color-primary-50) 100%
  );
  position: relative;
  overflow: hidden;
`;

const BackgroundDecoration = styled.div`
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(37, 99, 235, 0.05) 0%,
    transparent 50%
  );
  pointer-events: none;
  z-index: 0;
`;

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 640px) {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }
`;

const LogoRow = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.75rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem 0;
  text-align: center;
  letter-spacing: -0.02em;
`;

const Description = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #64748b;
  margin: 0 0 1rem 0;
  text-align: center;
`;

const Meta = styled.div`
  margin-bottom: 1.5rem;
  text-align: center;
`;

const PathCode = styled.code`
  display: inline-block;
  max-width: 100%;
  padding: 0.5rem 0.75rem;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #475569;
  word-break: break-all;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const PrimaryLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 1rem;
  background: linear-gradient(
    135deg,
    var(--color-primary-600) 0%,
    var(--color-primary-700) 100%
  );
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);

  &:hover {
    background: linear-gradient(
      135deg,
      var(--color-primary-700) 0%,
      var(--color-primary-800) 100%
    );
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
    color: white;
  }
`;

const SecondaryLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.875rem 1rem;
  background: white;
  color: var(--color-primary-600);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary-600);
    background: #f8fafc;
    color: var(--color-primary-700);
  }
`;

/**
 * Full-bleed status / error screen aligned with admin login visual language.
 */
export default function AdminStandaloneMessage({
  title,
  description,
  primaryTo,
  primaryLabel,
  secondaryTo,
  secondaryLabel,
  showPath,
}) {
  const { pathname } = useLocation();

  return (
    <Shell>
      <Card role="main" aria-labelledby="admin-standalone-title">
        <LogoRow>
          <Logo variant="default" />
        </LogoRow>
        <Title id="admin-standalone-title">{title}</Title>
        <Description>{description}</Description>
        {showPath ? (
          <Meta>
            <PathCode>{pathname}</PathCode>
          </Meta>
        ) : null}
        <Actions>
          <PrimaryLink to={primaryTo}>{primaryLabel}</PrimaryLink>
          {secondaryTo && secondaryLabel ? (
            <SecondaryLink to={secondaryTo}>{secondaryLabel}</SecondaryLink>
          ) : null}
        </Actions>
      </Card>
      <BackgroundDecoration />
    </Shell>
  );
}
