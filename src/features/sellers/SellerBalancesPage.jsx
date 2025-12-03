import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaStore, FaMoneyBillWave, FaLock, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import useSellerAdmin from "../../shared/hooks/useSellerAdmin";
import { PATHS } from "../../routes/routePaths";

const SellerBalancesPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { sellers, isSellerLoading, totalSellers, meta, setSearchValue, searchValue, sort, setSort } = useSellerAdmin(page, limit);

  const sellersList = useMemo(() => sellers?.results || [], [sellers]);

  const handleSort = (field) => {
    const [currentField, currentOrder] = sort.split(":");
    let newOrder = "desc";
    if (currentField === field) {
      newOrder = currentOrder === "desc" ? "asc" : "desc";
    }
    setSort(`${field}:${newOrder}`);
    setPage(1);
  };

  const formatCurrency = (amount) => {
    return `₵${(amount || 0).toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "#10b981", bg: "#d1fae5", icon: FaCheckCircle },
      inactive: { color: "#ef4444", bg: "#fee2e2", icon: FaTimesCircle },
      pending: { color: "#f59e0b", bg: "#fef3c7", icon: FaClock },
    };
    const config = statusConfig[status?.toLowerCase()] || statusConfig.inactive;
    const Icon = config.icon;
    return (
      <StatusBadge $status={status}>
        <Icon style={{ marginRight: "0.5rem" }} />
        {status?.toUpperCase() || "INACTIVE"}
      </StatusBadge>
    );
  };

  const totalPages = meta?.totalPages || 1;

  if (isSellerLoading) {
    return (
      <Container>
        <Loading>Loading seller balances...</Loading>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaMoneyBillWave style={{ marginRight: "0.75rem" }} />
          Seller Balances
        </Title>
        <Description>View and manage all seller account balances</Description>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatIcon style={{ background: "#3b82f620", color: "#3b82f6" }}>
            <FaStore />
          </StatIcon>
          <StatInfo>
            <StatValue>{totalSellers}</StatValue>
            <StatLabel>Total Sellers</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon style={{ background: "#10b98120", color: "#10b981" }}>
            <FaMoneyBillWave />
          </StatIcon>
          <StatInfo>
            <StatValue>
              {formatCurrency(
                sellersList.reduce((sum, s) => sum + (s.balance || 0), 0)
              )}
            </StatValue>
            <StatLabel>Total Revenue</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon style={{ background: "#f59e0b20", color: "#f59e0b" }}>
            <FaLock />
          </StatIcon>
          <StatInfo>
            <StatValue>
              {formatCurrency(
                sellersList.reduce((sum, s) => sum + (s.lockedBalance || 0), 0)
              )}
            </StatValue>
            <StatLabel>Total Locked</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon style={{ background: "#8b5cf620", color: "#8b5cf6" }}>
            <FaClock />
          </StatIcon>
          <StatInfo>
            <StatValue>
              {formatCurrency(
                sellersList.reduce((sum, s) => sum + (s.pendingBalance || 0), 0)
              )}
            </StatValue>
            <StatLabel>Total Pending</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon style={{ background: "#06b6d420", color: "#06b6d4" }}>
            <FaCheckCircle />
          </StatIcon>
          <StatInfo>
            <StatValue>
              {formatCurrency(
                sellersList.reduce((sum, s) => sum + (s.withdrawableBalance || 0), 0)
              )}
            </StatValue>
            <StatLabel>Total Available</StatLabel>
          </StatInfo>
        </StatCard>
      </StatsGrid>

      <FiltersContainer>
        <SearchInput
          type="text"
          placeholder="Search by name, shop name, or email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </FiltersContainer>

      <TableContainer>
        <Table>
          <thead>
            <TableRow>
              <TableHeader onClick={() => handleSort("shopName")}>
                Seller / Store
                {sort.startsWith("shopName") && (
                  <SortIndicator>{sort.includes(":desc") ? "↓" : "↑"}</SortIndicator>
                )}
              </TableHeader>
              <TableHeader onClick={() => handleSort("balance")}>
                Total Revenue
                {sort.startsWith("balance") && (
                  <SortIndicator>{sort.includes(":desc") ? "↓" : "↑"}</SortIndicator>
                )}
              </TableHeader>
              <TableHeader onClick={() => handleSort("lockedBalance")}>
                Locked Balance
                {sort.startsWith("lockedBalance") && (
                  <SortIndicator>{sort.includes(":desc") ? "↓" : "↑"}</SortIndicator>
                )}
              </TableHeader>
              <TableHeader onClick={() => handleSort("pendingBalance")}>
                Pending Balance
                {sort.startsWith("pendingBalance") && (
                  <SortIndicator>{sort.includes(":desc") ? "↓" : "↑"}</SortIndicator>
                )}
              </TableHeader>
              <TableHeader onClick={() => handleSort("withdrawableBalance")}>
                Available Balance
                {sort.startsWith("withdrawableBalance") && (
                  <SortIndicator>{sort.includes(":desc") ? "↓" : "↑"}</SortIndicator>
                )}
              </TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </thead>
          <tbody>
            {sellersList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                  No sellers found
                </TableCell>
              </TableRow>
            ) : (
              sellersList.map((seller) => (
                <TableRow key={seller._id || seller.id}>
                  <TableCell>
                    <SellerInfo>
                      <SellerName>{seller.name || "N/A"}</SellerName>
                      <SellerShop>{seller.shopName || "No shop name"}</SellerShop>
                      <SellerEmail>{seller.email || ""}</SellerEmail>
                    </SellerInfo>
                  </TableCell>
                  <TableCell>
                    <BalanceAmount $type="total">{formatCurrency(seller.balance)}</BalanceAmount>
                  </TableCell>
                  <TableCell>
                    <BalanceAmount $type="locked">{formatCurrency(seller.lockedBalance)}</BalanceAmount>
                  </TableCell>
                  <TableCell>
                    <BalanceAmount $type="pending">{formatCurrency(seller.pendingBalance)}</BalanceAmount>
                  </TableCell>
                  <TableCell>
                    <BalanceAmount $type="available">{formatCurrency(seller.withdrawableBalance)}</BalanceAmount>
                  </TableCell>
                  <TableCell>{getStatusBadge(seller.status)}</TableCell>
                  <TableCell>
                    <ActionButton
                      onClick={() => navigate(`/dashboard/sellers/detail/${seller._id || seller.id}`)}
                    >
                      View Details
                    </ActionButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Pagination>
          <PaginationButton
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </PaginationButton>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <PaginationButton
                key={pageNum}
                $active={page === pageNum}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </PaginationButton>
            );
          })}
          {totalPages > 5 && (
            <PageInfo>
              Page {page} of {totalPages}
            </PageInfo>
          )}
          <PaginationButton
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </PaginationButton>
          <ItemsPerPageSelect
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </ItemsPerPageSelect>
        </Pagination>
      )}
    </Container>
  );
};

export default SellerBalancesPage;

// Styled Components
const Container = styled.div`
  padding: 2rem;
  background-color: #f5f7fb;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  color: #64748b;
  font-size: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StatIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const FiltersContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;
  &:hover {
    background-color: #f8fafc;
  }
  &:last-child {
    border-bottom: none;
  }
`;

const TableHeader = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #1e293b;
  background-color: #f8fafc;
  cursor: pointer;
  user-select: none;
  position: relative;
  &:hover {
    background-color: #f1f5f9;
  }
`;

const SortIndicator = styled.span`
  margin-left: 0.5rem;
  color: #3b82f6;
`;

const TableCell = styled.td`
  padding: 1rem;
  color: #475569;
`;

const SellerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SellerName = styled.div`
  font-weight: 600;
  color: #1e293b;
`;

const SellerShop = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const SellerEmail = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
`;

const BalanceAmount = styled.div`
  font-weight: 600;
  color: ${(props) => {
    if (props.$type === "total") return "#1e293b";
    if (props.$type === "locked") return "#f59e0b";
    if (props.$type === "pending") return "#8b5cf6";
    if (props.$type === "available") return "#10b981";
    return "#1e293b";
  }};
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: ${(props) => {
    const status = props.$status?.toLowerCase();
    if (status === "active") return "#d1fae5";
    if (status === "pending") return "#fef3c7";
    return "#fee2e2";
  }};
  color: ${(props) => {
    const status = props.$status?.toLowerCase();
    if (status === "active") return "#10b981";
    if (status === "pending") return "#f59e0b";
    return "#ef4444";
  }};
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #2563eb;
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background-color: ${(props) => (props.$active ? "#3b82f6" : "white")};
  color: ${(props) => (props.$active ? "white" : "#475569")};
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background-color: ${(props) => (props.$active ? "#2563eb" : "#f1f5f9")};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  padding: 0.5rem 1rem;
  color: #64748b;
  font-size: 0.875rem;
`;

const ItemsPerPageSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: white;
  color: #475569;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-size: 1.125rem;
`;

