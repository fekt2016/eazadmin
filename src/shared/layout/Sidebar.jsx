import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import styled from "styled-components";
import {
  FaChartLine,
  FaSignOutAlt,
  FaUsersCog,
  FaBoxes,
  FaShoppingCart,
  FaStore,
  FaTruck,
  FaRoute,
  FaMapMarkerAlt,
  FaAward,
  FaStar,
  FaHistory,
  FaCog,
  FaUndo,
  FaWallet,
  FaHeadset,
  FaTicketAlt,
  FaFileInvoiceDollar,
  FaVideo,
  FaWrench,
  FaQuoteLeft,
  FaComments,
  FaTag,
} from "react-icons/fa";
import { PATHS } from "../../routes/routePath";
import { canAccessAdminPath } from "../../config/rolePermissions";
import useAuth from '../hooks/useAuth';
import Logo from '../components/Logo';

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

// All dashboard child routes: use absolute path so nav works from any nested route
const DASHBOARD_BASE = "/dashboard";

export default function Sidebar({ role }) {
  const { logout } = useAuth();

  // Combine role-specific menu with common menu (absolute paths under /dashboard)
  const menuItems = [
    { path: DASHBOARD_BASE, label: "Dashboard", icon: <FaUsersCog /> },
    {
      path: `${DASHBOARD_BASE}/orders`,
      label: "Orders",
      icon: <FaShoppingCart />,
    },
    {
      path: `${DASHBOARD_BASE}/products`,
      label: "All Products",
      icon: <FaBoxes />,
    },
    {
      path: `${DASHBOARD_BASE}/${PATHS.PROMOS}`,
      label: "Promos",
      icon: <FaTag />,
      roles: ["superadmin", "admin"],
    },
    {
      path: `${DASHBOARD_BASE}/${PATHS.OFFICIAL_STORE}`,
      label: "Official Store",
      icon: <FaAward />,
    },
    {
      path: `${DASHBOARD_BASE}/reviews`,
      label: "Reviews",
      icon: <FaStar />,
    },
    {
      path: `${DASHBOARD_BASE}/${PATHS.TESTIMONIALS}`,
      label: "Testimonials",
      icon: <FaQuoteLeft />,
    },
    {
      path: `${DASHBOARD_BASE}/categories`,
      label: "Categories",
      icon: <FaChartLine />,
    },
    {
      path: `${DASHBOARD_BASE}/users`,
      label: "User Management",
      icon: <FaUsersCog />,
    },
    {
      path: `${DASHBOARD_BASE}/payment-request`,
      label: "Payment Request",
      icon: <FaChartLine />,
    },
    {
      path: `${DASHBOARD_BASE}/refunds`,
      label: "Refunds & Returns",
      icon: <FaUndo />,
    },
    {
      path: `${DASHBOARD_BASE}/balance-history`,
      label: "Balance History",
      icon: <FaWallet />,
    },
    {
      path: `${DASHBOARD_BASE}/${PATHS.SELLER_CREDIT_RECONCILIATION}`,
      label: "Credit Reconciliation",
      icon: <FaWrench />,
    },
    {
      path: `${DASHBOARD_BASE}/tax`,
      label: "Tax & VAT",
      icon: <FaFileInvoiceDollar />,
    },
    {
      path: `${DASHBOARD_BASE}/${PATHS.LIVE_CHAT}`,
      label: "Live Chat",
      icon: <FaComments />,
    },
    {
      path: `${DASHBOARD_BASE}/support`,
      label: "Support Tickets",
      icon: <FaHeadset />,
    },
    {
      path: `${DASHBOARD_BASE}/activity-logs`,
      label: "Activity Logs",
      icon: <FaHistory />,
    },
    {
      path: `${DASHBOARD_BASE}/shipping-rates`,
      label: "Shipping Activities",
      icon: <FaTruck />,
    },
    {
      path: `${DASHBOARD_BASE}/distance-overview`,
      label: "Distance Overview",
      icon: <FaMapMarkerAlt />,
    },
    {
      path: `${DASHBOARD_BASE}/coupons`,
      label: "Coupons & Discounts",
      icon: <FaTicketAlt />,
    },
    {
      path: `${DASHBOARD_BASE}/${PATHS.STATUS_VIDEOS}`,
      label: "Status Videos",
      icon: <FaVideo />,
    },
    {
      path: `${DASHBOARD_BASE}/${PATHS.SETTINGS}`,
      label: "Settings",
      icon: <FaCog />,
    },
  ];
  const handleLogout = () => {
    logout.mutate();
  };

  const visibleMenuItems = useMemo(() => {
    const allowedRoles = ["superadmin", "admin", "support_agent"];
    if (!role || !allowedRoles.includes(role)) {
      return menuItems.filter((item) => item.path === DASHBOARD_BASE);
    }
    return menuItems.filter((item) => {
      if (Array.isArray(item.roles) && !item.roles.includes(role)) {
        return false;
      }
      return canAccessAdminPath(role, item.path);
    });
  }, [role]);

  return (
    <Container>
      <SidebarHeader>
        <Logo variant="compact" />
      </SidebarHeader>
      <MenuList>
        {visibleMenuItems.map((item) => (
          <MenuItem key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <MenuIcon>{item.icon}</MenuIcon>
              {item.label}
              {item.badge && item.badge > 0 && (
                <Badge>{item.badge > 99 ? '99+' : item.badge}</Badge>
              )}
            </NavLink>
          </MenuItem>
        ))}
      </MenuList>
      <LogoutButton onClick={handleLogout}>
        <FaSignOutAlt />
        {(logout.isPending ?? logout.isLoading) ? "Logging out..." : "Logout"}
      </LogoutButton>
    </Container>
  );
}

export const NavItems = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const SidebarHeader = styled.div`
  padding: 0 var(--space-md);
  margin-bottom: var(--space-sm);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

// Sidebar Component — light surface + amber active (eazseller-aligned)
const Container = styled.aside`
  width: var(--sidebar-width);
  height: 100vh;
  min-height: 0;
  background: ${T.cardBg};
  color: ${T.text};
  border-right: 1px solid ${T.border};
  display: flex;
  flex-direction: column;
  padding: var(--space-sm) 0;
  box-shadow: ${T.shadow};
  overflow: hidden;
`;

const MenuItem = styled.li`
  a {
    color: ${T.textMuted};
    text-decoration: none;
    font-size: 1rem;
    line-height: 1.4;
    padding: 0.55rem var(--space-sm) 0.55rem var(--space-md);
    display: flex;
    align-items: center;
    gap: 0.6rem;
    transition: background var(--transition-fast), color var(--transition-fast);
    border-radius: 0 ${T.radiusSm} ${T.radiusSm} 0;
    margin-right: var(--space-xs);

    &:hover {
      background: ${T.bodyBg};
      color: ${T.text};
    }

    &.active {
      background: var(--color-primary-100);
      color: ${T.primary};
      font-weight: 600;
    }
  }
`;

const MenuIcon = styled.span`
  font-size: 1.2rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;

const Badge = styled.span`
  background: var(--error);
  color: white;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0 6px;
  margin-left: auto;
`;

const LogoutButton = styled.button`
  background: ${T.primary};
  color: #fff;
  border: none;
  padding: 0.7rem var(--space-md);
  margin: var(--space-sm);
  flex-shrink: 0;
  border-radius: ${T.radiusSm};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-primary-700);
  }
`;
