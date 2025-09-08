// /* eslint-disable react/display-name */
// import { FixedSizeList as List } from "react-window";
// import { forwardRef } from "react";

import { useState } from "react";
import { useEffect } from "react";
import styled from "styled-components";
// import {  FaFilter, FaFileExport, FaSync, FaCheck, ,, FaMoneyBillWave, ,, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import {
  FaCheck,
  FaSearch,
  FaFilter,
  FaMoneyBillWave,
  FaTimes,
  FaSync,
  FaFileExport,
  FaDownload,
  FaEye,
  FaTrash,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";
// function handleOnWheel({ deltaY }) {
//   console.log("handleOnWheel", deltaY);
// }
// const outerElementType = forwardRef((props, ref) => {
//   return <div ref={ref} onWheel={handleOnWheel} {...props} />;
// });

// export default function PaymentRequest() {
//   const Row = ({ index }) => {
//     return (
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-around",
//         }}
//       >
//         <div>{index + 1}</div>
//         <div>$10000</div>
//         <div>
//           <span>pending</span>
//         </div>
//         <div>25 jan 2025</div>
//         <div>
//           <button>Confirm</button>
//         </div>
//       </div>
//     );
//   };
//   return (
//     <div>
//       <div style={{ display: "flex", flexDirection: "column" }}>
//         <h2>Withdrawal Request</h2>
//         <div style={{ width: "100%" }}>
//           <div>
//             <div
//               style={{
//                 display: "flex",
//                 flex: 1,
//                 justifyContent: "space-around",
//               }}
//             >
//               <div>No</div>
//               <div>Amount</div>
//               <div>Status</div>
//               <div>Date</div>
//               <div>Action</div>
//             </div>
//             {
//               <List
//                 style={{ minWidth: "340px" }}
//                 className="List"
//                 height={350}
//                 itemCount={100}
//                 itemSize={35}
//                 outerElementType={outerElementType}
//               >
//                 {Row}
//               </List>
//             }
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

