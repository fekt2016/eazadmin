import { useState, useEffect } from "react";
import styled from "styled-components";

// Mock data - replace with API calls in a real application
const mockLogs = [
  {
    id: 1,
    timestamp: "2023-05-15T14:30:00Z",
    user: "vendor1@example.com",
    action: "PRODUCT_CREATE",
    target: "Premium Headphones",
    ip: "192.168.1.5",
    vendor: "Electronics Inc",
  },
  {
    id: 2,
    timestamp: "2023-05-15T12:15:00Z",
    user: "admin@ecom.com",
    action: "USER_UPDATE",
    target: "vendor1@example.com",
    ip: "203.0.113.42",
    vendor: "System Admin",
  },
  {
    id: 3,
    timestamp: "2023-05-14T09:45:00Z",
    user: "vendor2@example.com",
    action: "ORDER_UPDATE",
    target: "Order #15342",
    ip: "198.51.100.22",
    vendor: "Fashion Hub",
  },
  {
    id: 4,
    timestamp: "2023-05-13T16:20:00Z",
    user: "vendor1@example.com",
    action: "INVENTORY_UPDATE",
    target: "Wireless Charger",
    ip: "192.168.1.5",
    vendor: "Electronics Inc",
  },
  {
    id: 5,
    timestamp: "2023-05-12T11:30:00Z",
    user: "admin@ecom.com",
    action: "SETTINGS_UPDATE",
    target: "Payment Gateway",
    ip: "203.0.113.42",
    vendor: "System Admin",
  },
];

const actionTypes = [
  "ALL",
  "PRODUCT_CREATE",
  "PRODUCT_UPDATE",
  "ORDER_UPDATE",
  "USER_UPDATE",
  "INVENTORY_UPDATE",
  "SETTINGS_UPDATE",
];

export default function UsersActivityPage() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    actionType: "ALL",
    vendor: "ALL",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Simulate API fetch
    setLogs(mockLogs);
    setFilteredLogs(mockLogs);
  }, []);

  useEffect(() => {
    let result = [...logs];

    // Apply filters
    if (filters.actionType !== "ALL") {
      result = result.filter((log) => log.action === filters.actionType);
    }

    if (filters.vendor !== "ALL") {
      result = result.filter((log) => log.vendor === filters.vendor);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (log) =>
          log.user.toLowerCase().includes(searchLower) ||
          log.target.toLowerCase().includes(searchLower) ||
          log.ip.includes(searchLower)
      );
    }

    setFilteredLogs(result);
    setCurrentPage(1);
  }, [filters, logs]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getActionLabel = (action) => {
    const labels = {
      PRODUCT_CREATE: "Product Created",
      PRODUCT_UPDATE: "Product Updated",
      ORDER_UPDATE: "Order Updated",
      USER_UPDATE: "User Updated",
      INVENTORY_UPDATE: "Inventory Updated",
      SETTINGS_UPDATE: "Settings Updated",
    };
    return labels[action] || action;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Container>
      <Header>
        <Title>Activity Logs</Title>
        <Description>
          Track all system activities and vendor actions
        </Description>
      </Header>

      <FiltersContainer>
        <FilterGroup>
          <FilterLabel>Action Type:</FilterLabel>
          <FilterSelect
            name="actionType"
            value={filters.actionType}
            onChange={handleFilterChange}
          >
            {actionTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Vendor:</FilterLabel>
          <FilterSelect
            name="vendor"
            value={filters.vendor}
            onChange={handleFilterChange}
          >
            <option value="ALL">All Vendors</option>
            <option value="Electronics Inc">Electronics Inc</option>
            <option value="Fashion Hub">Fashion Hub</option>
            <option value="System Admin">System Admin</option>
          </FilterSelect>
        </FilterGroup>

        <SearchInput
          type="text"
          name="search"
          placeholder="Search user, target or IP..."
          value={filters.search}
          onChange={handleFilterChange}
        />
      </FiltersContainer>

      <LogsTable>
        <TableHeader>
          <HeaderRow>
            <HeaderCell>Timestamp</HeaderCell>
            <HeaderCell>User</HeaderCell>
            <HeaderCell>Action</HeaderCell>
            <HeaderCell>Target</HeaderCell>
            <HeaderCell>Vendor</HeaderCell>
            <HeaderCell>IP Address</HeaderCell>
          </HeaderRow>
        </TableHeader>
        <TableBody>
          {currentLogs.length > 0 ? (
            currentLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{formatDate(log.timestamp)}</TableCell>
                <TableCell>{log.user}</TableCell>
                <TableCell>
                  <ActionBadge action={log.action}>
                    {getActionLabel(log.action)}
                  </ActionBadge>
                </TableCell>
                <TableCell>{log.target}</TableCell>
                <TableCell>{log.vendor}</TableCell>
                <TableCell>{log.ip}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="6" style={{ textAlign: "center" }}>
                No activity logs found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </LogsTable>

      <Pagination>
        <PaginationButton
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </PaginationButton>

        <PageInfo>
          Page {currentPage} of {totalPages}
        </PageInfo>

        <PaginationButton
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </PaginationButton>
      </Pagination>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #333;
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  color: #6c757d;
  font-size: 1rem;
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 200px;
`;

const FilterLabel = styled.label`
  font-size: 0.85rem;
  color: #495057;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
  font-size: 1rem;
`;

const SearchInput = styled.input`
  flex: 2;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 300px;
`;

const LogsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.thead`
  background-color: #343a40;
  color: white;
`;

const HeaderRow = styled.tr``;

const HeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 500;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #e9ecef;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8f9fa;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  color: #495057;
`;

const ActionBadge = styled.span`
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  background-color: ${(props) => {
    switch (props.action) {
      case "PRODUCT_CREATE":
        return "#e6f4ea";
      case "PRODUCT_UPDATE":
        return "#e8f4f8";
      case "ORDER_UPDATE":
        return "#fff2e6";
      case "USER_UPDATE":
        return "#f0e6ff";
      default:
        return "#f0f0f0";
    }
  }};
  color: ${(props) => {
    switch (props.action) {
      case "PRODUCT_CREATE":
        return "#0a7b3c";
      case "PRODUCT_UPDATE":
        return "#0b6e99";
      case "ORDER_UPDATE":
        return "#cc5a00";
      case "USER_UPDATE":
        return "#5a00cc";
      default:
        return "#495057";
    }
  }};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 1rem;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #3a5af5;
  }

  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  font-size: 1rem;
  color: #495057;
`;
