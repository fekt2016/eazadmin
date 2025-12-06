import { Link } from "react-router-dom";
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
  FaDesktop,
  FaUndo,
  FaWallet,
  FaHeadset,
  FaBell,
  FaTicketAlt,
} from "react-icons/fa";
import useAuth from '../hooks/useAuth';
import Logo from '../components/Logo';
import { useUnreadCount } from '../hooks/notifications/useNotifications';

export default function Sidebar({ role }) {
  const { logout } = useAuth();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.data?.unreadCount || 0;

  // Combine role-specific menu with common menu
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: <FaUsersCog /> },
    {
      path: "orders",
      label: "Orders",
      icon: <FaShoppingCart />,
    },
    {
      path: "products",
      label: "All Products",
      icon: <FaBoxes />,
    },
    {
      path: "eazshop/products",
      label: "EazShop Products",
      icon: <FaAward />,
    },
    {
      path: "reviews",
      label: "Reviews",
      icon: <FaStar />,
    },
    {
      path: "categories",
      label: "Categories",
      icon: <FaChartLine />,
    },
    {
      path: "users",
      label: "User Management",
      icon: <FaUsersCog />,
    },
    {
      path: "payment-request",
      label: "Payment Request",
      icon: <FaChartLine />,
    },
    {
      path: "refunds",
      label: "Refunds & Returns",
      icon: <FaUndo />,
    },
    {
      path: "balance-history",
      label: "Balance History",
      icon: <FaWallet />,
    },
    {
      path: "seller-request",
      label: "Seller Request",
      icon: <FaUsersCog />,
    },
    {
      path: "support",
      label: "Support",
      icon: <FaHeadset />,
    },
    {
      path: "chat-support",
      label: "Live Chat",
      icon: <FaUsersCog />,
    },
    {
      path: "activity-logs",
      label: "Activity Logs",
      icon: <FaHistory />,
    },
    {
      path: "device-sessions",
      label: "Device Sessions",
      icon: <FaDesktop />,
    },
    {
      path: "shipping-rates",
      label: "Shipping Rates",
      icon: <FaTruck />,
    },
    {
      path: "distance-overview",
      label: "Distance Overview",
      icon: <FaMapMarkerAlt />,
    },
    {
      path: "platform-settings",
      label: "Platform Settings",
      icon: <FaCog />,
    },
    {
      path: "notifications",
      label: "Notifications",
      icon: <FaBell />,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      path: "coupons",
      label: "Coupons & Discounts",
      icon: <FaTicketAlt />,
    },
  ];
  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <Container>
      <SidebarHeader>
        <Logo variant="compact" />
      </SidebarHeader>
      <MenuList>
        {menuItems.map((item) => (
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
        {logout.isloading ? "Logging out..." : "Logout"}
      </LogoutButton>
    </Container>
  );
}

// Theme variables

// Header Component

export const NavItems = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const theme = {
  primaryColor: "#2563eb",
  secondaryColor: "#1e40af",
  textColor: "#1f2937",
  lightText: "#6b7280",
  sidebarWidth: "240px",
  headerHeight: "64px",
  borderRadius: "8px",
  transition: "all 0.3s ease",
};

// Sidebar Component
const Container = styled.aside`
  width: ${theme.sidebarWidth};
  height: 100%;
  background: ${theme.primaryColor};
  color: white;
  /* position: fixed;
  top: 0;
  left: 0; */
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
`;
const NavLink = styled(Link)`
  color: ${theme.lightText};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: ${theme.transition};

  &:hover {
    color: ${theme.primaryColor};
  }

  &.active {
    color: ${theme.primaryColor};
    font-weight: 500;
  }
`;

const SidebarHeader = styled.div`
  padding: 0 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
`;

const MenuItem = styled.li`
  a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: ${theme.transition};

    &:hover {
      background: ${theme.secondaryColor};
      color: white;
    }

    &.active {
      background: ${theme.secondaryColor};
      color: white;
      border-left: 4px solid white;
    }
  }
`;

const MenuIcon = styled.span`
  font-size: 1.2rem;
  display: flex;
`;

const Badge = styled.span`
  background: #ef4444;
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
  background: ${theme.secondaryColor};
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  margin: 1rem;
  border-radius: ${theme.borderRadius};
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: ${theme.transition};

  &:hover {
    background: #1e3a8a;
  }
`;
