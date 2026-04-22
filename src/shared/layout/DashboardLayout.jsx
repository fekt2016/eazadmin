import { Outlet } from "react-router-dom";
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import styled from "styled-components";
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { useMemo, useEffect, useRef } from "react";
import { retainAdminChatSocket, releaseAdminChatSocket } from '../../features/chat/adminChatSocketManager';

const T = {
  primary:      'var(--color-primary-600)',
  primaryLight: 'var(--color-primary-500)',
  primaryBg:    'var(--color-primary-100)',
  border:       'var(--color-border)',
  cardBg:       'var(--color-card-bg)',
  bodyBg:       'var(--color-body-bg)',
  text:         'var(--color-grey-900)',
  textMuted:    'var(--color-grey-500)',
  textLight:    'var(--color-grey-400)',
  radius:       'var(--border-radius-xl)',
  radiusSm:     'var(--border-radius-md)',
  shadow:       'var(--shadow-sm)',
  shadowMd:     'var(--shadow-md)',
};

export default function DashboardLayout() {
  const { adminData } = useAuth();
  const trackedRef = useRef(false);

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

  useEffect(() => {
    if (!admin) return;
    const canLiveSupportChat = admin.role === 'admin' || admin.role === 'superadmin';
    if (!canLiveSupportChat) return undefined;
    retainAdminChatSocket();
    return () => releaseAdminChatSocket();
  }, [admin]);

  useEffect(() => {
    if (!admin || trackedRef.current) return;
    trackedRef.current = true;
    const sessionKey = 'saiisai_admin_analytics_session_id';
    const existingSessionId =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem(sessionKey)
        : null;
    const sessionId =
      existingSessionId ||
      `admin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    if (typeof window !== 'undefined' && !existingSessionId) {
      window.sessionStorage.setItem(sessionKey, sessionId);
    }

    api
      .post('/analytics/screen-views', {
        screen: 'home:variant_seen:ADMIN_DASH',
        sessionId,
      })
      .catch(() => {});
    api
      .post('/analytics/screen-views', {
        screen: 'home:dashboard_open:ADMIN_DASH',
        sessionId,
      })
      .catch(() => {});
  }, [admin]);

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
  background-color: ${T.bodyBg};
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
  background-color: ${T.bodyBg};
  /* Make content scrollable when it overflows the viewport */
  height: 100vh;
  overflow-y: auto;
`;

// Main area below header
const MainContentContainer = styled.main`
  flex: 1;
  padding: var(--layout-content-padding);
  overflow-y: auto;
  height: calc(100vh - var(--header-height));
  background-color: ${T.bodyBg};
`;
