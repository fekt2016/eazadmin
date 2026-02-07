import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  FaAward,
  FaBoxes,
  FaShoppingCart,
  FaTruck,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { PATHS } from "../../routes/routhPath";

const DASHBOARD_BASE = "/dashboard";
const basePath = `${DASHBOARD_BASE}/${PATHS.EAZSHOP}`;

const cards = [
  {
    to: `${basePath}/products`,
    label: "Products",
    description: "Manage EazShop products, add new items, mark seller products.",
    icon: <FaBoxes />,
  },
  {
    to: `${basePath}/orders`,
    label: "Orders",
    description: "View and manage EazShop orders.",
    icon: <FaShoppingCart />,
  },
  {
    to: `${basePath}/shipping-fees`,
    label: "Shipping",
    description: "Configure shipping fees and free delivery threshold.",
    icon: <FaTruck />,
  },
  {
    to: `${basePath}/pickup-centers`,
    label: "Pickup Centers",
    description: "Manage pickup center locations.",
    icon: <FaMapMarkerAlt />,
  },
];

export default function EazShopOverviewPage() {
  return (
    <Container>
      <Intro>
        <FaAward size={32} />
        <p>
          EazShop is the company store. Here you can manage products (including
          adding seller products you approve), view orders, set shipping fees,
          and manage pickup centers.
        </p>
      </Intro>
      <CardGrid>
        {cards.map((card) => (
          <Card key={card.to} to={card.to}>
            <CardIcon>{card.icon}</CardIcon>
            <CardTitle>{card.label}</CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </Card>
        ))}
      </CardGrid>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Intro = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-grey-50, #f9fafb);
  border-radius: 12px;
  color: var(--color-grey-700, #374151);

  p {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.5;
  }

  svg {
    flex-shrink: 0;
    color: var(--color-primary, #2563eb);
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
`;

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: white;
  border: 1px solid var(--color-grey-200, #e5e7eb);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s, border-color 0.2s;

  &:hover {
    border-color: var(--color-primary, #2563eb);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
  }
`;

const CardIcon = styled.div`
  font-size: 1.75rem;
  color: var(--color-primary, #2563eb);
  margin-bottom: 0.75rem;
`;

const CardTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--color-grey-900, #111);
`;

const CardDescription = styled.p`
  font-size: 0.875rem;
  color: var(--color-grey-600, #4b5563);
  margin: 0;
  line-height: 1.4;
`;
