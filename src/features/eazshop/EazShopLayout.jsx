import { Outlet, NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  FaAward,
  FaBoxes,
  FaShoppingCart,
  FaTruck,
  FaMapMarkerAlt,
  FaHistory,
} from "react-icons/fa";
import { PATHS } from "../../routes/routhPath";

const DASHBOARD_BASE = "/dashboard";

const navItems = [
  { path: "", label: "Overview", icon: <FaAward /> },
  { path: "products", label: "Products", icon: <FaBoxes /> },
  { path: "orders", label: "Orders", icon: <FaShoppingCart /> },
  { path: "shipping-fees", label: "Shipping", icon: <FaTruck /> },
  { path: "pickup-centers", label: "Pickup Centers", icon: <FaMapMarkerAlt /> },
  { path: "transactions", label: "Transactions", icon: <FaHistory /> },
];

export default function EazShopLayout() {
  const location = useLocation();
  const basePath = `${DASHBOARD_BASE}/${PATHS.EAZSHOP}`;

  return (
    <Container>
      <SectionHeader>
        <Title>
          <FaAward /> Saiisai Store
        </Title>
        <Subtitle>Company store: products, orders, shipping, pickup & transactions</Subtitle>
      </SectionHeader>

      <SubNav>
        {navItems.map((item) => {
          const to = item.path ? `${basePath}/${item.path}` : basePath;
          const isActive =
            item.path === ""
              ? location.pathname === basePath
              : location.pathname.startsWith(to);
          return (
            <SubNavLink
              key={item.path || "overview"}
              to={to}
              className={isActive ? "active" : ""}
            >
              <NavIcon>{item.icon}</NavIcon>
              {item.label}
            </SubNavLink>
          );
        })}
      </SubNav>

      <Content>
        <Outlet />
      </Content>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const SectionHeader = styled.div`
  margin-bottom: 0.25rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-grey-900, #111);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: var(--color-grey-600, #4b5563);
  margin: 0.25rem 0 0 0;
`;

const SubNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-grey-200, #e5e7eb);
`;

const SubNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-grey-600, #4b5563);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: var(--color-grey-100, #f3f4f6);
    color: var(--color-grey-900, #111);
  }

  &.active {
    background: var(--color-primary, #2563eb);
    color: white;
  }
`;

const NavIcon = styled.span`
  font-size: 1rem;
  display: flex;
`;

const Content = styled.div`
  flex: 1;
  min-height: 0;
`;
