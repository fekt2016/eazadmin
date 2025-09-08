import { useState } from "react";
import styled from "styled-components";
import useSellerAdmin from "../hook/useSellerAdmin";
import SellerDetailsModal from "../components/Modal/sellerDetailsModal";

const SellerRequests = () => {
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [loadingSellerId, setLoadingSellerId] = useState(null);

  const {
    sellers,
    setPage,
    meta,
    isSellerLoading,
    page,
    setSort,
    sort,
    searchValue, // From hook
    setSearchValue,
  } = useSellerAdmin();

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    // Reset to first page when searching
  };
  // console.log("meta:", sellerMeta);
  const handleOpenDetails = (seller) => {
    setLoadingSellerId(seller._id);
    setSelectedSeller(seller);
    setLoadingSellerId(null);
  };
  const handleCloseDetails = () => {
    setSelectedSeller(null);
  };
  const handleSortChange = (field) => {
    const [currentField, currentOrder] = sort.split(":");

    let newOrder = "desc";

    if (currentField === field) {
      newOrder = currentOrder === "asc" ? "desc" : "asc";
    }

    setSort(`${field}:${newOrder}`);
    setPage(1); // Reset to first page when sorting
  };

  const sellersList = sellers?.data?.results || [];

  if (!sellersList || sellersList.length === 0) {
    if (isSellerLoading) return <Loading>Loading sellers...</Loading>;
    return <NoResults>No pending seller requests found</NoResults>;
  }

  return (
    <Container>
      <FiltersContainer>
        <SearchInput
          type="text"
          placeholder="Search by name or shop..."
          value={searchValue}
          onChange={handleSearchChange}
        />
        <SortContainer>
          <SortLabel>Sort by:</SortLabel>
          <SortButton
            active={sort.startsWith("createdAt")}
            onClick={() => handleSortChange("createdAt")}
          >
            Date {sort === "createdAt:asc" ? "↑" : "↓"}
          </SortButton>
          <SortButton
            active={sort.startsWith("name")}
            onClick={() => handleSortChange("name")}
          >
            Name {sort === "name:asc" ? "↑" : "↓"}
          </SortButton>
          <SortButton
            active={sort.startsWith("shopName")}
            onClick={() => handleSortChange("shopName")}
          >
            Shop {sort === "shopName:asc" ? "↑" : "↓"}
          </SortButton>
        </SortContainer>
      </FiltersContainer>
      <Table>
        <thead>
          <TableRow>
            <TableHeader>No</TableHeader>
            <TableHeader>Date Registered</TableHeader>
            <TableHeader>Seller Name</TableHeader>
            <TableHeader>Shop Name</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableRow>
        </thead>
        <tbody>
          {sellersList.map((seller, index) => (
            <TableRow key={seller._id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                {new Date(seller.createdAt).toLocaleDateString("en-GB")}
              </TableCell>
              <TableCell>{seller.name}</TableCell>
              <TableCell>{seller.shopName}</TableCell>
              <TableCell>
                <StatusBadge status={seller.status}>
                  {seller.status.toUpperCase()}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <ActionGroup>
                  <ActionButton
                    variant="info"
                    onClick={() => handleOpenDetails(seller)}
                  >
                    {loadingSellerId ? "...loading" : "View Details"}
                  </ActionButton>
                </ActionGroup>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {meta.totalPages > 1 && (
        <PaginationContainer>
          {Array.from({ length: meta.totalPages }, (_, i) => (
            <PageButton
              key={i + 1}
              onClick={() => setPage(i + 1)}
              active={page === i + 1}
            >
              {i + 1}
            </PageButton>
          ))}
        </PaginationContainer>
      )}
      {selectedSeller && (
        <SellerDetailsModal
          seller={selectedSeller}
          onClose={handleCloseDetails}
        />
      )}
    </Container>
  );
};

export default SellerRequests;

// Styled Components
const Container = styled.div`
  padding: 2rem;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Loading = styled.div`
  padding: 2rem;
  text-align: center;
  color: #666;
`;

const NoResults = styled.div`
  padding: 2rem;
  text-align: center;
  color: #666;
  border: 1px solid #eee;
  border-radius: 8px;
  margin: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.9rem;
`;

const TableHeader = styled.th`
  padding: 1rem;
  text-align: left;
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f8f9fa;
  }
  &:hover {
    background-color: #f1f3f5;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: ${(props) => {
    switch (props.status) {
      case "active":
        return "#d4edda";
      case "deactive":
        return "#f8d7da";
      default:
        return "#fff3cd";
    }
  }};
  color: ${(props) => {
    switch (props.status) {
      case "active":
        return "#155724";
      case "deactive":
        return "#721c24";
      default:
        return "#856404";
    }
  }};
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  margin: 0 0.25rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  background-color: ${(props) =>
    props.variant === "success"
      ? "#28a745"
      : props.variant === "danger"
      ? "#dc3545"
      : "#ffc107"};
  color: white;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 2rem 0 1rem;
  gap: 0.5rem;
`;

const PageButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background-color: ${(props) => (props.active ? "#007bff" : "white")};
  color: ${(props) => (props.active ? "white" : "#495057")};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.active ? "#0069d9" : "#f8f9fa")};
  }
`;
const FiltersContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
`;
const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 300px;
  font-size: 1rem;
`;
const SortContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const SortLabel = styled.span`
  color: #666;
`;

const SortButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${(props) => (props.active ? "#007bff" : "#ddd")};
  border-radius: 4px;
  background: ${(props) => (props.active ? "#007bff20" : "white")};
  color: ${(props) => (props.active ? "#007bff" : "#666")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #007bff;
    color: #007bff;
  }
`;