export default function PaymentPage() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 6;

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    // In a real app, this would come from an API
    const mockRequests = [
      {
        id: "PR-2023-001",
        seller: "TechGadgets Store",
        amount: 1250.0,
        date: "2023-10-12",
        method: "Bank Transfer",
        status: "pending",
      },
      {
        id: "PR-2023-002",
        seller: "FashionHub",
        amount: 850.0,
        date: "2023-10-11",
        method: "MTN Mobile Money",
        status: "approved",
      },
      {
        id: "PR-2023-003",
        seller: "HomeEssentials",
        amount: 2340.0,
        date: "2023-10-10",
        method: "At Cash Payment",
        status: "paid",
      },
      {
        id: "PR-2023-004",
        seller: "BookWorld",
        amount: 450.0,
        date: "2023-10-09",
        method: "TeleCel Mobile Money",
        status: "rejected",
      },
      {
        id: "PR-2023-005",
        seller: "SportsGear",
        amount: 1780.0,
        date: "2023-10-08",
        method: "Bank Transfer",
        status: "pending",
      },
      {
        id: "PR-2023-006",
        seller: "BeautyBoutique",
        amount: 920.0,
        date: "2023-10-07",
        method: "MTN Mobile Money",
        status: "approved",
      },
      {
        id: "PR-2023-007",
        seller: "ElectroShop",
        amount: 2100.0,
        date: "2023-10-06",
        method: "Bank Transfer",
        status: "paid",
      },
      {
        id: "PR-2023-008",
        seller: "PetParadise",
        amount: 680.0,
        date: "2023-10-05",
        method: "PayPal",
        status: "rejected",
      },
      {
        id: "PR-2023-009",
        seller: "ToyLand",
        amount: 1540.0,
        date: "2023-10-04",
        method: "Bank Transfer",
        status: "pending",
      },
    ];

    setRequests(mockRequests);
    setFilteredRequests(mockRequests);

    const pending = mockRequests.filter((r) => r.status === "pending").length;
    const approved = mockRequests.filter((r) => r.status === "approved").length;
    const paid = mockRequests.filter((r) => r.status === "paid").length;
    const rejected = mockRequests.filter((r) => r.status === "rejected").length;
    const totalAmount = mockRequests.reduce((sum, req) => sum + req.amount, 0);

    setStats({ pending, approved, paid, rejected, totalAmount });
  }, []);
  useEffect(() => {
    let result = [...requests];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (req) =>
          req.id.toLowerCase().includes(term) ||
          req.seller.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((req) => req.status === statusFilter);
    }

    // Apply date filter (simplified for demo)
    if (dateFilter !== "all") {
      // In a real app, this would compare actual dates
      result = result.filter((req) => {
        if (dateFilter === "week") return req.id.includes("PR-2023-00");
        if (dateFilter === "month") return true; // all in this demo
        return true;
      });
    }

    // Apply amount filter
    if (amountFilter !== "all") {
      result = result.filter((req) => {
        if (amountFilter === "0-500") return req.amount <= 500;
        if (amountFilter === "500-1000")
          return req.amount > 500 && req.amount <= 1000;
        if (amountFilter === "1000+") return req.amount > 1000;
        return true;
      });
    }

    setFilteredRequests(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, dateFilter, amountFilter, requests]);
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(
    indexOfFirstRequest,
    indexOfLastRequest
  );
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  // Handle request actions
  const handleAction = (id, action) => {
    let updatedRequests = [...requests];
    const requestIndex = updatedRequests.findIndex((req) => req.id === id);

    if (requestIndex !== -1) {
      switch (action) {
        case "approve":
          updatedRequests[requestIndex].status = "approved";
          break;
        case "reject":
          updatedRequests[requestIndex].status = "rejected";
          break;
        case "pay":
          updatedRequests[requestIndex].status = "paid";
          break;
        case "delete":
          updatedRequests.splice(requestIndex, 1);
          break;
        default:
          break;
      }

      setRequests(updatedRequests);
      alert(`Action "${action}" performed on request ${id}`);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setAmountFilter("all");
  };

  return (
    <PageContainer>
      <Header>
        <Title>Payment Requests</Title>
        <Description>View and manage payment requests from sellers</Description>
      </Header>
      <StatsContainer>
        <StatCard $type="pending">
          <StatIcon $type="pending">
            <FaFilter />
          </StatIcon>
          <StatContent>
            <StatValue>{stats.pending}</StatValue>
            <StatLabel>Pending Requests</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard $type="approved">
          <StatIcon $type="approved">
            <FaCheck />
          </StatIcon>
          <StatContent>
            <StatValue>{stats.approved}</StatValue>
            <StatLabel>Approved Requests</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard $type="paid">
          <StatIcon $type="paid">
            <FaMoneyBillWave />
          </StatIcon>
          <StatContent>
            <StatValue>Gh{stats.totalAmount.toLocaleString()}</StatValue>
            <StatLabel>Total Amount</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard $type="rejected">
          <StatIcon $type="rejected">
            <FaTimes />
          </StatIcon>
          <StatContent>
            <StatValue>{stats.rejected}</StatValue>
            <StatLabel>Rejected Requests</StatLabel>
          </StatContent>
        </StatCard>
      </StatsContainer>
      <FiltersContainer>
        <FilterGroup>
          <FilterLabel>Search</FilterLabel>
          <SearchInput>
            <FaSearch />
            <input
              type="text"
              placeholder="Search by seller or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchInput>
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>Status</FilterLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </Select>
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>Date Range</FilterLabel>
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </Select>
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>Amount Range</FilterLabel>
          <Select
            value={amountFilter}
            onChange={(e) => setAmountFilter(e.target.value)}
          >
            <option value="all">All Amounts</option>
            <option value="0-500">$0 - $500</option>
            <option value="500-1000">$500 - $1000</option>
            <option value="1000+">$1000+</option>
          </Select>
        </FilterGroup>
        <ActionsContainer>
          <ActionButton $primary>
            <FaFilter /> Apply Filters
          </ActionButton>
          <ActionButton onClick={resetFilters}>
            <FaSync /> Reset
          </ActionButton>
          <ActionButton>
            <FaFileExport /> Export CSV
          </ActionButton>
        </ActionsContainer>
      </FiltersContainer>
      <TableContainer>
        <Table>
          <thead>
            <TableRow>
              <TableHeader>Request ID</TableHeader>
              <TableHeader>Seller</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Request Date</TableHeader>
              <TableHeader>Payment Method</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </thead>
          <tbody>
            {currentRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.id}</TableCell>
                <TableCell>{request.seller}</TableCell>
                <TableCell>${request.amount.toFixed(2)}</TableCell>
                <TableCell>
                  {new Date(request.date).toLocaleDateString()}
                </TableCell>
                <TableCell>{request.method}</TableCell>
                <TableCell>
                  <StatusBadge $status={request.status}>
                    {request.status.charAt(0).toUpperCase() +
                      request.status.slice(1)}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <ActionButtons>
                    {request.status === "pending" && (
                      <>
                        <ActionIcon
                          $type="approve"
                          // onClick={() => handleAction(request.id, "approve")}
                        >
                          <FaCheck title="Approve" />
                        </ActionIcon>
                        <ActionIcon
                          $type="reject"
                          // onClick={() => handleAction(request.id, "reject")}
                        >
                          <FaTimes title="Reject" />
                        </ActionIcon>
                      </>
                    )}
                    {request.status === "approved" && (
                      <ActionIcon
                        $type="pay"
                        // onClick={() => handleAction(request.id, "pay")}
                      >
                        <FaMoneyBillWave title="Mark as Paid" />
                      </ActionIcon>
                    )}
                    {request.status === "paid" && (
                      <ActionIcon
                        $type="download"
                        onClick={() =>
                          alert(`Downloading receipt for ${request.id}`)
                        }
                      >
                        <FaDownload title="Download Receipt" />
                      </ActionIcon>
                    )}
                    <ActionIcon
                      $type="view"
                      onClick={() => alert(`Viewing details for ${request.id}`)}
                    >
                      <FaEye title="View Details" />
                    </ActionIcon>
                    {request.status === "rejected" && (
                      <ActionIcon
                        $type="delete"
                        onClick={() => handleAction(request.id, "delete")}
                      >
                        <FaTrash title="Delete" />
                      </ActionIcon>
                    )}
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableContainer>
      {filteredRequests.length === 0 && (
        <NoResults>
          <h3>No payment requests found</h3>
          <p>Try adjusting your filters or search criteria</p>
          <ResetButton onClick={resetFilters}>Reset Filters</ResetButton>
        </NoResults>
      )}
      {filteredRequests.length > 0 && (
        <Pagination>
          <PaginationInfo>
            Showing {indexOfFirstRequest + 1} to{" "}
            {Math.min(indexOfLastRequest, filteredRequests.length)} of{" "}
            {filteredRequests.length} requests
          </PaginationInfo>
          <PaginationControls>
            <PaginationButton
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <FaChevronLeft />
            </PaginationButton>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationButton
                key={page}
                $active={currentPage === page}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </PaginationButton>
            ))}

            <PaginationButton
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <FaChevronRight />
            </PaginationButton>
          </PaginationControls>
        </Pagination>
      )}
    </PageContainer>
  );
}

