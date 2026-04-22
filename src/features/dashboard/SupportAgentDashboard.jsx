import { Link } from "react-router-dom";
import styled from "styled-components";
import { FaHeadset, FaComments, FaShoppingCart, FaHome } from "react-icons/fa";

const T = {
  primary: "var(--color-primary-600)",
  border: "var(--color-border)",
  cardBg: "var(--color-card-bg)",
  bodyBg: "var(--color-body-bg)",
  text: "var(--color-grey-900)",
  textMuted: "var(--color-grey-500)",
  radius: "var(--border-radius-xl)",
  shadow: "var(--shadow-sm)",
};

export default function SupportAgentDashboard({ admin }) {
  const displayName = admin?.name || admin?.email || "Support Agent";

  return (
    <Wrap>
      <Hero>
        <HeroEyebrow>
          <FaHeadset aria-hidden /> Support Agent workspace
        </HeroEyebrow>
        <HeroTitle>Welcome, {displayName}</HeroTitle>
        <HeroSub>
          Use the shortcuts below for tickets, live chat, and read-only order
          lookup. Other admin areas are not available for your role.
        </HeroSub>
      </Hero>

      <CardGrid>
        <Card to="/dashboard/orders">
          <CardIcon aria-hidden>
            <FaShoppingCart />
          </CardIcon>
          <CardTitle>Orders</CardTitle>
          <CardDesc>Search and view order details (read-only).</CardDesc>
        </Card>
        <Card to="/dashboard/support">
          <CardIcon aria-hidden>
            <FaHeadset />
          </CardIcon>
          <CardTitle>Support tickets</CardTitle>
          <CardDesc>View and respond to buyer and seller tickets.</CardDesc>
        </Card>
        <Card to="/dashboard/live-chat">
          <CardIcon aria-hidden>
            <FaComments />
          </CardIcon>
          <CardTitle>Live chat</CardTitle>
          <CardDesc>Answer real-time messages from buyers and sellers.</CardDesc>
        </Card>
        <Card to="/dashboard">
          <CardIcon aria-hidden>
            <FaHome />
          </CardIcon>
          <CardTitle>Dashboard home</CardTitle>
          <CardDesc>Return to this overview.</CardDesc>
        </Card>
      </CardGrid>
    </Wrap>
  );
}

const Wrap = styled.div`
  padding: 2rem;
  max-width: 960px;
  margin: 0 auto;
  min-height: 100%;
  background: ${T.bodyBg};
`;

const Hero = styled.header`
  margin-bottom: 2rem;
`;

const HeroEyebrow = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${T.primary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const HeroTitle = styled.h1`
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
  color: ${T.text};
`;

const HeroSub = styled.p`
  margin: 0;
  max-width: 40rem;
  line-height: 1.55;
  color: ${T.textMuted};
  font-size: 1rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
`;

const Card = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;
  background: ${T.cardBg};
  border: 1px solid ${T.border};
  border-radius: ${T.radius};
  padding: 1.25rem;
  box-shadow: ${T.shadow};
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
`;

const CardIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  background: var(--color-primary-100);
  color: ${T.primary};
  font-size: 1.1rem;
`;

const CardTitle = styled.h2`
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  color: ${T.text};
`;

const CardDesc = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${T.textMuted};
  line-height: 1.45;
`;
