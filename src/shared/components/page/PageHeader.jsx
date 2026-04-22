import styled from 'styled-components';

/** eazseller-aligned page chrome — uses GlobalStyles CSS variables */
export const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--layout-stack-gap);
  margin-bottom: var(--layout-section-gap);
  flex-wrap: wrap;
`;

export const PageTitle = styled.h1`
  display: flex;
  align-items: center;
  gap: var(--layout-inline-gap);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-grey-900);
  margin: 0 0 0.4rem 0;
  line-height: 1.2;
`;

export const PageSub = styled.p`
  font-size: var(--text-sm);
  color: var(--color-grey-500);
  margin: 0;
  line-height: 1.5;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--layout-inline-gap);
  flex-wrap: wrap;
`;