const PageContainer = styled.div`
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  color: #64748b;
  font-size: 1rem;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  border-left: 4px solid
    ${(props) =>
      props.$type === "pending"
        ? "#f59e0b"
        : props.$type === "approved"
        ? "#3b82f6"
        : props.$type === "paid"
        ? "#10b981"
        : props.$type === "rejected"
        ? "#ef4444"
        : "#94a3b8"};
`;

const StatIcon = styled.div`
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
  color: ${(props) =>
    props.$type === "pending"
      ? "#f59e0b"
      : props.$type === "approved"
      ? "#3b82f6"
      : props.$type === "paid"
      ? "#10b981"
      : props.$type === "rejected"
      ? "#ef4444"
      : "#94a3b8"};
  background-color: ${(props) =>
    props.$type === "pending"
      ? "#fef3c7"
      : props.$type === "approved"
      ? "#dbeafe"
      : props.$type === "paid"
      ? "#d1fae5"
      : props.$type === "rejected"
      ? "#fee2e2"
      : "#f1f5f9"};
`;

const StatContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
`;

const StatLabel = styled.div`
  color: #64748b;
  font-size: 0.875rem;
`;

const FiltersContainer = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.5rem;
`;

const SearchInput = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 0.75rem;
    color: #94a3b8;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background-color: white;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  grid-column: 1 / -1;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${(props) => (props.$primary ? "#3b82f6" : "white")};
  color: ${(props) => (props.$primary ? "white" : "#334155")};
  border: ${(props) => (props.$primary ? "none" : "1px solid #cbd5e1")};

  &:hover {
    background-color: ${(props) => (props.$primary ? "#2563eb" : "#f1f5f9")};
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
`;

const TableHeader = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  background-color: #f1f5f9;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;

  &:nth-child(even) {
    background-color: #f8fafc;
  }

  &:hover {
    background-color: #f1f5f9;
  }
`;

const TableCell = styled.td`
  padding: 1rem 1.5rem;
  color: #334155;
  font-size: 0.875rem;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;

  background-color: ${(props) =>
    props.$status === "pending"
      ? "#fef3c7"
      : props.$status === "approved"
      ? "#dbeafe"
      : props.$status === "paid"
      ? "#d1fae5"
      : props.$status === "rejected"
      ? "#fee2e2"
      : "#f1f5f9"};

  color: ${(props) =>
    props.$status === "pending"
      ? "#b45309"
      : props.$status === "approved"
      ? "#1d4ed8"
      : props.$status === "paid"
      ? "#047857"
      : props.$status === "rejected"
      ? "#b91c1c"
      : "#64748b"};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionIcon = styled.button`
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${(props) =>
    props.$type === "approve"
      ? "#d1fae5"
      : props.$type === "reject"
      ? "#fee2e2"
      : props.$type === "pay"
      ? "#dbeafe"
      : props.$type === "download"
      ? "#ede9fe"
      : props.$type === "delete"
      ? "#fee2e2"
      : "#f1f5f9"};

  color: ${(props) =>
    props.$type === "approve"
      ? "#047857"
      : props.$type === "reject"
      ? "#b91c1c"
      : props.$type === "pay"
      ? "#1d4ed8"
      : props.$type === "download"
      ? "#7e22ce"
      : props.$type === "delete"
      ? "#b91c1c"
      : "#334155"};

  border: none;

  &:hover {
    background-color: ${(props) =>
      props.$type === "approve"
        ? "#a7f3d0"
        : props.$type === "reject"
        ? "#fecaca"
        : props.$type === "pay"
        ? "#bfdbfe"
        : props.$type === "download"
        ? "#ddd6fe"
        : props.$type === "delete"
        ? "#fecaca"
        : "#e2e8f0"};
  }
`;

const NoResults = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #334155;
    margin-bottom: 0.5rem;
  }

  p {
    color: #64748b;
    margin-bottom: 1.5rem;
  }
`;

const ResetButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const PaginationInfo = styled.div`
  color: #64748b;
  font-size: 0.875rem;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PaginationButton = styled.button`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${(props) => (props.$active ? "#3b82f6" : "white")};
  color: ${(props) => (props.$active ? "white" : "#334155")};
  border: ${(props) => (props.$active ? "none" : "1px solid #cbd5e1")};

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.$active ? "#2563eb" : "#f1f5f9")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
