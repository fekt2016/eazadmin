import { useState } from "react";
import styled from "styled-components";
import {
  FaAward,
  FaChartLine,
} from "react-icons/fa";
import { useOfficialStore } from "../../shared/hooks/useOfficialStore";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";

export default function OfficialStoreOverviewPage() {
  const [activeTab, setActiveTab] = useState("sellerCredits");
  const { useGetOfficialStoreAnalytics } = useOfficialStore();
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useGetOfficialStoreAnalytics({ range: 30, page: 1, limit: 5 });

  const summary = analyticsData?.summary || {};
  const recentOrders = analyticsData?.orders || [];
  const sellerCredits = analyticsData?.sellerCredits || [];
  const eazshopSellerCredits = sellerCredits.filter(
    (c) => c.face === "accepted_seller",
  );
  const eazshopMainOnlyOrders = recentOrders.filter(
    (o) =>
      Number(o.eazshopMainAmount || 0) > 0 &&
      Number(o.acceptedSellersAmount || 0) === 0,
  );

  const sellerTabOrderCount = new Set(
    eazshopSellerCredits.map((row) => row.orderId || row.orderNumber).filter(Boolean),
  ).size;
  const mainTabOrderCount = eazshopMainOnlyOrders.length;
  const activeTabOrderCount =
    activeTab === "sellerCredits" ? sellerTabOrderCount : mainTabOrderCount;
  const activeTabAmount =
    activeTab === "sellerCredits"
      ? summary.acceptedSellersAmount
      : summary.eazshopMainAmount;

  const formatGhs = (amount) => `GH₵${Number(amount || 0).toFixed(2)}`;

  return (
    <Container>
      <Intro>
        <FaAward size={32} />
        <p>
          Official Store is the company store. Here you can manage products (including
          adding seller products you approve), view orders, set shipping fees,
          and manage pickup centers.
        </p>
      </Intro>

      <AnalyticsCard>
        <AnalyticsHeader>
          <FaChartLine />
          <h3>Official Store Analytics (Last 30 days)</h3>
        </AnalyticsHeader>

        {analyticsLoading ? (
          <LoadingArea>
            <LoadingSpinner />
          </LoadingArea>
        ) : analyticsError ? (
          <ErrorText>
            Failed to load analytics: {analyticsError?.message || "Please retry"}
          </ErrorText>
        ) : (
          <>
            <StatRow>
              <Stat>
                <StatLabel>
                  {activeTab === "sellerCredits"
                    ? "Credited seller orders"
                    : "Credited EazShop main orders"}
                </StatLabel>
                <StatValue>{activeTabOrderCount}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>
                  {activeTab === "sellerCredits"
                    ? "Credited to EazShop sellers"
                    : "Credited to EazShop main"}
                </StatLabel>
                <StatValue>{formatGhs(activeTabAmount)}</StatValue>
              </Stat>
            </StatRow>

            <TabsHeader role="tablist" aria-label="Official Store analytics tabs">
              <TabButton
                type="button"
                role="tab"
                aria-selected={activeTab === "sellerCredits"}
                tabIndex={activeTab === "sellerCredits" ? 0 : -1}
                $active={activeTab === "sellerCredits"}
                onClick={() => setActiveTab("sellerCredits")}
              >
                EazShop sellers by order
              </TabButton>
              <TabButton
                type="button"
                role="tab"
                aria-selected={activeTab === "eazshopOrders"}
                tabIndex={activeTab === "eazshopOrders" ? 0 : -1}
                $active={activeTab === "eazshopOrders"}
                onClick={() => setActiveTab("eazshopOrders")}
              >
                EazShop credited orders
              </TabButton>
            </TabsHeader>

            {activeTab === "sellerCredits" ? (
              <RecentTable>
                <thead>
                  <tr>
                    <th colSpan={5}>EazShop sellers by order</th>
                  </tr>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Face</th>
                    <th>Credited seller</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {eazshopSellerCredits.length === 0 ? (
                    <tr>
                      <EmptyCell colSpan={5}>No EazShop seller credits found.</EmptyCell>
                    </tr>
                  ) : (
                    eazshopSellerCredits.map((c) => (
                      <tr
                        key={`${c.orderId || c.orderNumber}-${c.sellerId || c.sellerName}-${c.amount}`}
                      >
                        <td>{c.orderNumber || "—"}</td>
                        <td>
                          {c.date ? new Date(c.date).toLocaleString() : "—"}
                        </td>
                        <td>
                          {c.face === "eazshop_main"
                            ? "EazShop main"
                            : "EazShop seller"}
                        </td>
                        <td>
                          {c.sellerName ||
                            (c.face === "eazshop_main" ? "EazShop" : "—")}
                        </td>
                        <td>{formatGhs(c.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </RecentTable>
            ) : (
              <RecentTable>
                <thead>
                  <tr>
                    <th colSpan={5}>EazShop main credited orders</th>
                  </tr>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>EazShop main</th>
                    <th>EazShop sellers</th>
                    <th>Total credited</th>
                  </tr>
                </thead>
                <tbody>
                  {eazshopMainOnlyOrders.length === 0 ? (
                    <tr>
                      <EmptyCell colSpan={5}>No EazShop main credited orders found.</EmptyCell>
                    </tr>
                  ) : (
                    eazshopMainOnlyOrders.map((o) => (
                      <tr key={o.orderId || o.orderNumber}>
                        <td>{o.orderNumber || "—"}</td>
                        <td>{o.date ? new Date(o.date).toLocaleString() : "—"}</td>
                        <td>{formatGhs(o.eazshopMainAmount)}</td>
                        <td>{formatGhs(o.acceptedSellersAmount)}</td>
                        <td>{formatGhs(o.totalCredited)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </RecentTable>
            )}
          </>
        )}
      </AnalyticsCard>

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

const AnalyticsCard = styled.div`
  background: white;
  border: 1px solid var(--color-grey-200, #e5e7eb);
  border-radius: 12px;
  padding: 1.25rem;
`;

const AnalyticsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
  }

  svg {
    color: var(--color-primary, #2563eb);
    font-size: 1.25rem;
  }
`;

const LoadingArea = styled.div`
  padding: 1rem 0;
  display: flex;
  justify-content: center;
`;

const ErrorText = styled.p`
  margin: 0.5rem 0;
  color: #e74c3c;
  font-size: 0.875rem;
`;

const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Stat = styled.div`
  background: var(--color-grey-50, #f9fafb);
  border: 1px solid var(--color-grey-200, #e5e7eb);
  border-radius: 10px;
  padding: 0.75rem 1rem;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: var(--color-grey-600, #4b5563);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.35rem;
`;

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-grey-900, #111827);
`;

const RecentTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;

  th {
    text-align: left;
    padding: 0.6rem 0.5rem;
    background: var(--color-grey-50, #f9fafb);
    border-top: 1px solid var(--color-grey-200, #e5e7eb);
  }

  td {
    padding: 0.6rem 0.5rem;
    border-top: 1px solid var(--color-grey-200, #e5e7eb);
  }
`;

const EmptyCell = styled.td`
  text-align: center;
  padding: 1rem;
`;

const TabsHeader = styled.div`
  display: flex;
  gap: 0.75rem;
  border-bottom: 1px solid var(--color-grey-200, #e5e7eb);
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
`;

const TabButton = styled.button`
  appearance: none;
  border: 1px solid var(--color-grey-200, #e5e7eb);
  background: ${(p) => (p.$active ? "var(--color-primary, #2563eb)" : "white")};
  color: ${(p) => (p.$active ? "white" : "var(--color-grey-800, #374151)")};
  border-radius: 10px;
  padding: 0.55rem 0.9rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;

  &:hover {
    border-color: var(--color-primary, #2563eb);
  }
`;

