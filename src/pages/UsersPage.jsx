import { useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaFilter,
  FaSearch,
  FaStore,
  FaUserAlt,
  FaUserPlus,
  FaUserShield,
} from "react-icons/fa";
import styled from "styled-components";
import useSellerAdmin from "../hook/useSellerAdmin";
import useUserAdmin from "../hook/useUsersAdmin";
import useAuth from "../hook/useAuth";
import {
  Table,
  RoleCell,
  UserCell,
  StatusCell,
  DateCell,
  LastActiveCell,
} from "../components/Table";
import UserDetailsModal from "../components/Modal/UserDetailsModal";
import EditUserModal from "../components/Modal/EditUserModal";
import AddUserModal from "../components/Modal/AddUserModal";

// Dynamic Table Component

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [actionMenu, setActionMenu] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false); // New state for setIsDetailsModalOpen
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // New state for isEditModalOpen
  const [selectedUser, setSelectedUser] = useState(null); // New state for setSelectedUser
  const [userToEdit, setUserToEdit] = useState(null); // New state for setUserToEdit
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    users: { page: 1, limit: 10, total: 0 },
    sellers: { page: 1, limit: 10, total: 0 },
    admins: { page: 1, limit: 10, total: 0 },
  });

  // New state for setIsAddUserModalOpen
  // Update hooks to accept pagination parameters
  const { sellers, isSellerLoading, totalSellers } = useSellerAdmin();
  console.log("Sellers:", sellers);
  const {
    users,
    isLoading: isUsersLoading,
    totalUsers,
  } = useUserAdmin(pagination.users.page, pagination.users.limit);

  const {
    admins,
    isLoading: isAdminLoading,
    totalAdmins,
  } = useAuth(pagination.admins.page, pagination.admins.limit);

  // Update pagination totals when data changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      users: { ...prev.users, total: totalUsers },
      sellers: { ...prev.sellers, total: totalSellers },
      admins: { ...prev.admins, total: totalAdmins },
    }));
  }, [totalUsers, totalSellers, totalAdmins]);

  // memoize data
  const allSellers = useMemo(() => sellers?.results || [], [sellers]);
  const allUsers = useMemo(() => users?.results || [], [users]);
  const allAdmins = useMemo(() => admins?.results || [], [admins]);

  const handlePageChange = (page) => {
    setPagination((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], page },
    }));
  };
  const handleItemsPerPageChange = (limit) => {
    setPagination((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], limit, page: 1 }, // Reset to first page
    }));
  };

  const activeRate = useMemo(() => {
    const allAccounts = [...allUsers, ...allSellers, ...allAdmins];
    const activeAccounts = allAccounts.filter(
      (account) => account.status === "active"
    ).length;

    return allAccounts.length > 0
      ? Math.round((activeAccounts / allAccounts.length) * 100)
      : 0;
  }, [allUsers, allSellers, allAdmins]);

  // Columns configuration
  const columns = {
    users: [
      { Header: "Registration", accessor: "createdAt", Cell: DateCell },
      { Header: "User", accessor: "name", Cell: UserCell },
      { Header: "Role", accessor: "role", Cell: RoleCell },
      { Header: "Last Active", accessor: "lastLogin", Cell: LastActiveCell },
      { Header: "Status", accessor: "status", Cell: StatusCell },
    ],
    sellers: [
      { Header: "Registration", accessor: "createdAt", Cell: DateCell },
      { Header: "Seller", accessor: "name", Cell: UserCell },
      { Header: "Store", accessor: "shopName" },
      { Header: "Orders", accessor: "orders" },
      { Header: "Revenue", accessor: "revenue" },
      { Header: "Last Active", accessor: "lastLogin", Cell: LastActiveCell },
      { Header: "Status", accessor: "status", Cell: StatusCell },
    ],
    admins: [
      { Header: "Registration", accessor: "createdAt", Cell: DateCell },
      { Header: "Admin", accessor: "name", Cell: UserCell },
      { Header: "Role", accessor: "role", Cell: RoleCell },
      { Header: "Actions", accessor: "permissions" },
      { Header: "Last Active", accessor: "lastLogin", Cell: LastActiveCell },
      { Header: "Status", accessor: "status", Cell: StatusCell },
    ],
  };
  const generateLastLogin = (createdAt) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Random login within the last 1-30 days
    const randomDays = Math.max(1, Math.floor(Math.random() * diffDays));
    const lastLogin = new Date(createdDate);
    lastLogin.setDate(lastLogin.getDate() + randomDays);

    return lastLogin.toISOString();
  };

  // Get filtered data based on active tab
  const getFilteredData = () => {
    const data = {
      users: allUsers
        .filter((u) => u.role === "user")
        .map((user) => ({
          ...user,
          registration: user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "-",
          lastLogin: user.lastLogin || generateLastLogin(user.createdAt),
        })),
      sellers: allSellers
        .filter((u) => u.role === "seller")
        .map((seller) => ({
          ...seller,
          lastLogin: seller.lastLogin || generateLastLogin(seller.createdAt),
        })),
      admins: allAdmins
        .filter((u) => u.role === "admin")
        .map((admin) => ({
          ...admin,
          lastLogin: admin.lastLogin || generateLastLogin(admin.createdAt),
        })),
    };

    const tabData = data[activeTab] || [];

    return selectedStatus === "all"
      ? tabData
      : tabData.filter((item) => item.status === selectedStatus);
  };

  const filteredData = getFilteredData();

  // Current pagination settings
  const currentPagination = pagination[activeTab];
  const totalPages = Math.ceil(
    currentPagination.total / currentPagination.limit
  );

  // Action handlers
  const handleEdit = (item) => {
    setUserToEdit(item);
    setIsEditModalOpen(true);
    setActionMenu(null);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Delete ${item.name}?`)) {
      setActionMenu(null);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedUser(item);
    setIsDetailsModalOpen(true);
    setActionMenu(null);
  };
  const handleClose = () => {
    setIsAddUserModalOpen(false);
  };

  if (isSellerLoading || isUsersLoading || isAdminLoading) {
    return <div>Loading...</div>;
  }
  return (
    <UserManagementContainer>
      <Header>
        <TitleSection>
          <h1>User Management</h1>
          <p>Manage all users, vendors, and administrators</p>
        </TitleSection>
        <ActionButton onClick={() => setIsAddUserModalOpen(true)}>
          <FaUserPlus /> Add New User
        </ActionButton>
      </Header>

      {/* Tabs Section */}
      <TabsContainer>
        <Tab
          active={activeTab === "users"}
          onClick={() => setActiveTab("users")}
        >
          <FaUserAlt /> Users
        </Tab>
        <Tab
          active={activeTab === "sellers"}
          onClick={() => setActiveTab("sellers")}
        >
          <FaStore /> Sellers
        </Tab>
        <Tab
          active={activeTab === "admins"}
          onClick={() => setActiveTab("admins")}
        >
          <FaUserShield /> Admins
        </Tab>
      </TabsContainer>

      <ControlsSection>
        <SearchBar>
          <FaSearch style={{ color: "#8D99AE" }} />
          <input
            type="text"
            placeholder={`Search ${activeTab} by name, email, or vendor...`}
          />
        </SearchBar>

        <FilterButton onClick={() => setFilterOpen(!filterOpen)}>
          <FaFilter /> Filters
        </FilterButton>
      </ControlsSection>

      {filterOpen && (
        <FiltersPanel>
          <FilterGroup>
            <label>Account Status</label>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <label>Registration Date</label>
            <DateRangeSelector>
              <input type="date" />
              <span>to</span>
              <input type="date" />
            </DateRangeSelector>
          </FilterGroup>

          <ApplyFiltersButton>Apply Filters</ApplyFiltersButton>
        </FiltersPanel>
      )}

      <StatsSummary>
        <StatCard>
          <StatIcon style={{ background: "#4361EE20", color: "#4361EE" }}>
            <FaUserAlt />
          </StatIcon>
          <StatInfo>
            <StatValue>{allUsers.length}</StatValue>
            <StatLabel>Total Users</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon style={{ background: "#F8961E20", color: "#F8961E" }}>
            <FaStore />
          </StatIcon>
          <StatInfo>
            <StatValue>
              {allSellers.filter((u) => u.role === "seller").length}
            </StatValue>
            <StatLabel>Active Sellers</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon style={{ background: "#4CC9F020", color: "#4CC9F0" }}>
            <FaUserShield />
          </StatIcon>
          <StatInfo>
            <StatValue>
              {allAdmins.filter((u) => u.role === "admin").length}
            </StatValue>
            <StatLabel>Administrators</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon style={{ background: "#F7258520", color: "#F72585" }}>
            <FaChartLine />
          </StatIcon>
          <StatInfo>
            <StatValue>{activeRate}%</StatValue>
            <StatLabel>Active Rate</StatLabel>
          </StatInfo>
        </StatCard>
      </StatsSummary>

      {/* Dynamic Table */}
      <Table
        data={filteredData}
        columns={columns[activeTab]}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
        actionMenu={actionMenu}
        setActionMenu={setActionMenu}
      />
      {isEditModalOpen && (
        <EditUserModal
          user={userToEdit}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
      {isDetailsModalOpen && (
        <UserDetailsModal
          selectedUser={selectedUser}
          setIsDetailsModalOpen={setIsDetailsModalOpen}
        />
      )}
      {isAddUserModalOpen && (
        <AddUserModal
          setIsAddUserModalOpen={setIsAddUserModalOpen}
          // selectedUser={selectedUser}
          onClose={handleClose}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
      <Pagination>
        <PaginationButton
          disabled={currentPagination.page === 1}
          onClick={() => handlePageChange(currentPagination.page - 1)}
        >
          Previous
        </PaginationButton>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <PaginationButton
              key={pageNum}
              active={pageNum === currentPagination.page}
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </PaginationButton>
          );
        })}

        {totalPages > 5 && (
          <PageInfo>
            Page {currentPagination.page} of {totalPages}
          </PageInfo>
        )}

        <PaginationButton
          disabled={currentPagination.page >= totalPages}
          onClick={() => handlePageChange(currentPagination.page + 1)}
        >
          Next
        </PaginationButton>

        <ItemsPerPageSelect
          value={currentPagination.limit}
          onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </ItemsPerPageSelect>
      </Pagination>
    </UserManagementContainer>
  );
}
const UserManagementContainer = styled.div`
  padding: 30px;
  background-color: #f5f7fb;
  min-height: 100vh;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const TitleSection = styled.div`
  h1 {
    font-size: 28px;
    color: #2b2d42;
    margin-bottom: 8px;
  }

  p {
    color: #8d99ae;
    font-size: 16px;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #4361ee;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #3a56d4;
    transform: translateY(-2px);
  }
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 25px;
  padding: 0 5px;
`;

const Tab = styled.div`
  padding: 12px 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  color: ${({ active }) => (active ? "#4361EE" : "#8D99AE")};
  border-bottom-color: ${({ active }) => (active ? "#4361EE" : "transparent")};
  transition: all 0.3s;

  &:hover {
    color: #4361ee;
  }
`;

const ControlsSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border-radius: 10px;
  padding: 12px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  flex: 1;
  max-width: 500px;

  input {
    border: none;
    padding: 5px 10px;
    width: 100%;
    outline: none;
    font-size: 15px;
    background: transparent;
  }

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  color: #4361ee;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  &:hover {
    background: #f0f2ff;
  }
