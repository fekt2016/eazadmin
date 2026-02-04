import { Outlet } from "react-router-dom";
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import styled from "styled-components";
import useAuth from '../hooks/useAuth';
import { useMemo } from "react";

export default function DashboardLayout() {
  const { adminData } = useAuth();

  // Memoize user data (same extraction as ProtectedRoute: getCurrentUser response or plain user after login)
  const admin = useMemo(() => {
    if (!adminData) return null;
    return (
      adminData?.data?.data?.data ||
      adminData?.data?.data ||
      adminData?.data ||
      adminData
    ) || null;
  }, [adminData]);

  return (
    <DashboardLayoutContainer>
      <Sidebar role={admin?.role} />
      <Content>
        <Header user={admin} />
        <MainContentContainer>
          <Outlet />
        </MainContentContainer>
      </Content>
    </DashboardLayoutContainer>
  );
}

// Layout Grid: Sidebar + Content
const DashboardLayoutContainer = styled.div`
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  background-color: var(--color-grey-50);
  min-height: 100vh;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;

    /* Hide sidebar on mobile */
    aside {
      display: none;
    }
  }
`;

// Content wrapper
const Content = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--color-white-0);
  /* Make content scrollable when it overflows the viewport */
  height: 100vh;
  overflow-y: auto;
`;

// Main area below header
const MainContentContainer = styled.main`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  height: calc(100vh - var(--header-height));
  background-color: var(--color-white-0);
`;
