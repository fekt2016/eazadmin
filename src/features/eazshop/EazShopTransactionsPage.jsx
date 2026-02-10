import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { FaHistory } from "react-icons/fa";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import api from "../../shared/services/api";

export default function EazShopTransactionsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, isLoading, error } = useQuery({
    queryKey: ["eazshop-transactions", page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        // Only fetch ORDER_EARNING and related revenue history
        type: "ORDER_EARNING",
      });

      const response = await api.get(`/admin/revenue-history?${params}`);
      return response.data;
    },
  });

  const rawHistory = data?.data?.history || [];
  // Show only entries that belong to EazShop platform store (platformStore flag in metadata)
  const history = rawHistory.filter((item) => item?.metadata?.platformStore === true);

  const pagination = {
    ...(data?.pagination || {}),
    total: history.length,
    // Keep page/pages from server but counts reflect filtered EazShop entries
  };

  const formatCurrency = (amount) => `GH₵${Number(amount || 0).toFixed(2)}`;

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getTypeLabel = (type) => {
    const labels = {
      ORDER_EARNING: "Order Earning",
      REFUND_DEDUCTION: "Refund Deduction",
      PAYOUT: "Payout",
      ADMIN_ADJUST: "Admin Adjustment",
      CORRECTION: "Correction",
      REVERSAL: "Reversal",
      WITHDRAWAL_CREATED: "Withdrawal Created",
      WITHDRAWAL_REFUNDED: "Withdrawal Refunded",
      WITHDRAWAL_FAILED: "Withdrawal Failed",
      WITHDRAWAL_PAID: "Withdrawal Paid",
      OTP_EXPIRED: "OTP Expired",
      OTP_FAILED: "OTP Failed",
      PAYOUT_ABANDONED: "Payout Abandoned",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorBox>
          <h3>Failed to load EazShop transactions</h3>
          <p>{error.message || "Please try again later."}</p>
        </ErrorBox>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <Title>
          <FaHistory />
          <h2>EazShop Transactions</h2>
        </Title>
        <Subtitle>
          All revenue transactions for the EazShop company store (credits and debits).
        </Subtitle>
      </Header>

      <StatsCard>
        <StatItem>
          <StatLabel>Total Records</StatLabel>
          <StatValue>{pagination.total || 0}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Current Page</StatLabel>
          <StatValue>
            {pagination.page || 1} / {pagination.pages || 1}
          </StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Showing</StatLabel>
          <StatValue>
            {history.length} of {pagination.total || 0}
          </StatValue>
        </StatItem>
      </StatsCard>

      <TableCard>
        <Table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance Before</th>
              <th>Balance After</th>
              <th>Description</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                  No EazShop transactions found
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item._id}>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>{getTypeLabel(item.type)}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{formatCurrency(item.balanceBefore)}</td>
                  <td>
                    <strong>{formatCurrency(item.balanceAfter)}</strong>
                  </td>
                  <td>{item.description}</td>
                  <td>
                    <Reference>{item.reference || "N/A"}</Reference>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableCard>

      {pagination.pages > 1 && (
        <Pagination>
          <PaginationButton
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.page === 1}
          >
            Previous
          </PaginationButton>
          <PageInfo>
            Page {pagination.page} of {pagination.pages}
          </PageInfo>
          <PaginationButton
            onClick={() =>
              setPage((p) => Math.min(pagination.pages || 1, p + 1))
            }
            disabled={pagination.page === pagination.pages}
          >
            Next
          </PaginationButton>
        </Pagination>
      )}
    </PageContainer>
  );
}

const PageContainer = styled.div`
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  svg {
    font-size: 1.25rem;
    color: var(--color-primary-600, #2563eb);
  }
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-grey-600, #4b5563);
`;

const StatsCard = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background: var(--color-grey-50, #f9fafb);
  border: 1px solid var(--color-grey-200, #e5e7eb);
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatLabel = styled.span`
  font-size: 0.75rem;
  color: var(--color-grey-500, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-grey-900, #111827);
`;

const TableCard = styled.div`
  border-radius: 12px;
  border: 1px solid var(--color-grey-200, #e5e7eb);
  background: white;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;

  thead {
    background: var(--color-grey-50, #f9fafb);
  }

  th,
  td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--color-grey-100, #f3f4f6);
  }

  th {
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-grey-500, #6b7280);
  }

  tbody tr:hover {
    background: var(--color-grey-50, #f9fafb);
  }
`;

const Reference = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--color-grey-600, #4b5563);
  word-break: break-all;
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--color-grey-300, #d1d5db);
  background: white;
  font-size: 0.875rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const PageInfo = styled.span`
  font-size: 0.875rem;
  color: var(--color-grey-600, #4b5563);
`;

const ErrorBox = styled.div`
  padding: 1.5rem;
  border-radius: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;

  h3 {
    margin: 0 0 0.5rem 0;
    color: #b91c1c;
  }

  p {
    margin: 0;
    color: #7f1d1d;
  }
`;