`;

const FiltersPanel = styled.div`
  background: white;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FilterGroup = styled.div`
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #2b2d42;
    font-size: 14px;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  background: white;
  font-size: 14px;
  color: #2b2d42;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
`;

const DateRangeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  input {
    flex: 1;
    padding: 14px;
    border-radius: 10px;
    border: 1px solid #e9ecef;
    font-size: 14px;
  }

  span {
    color: #8d99ae;
  }
`;

const ApplyFiltersButton = styled.button`
  background: #4361ee;
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  align-self: flex-end;

  &:hover {
    background: #3a56d4;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StatsSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 15px;
`;

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const StatInfo = styled.div``;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #2b2d42;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  color: #8d99ae;
  font-size: 14px;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
`;

const PaginationButton = styled.button`
  min-width: 40px;
  padding: 0 15px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: ${({ active }) => (active ? "#4361ee" : "white")};
  color: ${({ active }) => (active ? "white" : "#2b2d42")};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  font-weight: 500;

  &:hover {
    background: ${({ active }) => (active ? "#3a56d4" : "#f0f2ff")};
  }
`;
const PageInfo = styled.span`
  padding: 8px 12px;
  color: #6c757d;
`;

const ItemsPerPageSelect = styled.select`
  margin-left: 15px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  background-color: white;
  cursor: pointer;
`;

// Modify existing PaginationButton for disabled state
// const PaginationButton = styled.button`
//   min-width: 40px;
//   padding: 0 15px;
//   height: 40px;
//   border-radius: 10px;
//   border: none;
//   background: ${({ active }) => (active ? "#4361ee" : "white")};
//   color: ${({ active, disabled }) =>
//     active ? "white" : disabled ? "#adb5bd" : "#2b2d42"};
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
//   box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
//   font-weight: 500;
//   opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};

//   &:hover {
//     background: ${({ active, disabled }) =>
//       disabled ? "white" : active ? "#3a56d4" : "#f0f2ff"};
//   }
// `;
