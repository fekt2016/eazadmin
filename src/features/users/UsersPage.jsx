import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import useSellerAdmin from '../../shared/hooks/useSellerAdmin';
import useUserAdmin from '../../shared/hooks/useUsersAdmin';
import useAdminsAdmin from '../../shared/hooks/useAdminsAdmin';
import { PATHS } from '../../routes/routhPath';
import {
  Table,
  RoleCell,
  UserCell,
  StatusCell,
  DateCell,
  LastActiveCell,
  VerificationStatusCell,
  OrderCountCell,
} from '../../shared/components/Table';
import { FaCheckCircle, FaTimesCircle, FaUndo, FaClock, FaEye, FaWallet } from 'react-icons/fa';
import { toast } from 'react-toastify';
import EditUserModal from '../../shared/components/Modal/EditUserModal';
import AddUserModal from '../../shared/components/Modal/AddUserModal';
import PayoutVerificationModal from '../../shared/components/Modal/payoutVerificationModal';
import { useResetSellerBalance } from '../../shared/hooks/useSellerBalance';

// Dynamic Table Component

export default function UsersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [verificationStatusFilter, setVerificationStatusFilter] = useState("all"); // For sellers tab
  const [actionMenu, setActionMenu] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [sellerToReject, setSellerToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showResetBalanceModal, setShowResetBalanceModal] = useState(false);
  const [sellerToResetBalance, setSellerToResetBalance] = useState(null);
  const [resetBalance, setResetBalance] = useState("");
  const [resetBalanceReason, setResetBalanceReason] = useState("");
  const [showRejectPayoutModal, setShowRejectPayoutModal] = useState(false);
  const [sellerToRejectPayout, setSellerToRejectPayout] = useState(null);
  const [payoutRejectionReason, setPayoutRejectionReason] = useState("");
  const [selectedSellerForPayout, setSelectedSellerForPayout] = useState(null); // For PayoutVerificationModal
  
  // Reset balance mutation
  const resetBalanceMutation = useResetSellerBalance();

  // Pagination state
  const [pagination, setPagination] = useState({
    users: { page: 1, limit: 10, total: 0 },
    sellers: { page: 1, limit: 10, total: 0 },
    admins: { page: 1, limit: 10, total: 0 },
  });

  // New state for setIsAddUserModalOpen
  // Update hooks to accept pagination parameters
  const { 
    sellers, 
    isSellerLoading, 
    totalSellers,
    approveVerification,
    rejectVerification,
    approvePayout,
    rejectPayout,
    searchValue: sellerSearchValue,
    setSearchValue: setSellerSearchValue,
    sort: sellerSort,
    setSort: setSellerSort,
    meta: sellerMeta,
    page: sellerPage,
    setPage: setSellerPage,
  } = useSellerAdmin(pagination.sellers.page, pagination.sellers.limit);

  const {
    users,
    isLoading: isUsersLoading,
    totalUsers,
  } = useUserAdmin(pagination.users.page, pagination.users.limit);

  const {
    admins: adminsData,
    isLoading: isAdminLoading,
    totalAdmins,
  } = useAdminsAdmin(pagination.admins.page, pagination.admins.limit);

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
  // sellers structure: { results, meta, data: { results, meta } }
  const allSellers = useMemo(() => {
    if (!sellers) return [];
    // Check multiple possible structures
    if (Array.isArray(sellers)) return sellers;
    if (sellers.results && Array.isArray(sellers.results)) return sellers.results;
    if (sellers.data?.results && Array.isArray(sellers.data.results)) return sellers.data.results;
    return [];
  }, [sellers]);
  const allUsers = useMemo(() => users?.results || [], [users]);
  const allAdmins = useMemo(() => adminsData?.results || [], [adminsData]);

  const handlePageChange = (page) => {
    if (activeTab === "sellers") {
      setSellerPage(page);
      setPagination((prev) => ({
        ...prev,
        sellers: { ...prev.sellers, page },
      }));
    } else {
    setPagination((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], page },
    }));
    }
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

  // Tab-specific statistics
  const tabStats = useMemo(() => {
    if (activeTab === "users") {
      const users = allUsers.filter((u) => u.role === "user");
      const activeUsers = users.filter((u) => u.status === "active").length;
      const inactiveUsers = users.filter((u) => u.status === "inactive").length;
      const pendingUsers = users.filter((u) => u.status === "pending").length;
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newThisMonth = users.filter(
        (u) => new Date(u.createdAt) >= thisMonth
      ).length;

      return {
        total: users.length,
        active: activeUsers,
        inactive: inactiveUsers,
        pending: pendingUsers,
        newThisMonth: newThisMonth,
      };
    } else if (activeTab === "sellers") {
      const sellers = allSellers.filter((u) => u.role === "seller");
      const verifiedSellers = sellers.filter(
        (u) => u.verificationStatus === "verified" || u.onboardingStage === "verified"
      ).length;
      const pendingSellers = sellers.filter(
        (u) => u.verificationStatus === "pending" || u.onboardingStage === "pending_verification"
      ).length;
      const rejectedSellers = sellers.filter(
        (u) => u.verificationStatus === "rejected" || u.onboardingStage === "rejected"
      ).length;
      const activeSellers = sellers.filter((u) => u.status === "active").length;

      return {
        total: sellers.length,
        verified: verifiedSellers,
        pending: pendingSellers,
        rejected: rejectedSellers,
        active: activeSellers,
      };
    } else if (activeTab === "admins") {
      const admins = allAdmins.filter((u) => u.role === "admin");
      const activeAdmins = admins.filter((u) => u.status === "active").length;
      const inactiveAdmins = admins.filter((u) => u.status === "inactive").length;
      const superAdmins = admins.filter((u) => u.role === "super_admin" || u.permissions?.includes("all")).length;

      return {
        total: admins.length,
        active: activeAdmins,
        inactive: inactiveAdmins,
        superAdmins: superAdmins,
      };
    }
    return {};
  }, [activeTab, allUsers, allSellers, allAdmins]);

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
      { Header: "Verification", accessor: "verificationStatus", Cell: VerificationStatusCell },
      { Header: "Orders", accessor: "orderCount", Cell: OrderCountCell },
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
          // Ensure id points to _id (MongoDB ObjectId) if _id exists
          id: user._id || user.id,
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
        // Sellers from backend are already filtered and paginated
        // Just map the data structure (no need to filter by role as backend returns only sellers)
        .map((seller) => ({
          ...seller,
          // Ensure id points to _id (MongoDB ObjectId) if _id exists
          id: seller._id || seller.id,
          lastLogin: seller.lastLogin || generateLastLogin(seller.createdAt),
        })),
      admins: allAdmins
        .filter((u) => u.role === "admin")
        .map((admin) => ({
          ...admin,
          // Ensure id points to _id (MongoDB ObjectId) if _id exists
          id: admin._id || admin.id,
          lastLogin: admin.lastLogin || generateLastLogin(admin.createdAt),
        })),
    };

    let tabData = data[activeTab] || [];

    // Apply status filter (only for users and admins)
    // For sellers, filtering is done on backend via API params
    if (activeTab !== "sellers" && selectedStatus !== "all") {
      tabData = tabData.filter((item) => item.status === selectedStatus);
    }

    // For sellers, verification status filter is handled by backend API
    // Frontend filtering removed to avoid double-filtering paginated results
    // The backend already applies search, sort, and pagination

    return tabData;
  };

  const filteredData = getFilteredData();

  // Current pagination settings
  // For sellers tab, use sellerMeta from hook; otherwise use local pagination
  const currentPagination = activeTab === "sellers" && sellerMeta 
    ? { 
        page: sellerPage, 
        limit: pagination.sellers.limit, 
        total: sellerMeta.total || 0 
      }
    : pagination[activeTab];
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
    console.log('[handleViewDetails] Called with item:', item);
    console.log('[handleViewDetails] Active tab:', activeTab);
    
    // Navigate to detail page based on active tab
    const userId = item._id || item.id;
    console.log('[handleViewDetails] User ID:', userId);
    
    if (userId) {
      // Validate that it's not a simple sequential number (like 1, 2, 3)
      const isNumericId = !isNaN(userId) && parseInt(userId) < 1000;
      if (!isNumericId || (typeof userId === 'string' && userId.length > 5)) {
        let path = '';
        if (activeTab === "sellers") {
          path = `/dashboard/${PATHS.SELLERDETAIL.replace(':id', userId)}`;
        } else if (activeTab === "admins") {
          path = `/dashboard/${PATHS.ADMINDETAIL.replace(':id', userId)}`;
        } else {
          path = `/dashboard/${PATHS.USERDETAIL.replace(':id', userId)}`;
        }
        console.log('[handleViewDetails] Navigating to:', path);
        navigate(path);
      } else {
        console.error('Invalid user ID format (appears to be sequential number):', userId, item);
      }
    } else {
      console.error('User ID is missing:', item);
    }
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
            value={activeTab === "sellers" ? sellerSearchValue : ""}
            onChange={(e) => {
              if (activeTab === "sellers") {
                setSellerSearchValue(e.target.value);
              }
            }}
          />
        </SearchBar>

        {activeTab === "sellers" && (
          <SortContainer>
            <SortLabel>Sort:</SortLabel>
            <SortButton
              active={sellerSort.startsWith("createdAt")}
              onClick={() => {
                const [currentField, currentOrder] = sellerSort.split(":");
                const newOrder = currentField === "createdAt" && currentOrder === "asc" ? "desc" : "asc";
                setSellerSort(`createdAt:${newOrder}`);
                setSellerPage(1);
                handlePageChange(1);
              }}
            >
              Date {sellerSort === "createdAt:asc" ? "↑" : "↓"}
            </SortButton>
            <SortButton
              active={sellerSort.startsWith("name")}
              onClick={() => {
                const [currentField, currentOrder] = sellerSort.split(":");
                const newOrder = currentField === "name" && currentOrder === "asc" ? "desc" : "asc";
                setSellerSort(`name:${newOrder}`);
                setSellerPage(1);
                handlePageChange(1);
              }}
            >
              Name {sellerSort === "name:asc" ? "↑" : "↓"}
            </SortButton>
            <SortButton
              active={sellerSort.startsWith("shopName")}
              onClick={() => {
                const [currentField, currentOrder] = sellerSort.split(":");
                const newOrder = currentField === "shopName" && currentOrder === "asc" ? "desc" : "asc";
                setSellerSort(`shopName:${newOrder}`);
                setSellerPage(1);
                handlePageChange(1);
              }}
            >
              Shop {sellerSort === "shopName:asc" ? "↑" : "↓"}
            </SortButton>
          </SortContainer>
        )}

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

          {activeTab === "sellers" && (
            <FilterGroup>
              <label>Verification Status</label>
              <Select
                value={verificationStatusFilter}
                onChange={(e) => setVerificationStatusFilter(e.target.value)}
              >
                <option value="all">All Verification Statuses</option>
                <option value="pending">Pending Requests</option>
                <option value="verified">Verified Sellers</option>
                <option value="rejected">Rejected</option>
              </Select>
            </FilterGroup>
          )}

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

      {/* Tab-specific Stats Cards */}
      {activeTab === "users" && (
      <StatsSummary>
        <StatCard>
          <StatIcon style={{ background: "#4361EE20", color: "#4361EE" }}>
            <FaUserAlt />
          </StatIcon>
          <StatInfo>
              <StatValue>{tabStats.total || 0}</StatValue>
            <StatLabel>Total Users</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
            <StatIcon style={{ background: "#10B98120", color: "#10B981" }}>
              <FaCheckCircle />
            </StatIcon>
            <StatInfo>
              <StatValue>{tabStats.active || 0}</StatValue>
              <StatLabel>Active Users</StatLabel>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ background: "#F59E0B20", color: "#F59E0B" }}>
              <FaClock />
            </StatIcon>
            <StatInfo>
              <StatValue>{tabStats.pending || 0}</StatValue>
              <StatLabel>Pending</StatLabel>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ background: "#EF444420", color: "#EF4444" }}>
              <FaTimesCircle />
            </StatIcon>
            <StatInfo>
              <StatValue>{tabStats.inactive || 0}</StatValue>
              <StatLabel>Inactive</StatLabel>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ background: "#8B5CF620", color: "#8B5CF6" }}>
              <FaUserPlus />
            </StatIcon>
            <StatInfo>
              <StatValue>{tabStats.newThisMonth || 0}</StatValue>
              <StatLabel>New This Month</StatLabel>
            </StatInfo>
          </StatCard>
        </StatsSummary>
      )}

      {activeTab === "sellers" && (
        <StatsSummary>
          <StatCard>
            <StatIcon style={{ background: "#4361EE20", color: "#4361EE" }}>
            <FaStore />
          </StatIcon>
          <StatInfo>
              <StatValue>{tabStats.total || 0}</StatValue>
              <StatLabel>Total Sellers</StatLabel>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ background: "#10B98120", color: "#10B981" }}>
              <FaCheckCircle />
            </StatIcon>
            <StatInfo>
              <StatValue>{tabStats.verified || 0}</StatValue>
              <StatLabel>Verified</StatLabel>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ background: "#F59E0B20", color: "#F59E0B" }}>
              <FaClock />
            </StatIcon>
            <StatInfo>
              <StatValue>{tabStats.pending || 0}</StatValue>
              <StatLabel>Pending Verification</StatLabel>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ background: "#EF444420", color: "#EF4444" }}>
              <FaTimesCircle />
            </StatIcon>
            <StatInfo>
              <StatValue>{tabStats.rejected || 0}</StatValue>
              <StatLabel>Rejected</StatLabel>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ background: "#3B82F620", color: "#3B82F6" }}>
              <FaChartLine />
            </StatIcon>
            <StatInfo>
              <StatValue>{tabStats.active || 0}</StatValue>
            <StatLabel>Active Sellers</StatLabel>
          </StatInfo>
        </StatCard>
        </StatsSummary>
      )}

      {activeTab === "admins" && (
        <StatsSummary>
        <StatCard>
            <StatIcon style={{ background: "#4361EE20", color: "#4361EE" }}>
            <FaUserShield />
          </StatIcon>
          <StatInfo>
              <StatValue>{tabStats.total || 0}</StatValue>
              <StatLabel>Total Admins</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
            <StatIcon style={{ background: "#10B98120", color: "#10B981" }}>
              <FaCheckCircle />
          </StatIcon>
          <StatInfo>
              <StatValue>{tabStats.active || 0}</StatValue>
              <StatLabel>Active Admins</StatLabel>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ background: "#EF444420", color: "#EF4444" }}>
              <FaTimesCircle />
            </StatIcon>
            <StatInfo>
              <StatValue>{tabStats.inactive || 0}</StatValue>
              <StatLabel>Inactive</StatLabel>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ background: "#8B5CF620", color: "#8B5CF6" }}>
              <FaUserShield />
            </StatIcon>
            <StatInfo>
              <StatValue>{tabStats.superAdmins || 0}</StatValue>
              <StatLabel>Super Admins</StatLabel>
          </StatInfo>
        </StatCard>
      </StatsSummary>
      )}

      {/* Dynamic Table */}
      <Table
        data={filteredData}
        columns={columns[activeTab]}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
        actionMenu={actionMenu}
        setActionMenu={setActionMenu}
        actionType={activeTab === "sellers" ? "menu" : "iconLink"}
        actionLinkPath={(item) => {
          const userId = item._id || item.id;
          // Generate different paths based on active tab
          if (activeTab === "users") {
            return `detail/${userId}`; // /dashboard/users/detail/:id
          } else if (activeTab === "sellers") {
            return `../sellers/detail/${userId}`; // /dashboard/sellers/detail/:id
          } else if (activeTab === "admins") {
            return `../admins/detail/${userId}`; // /dashboard/admins/detail/:id
          }
          return `detail/${userId}`; // fallback
        }}
      />
      {isEditModalOpen && (
        <EditUserModal
          user={userToEdit}
          onClose={() => setIsEditModalOpen(false)}
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

      {/* Reject Payout Modal */}
      {showRejectPayoutModal && sellerToRejectPayout && (
        <ModalOverlay onClick={() => setShowRejectPayoutModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Reject Payout Verification</h3>
              <CloseButton onClick={() => {
                setShowRejectPayoutModal(false);
                setSellerToRejectPayout(null);
                setPayoutRejectionReason("");
              }}>&times;</CloseButton>
            </ModalHeader>
            <ModalBody>
              <p><strong>Seller:</strong> {sellerToRejectPayout.shopName || sellerToRejectPayout.name}</p>
              <p><strong>Email:</strong> {sellerToRejectPayout.email}</p>
              <label style={{ display: 'block', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                Rejection Reason *
              </label>
              <textarea
                value={payoutRejectionReason}
                onChange={(e) => setPayoutRejectionReason(e.target.value)}
                placeholder="Enter reason for rejecting payout verification..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                required
              />
            </ModalBody>
            <ModalActions>
              <ActionButton
                variant="danger"
                onClick={async () => {
                  if (!payoutRejectionReason.trim()) {
                    toast.error('Please provide a reason for rejection');
                    return;
                  }
                  try {
                    await rejectPayout.mutateAsync({
                      sellerId: sellerToRejectPayout._id || sellerToRejectPayout.id,
                      reason: payoutRejectionReason.trim(),
                    });
                    toast.success('Payout verification rejected');
                    setShowRejectPayoutModal(false);
                    setSellerToRejectPayout(null);
                    setPayoutRejectionReason("");
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to reject payout verification');
                  }
                }}
                disabled={rejectPayout.isPending || !payoutRejectionReason.trim()}
              >
                {rejectPayout.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => {
                setShowRejectPayoutModal(false);
                setSellerToRejectPayout(null);
                setPayoutRejectionReason("");
              }}>
                Cancel
              </ActionButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Reject Seller Modal */}
      {showRejectModal && sellerToReject && (
        <ModalOverlay onClick={() => setShowRejectModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Reject Seller Verification</h3>
              <CloseButton onClick={() => {
                setShowRejectModal(false);
                setSellerToReject(null);
                setRejectionReason("");
              }}>&times;</CloseButton>
            </ModalHeader>
            <ModalBody>
              <p><strong>Seller:</strong> {sellerToReject.shopName || sellerToReject.name}</p>
              <p><strong>Email:</strong> {sellerToReject.email}</p>
              <label style={{ display: 'block', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejecting seller verification..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                required
              />
            </ModalBody>
            <ModalActions>
              <ActionButton
                variant="danger"
                onClick={async () => {
                  if (!rejectionReason.trim()) {
                    toast.error('Please provide a reason for rejection');
                    return;
                  }
                  try {
                    await rejectVerification.mutateAsync({
                      sellerId: sellerToReject._id || sellerToReject.id,
                      reason: rejectionReason.trim(),
                    });
                    toast.success('Seller verification rejected');
                    setShowRejectModal(false);
                    setSellerToReject(null);
                    setRejectionReason("");
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to reject seller verification');
                  }
                }}
                disabled={rejectVerification.isPending || !rejectionReason.trim()}
              >
                {rejectVerification.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => {
                setShowRejectModal(false);
                setSellerToReject(null);
                setRejectionReason("");
              }}>
                Cancel
              </ActionButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Seller Details Modal - No longer used, navigation goes to SellerDetailPage instead */}

      {/* Payout Verification Modal */}
      {selectedSellerForPayout && (
        <PayoutVerificationModal
          seller={selectedSellerForPayout}
          onClose={() => setSelectedSellerForPayout(null)}
        />
      )}

      {/* Reset Balance Modal */}
      {showResetBalanceModal && sellerToResetBalance && (
        <ModalOverlay onClick={() => setShowResetBalanceModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Reset Seller Balance</h3>
              <CloseButton onClick={() => {
                setShowResetBalanceModal(false);
                setSellerToResetBalance(null);
                setResetBalance("");
                setResetBalanceReason("");
              }}>&times;</CloseButton>
            </ModalHeader>
            <ModalBody>
              <p><strong>Seller:</strong> {sellerToResetBalance.shopName || sellerToResetBalance.name}</p>
              <p><strong>Email:</strong> {sellerToResetBalance.email}</p>
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  New Balance (GH₵) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={resetBalance}
                  onChange={(e) => setResetBalance(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                  required
                />
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Reason (Optional)
                </label>
                <textarea
                  value={resetBalanceReason}
                  onChange={(e) => setResetBalanceReason(e.target.value)}
                  placeholder="Enter reason for resetting balance..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
            </ModalBody>
            <ModalActions>
              <ActionButton
                variant="warning"
                onClick={async () => {
                  if (!resetBalance || parseFloat(resetBalance) < 0) {
                    toast.error('Please enter a valid balance amount');
                    return;
                  }
                  try {
                    await resetBalanceMutation.mutateAsync({
                      sellerId: sellerToResetBalance._id || sellerToResetBalance.id,
                      balance: parseFloat(resetBalance),
                      reason: resetBalanceReason.trim() || undefined,
                    });
                    toast.success('Seller balance reset successfully');
                    setShowResetBalanceModal(false);
                    setSellerToResetBalance(null);
                    setResetBalance("");
                    setResetBalanceReason("");
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to reset seller balance');
                  }
                }}
                disabled={resetBalanceMutation.isPending || !resetBalance}
              >
                {resetBalanceMutation.isPending ? 'Resetting...' : 'Confirm Reset'}
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => {
                setShowResetBalanceModal(false);
                setSellerToResetBalance(null);
                setResetBalance("");
                setResetBalanceReason("");
              }}>
                Cancel
              </ActionButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
      <Pagination>
        <PaginationButton
          disabled={currentPagination.page === 1}
          onClick={() => handlePageChange(currentPagination.page - 1)}
        >
          Previous
        </PaginationButton>

        {(() => {
          // Calculate page numbers to display (show 5 pages around current page)
          const maxPagesToShow = 5;
          let startPage = Math.max(1, currentPagination.page - Math.floor(maxPagesToShow / 2));
          let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
          
          // Adjust start if we're near the end
          if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
          }
          
          const pagesToShow = [];
          for (let i = startPage; i <= endPage; i++) {
            pagesToShow.push(i);
          }
          
          return pagesToShow.map((pageNum) => (
            <PaginationButton
              key={pageNum}
              active={pageNum === currentPagination.page}
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </PaginationButton>
          ));
        })()}

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

// Reject Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 1rem;

  h3 {
    margin: 0;
    font-size: 1.5rem;
    color: #2b2d42;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:hover {
    background: #f8f9fa;
  }
`;

const ModalBody = styled.div`
  margin: 1.5rem 0;

  p {
    margin: 0.5rem 0;
    color: #666;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

const ApproveButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ViewDetailsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #4361ee;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #3a56d4;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const VerifyPayoutButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ variant }) => {
    switch (variant) {
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) {
            background: #dc2626;
          }
        `;
      case 'secondary':
        return `
          background: #e9ecef;
          color: #495057;
          &:hover {
            background: #dee2e6;
          }
        `;
      case 'warning':
        return `
          background: #f59e0b;
          color: white;
          &:hover:not(:disabled) {
            background: #d97706;
          }
        `;
      default:
        return `
          background: #4361ee;
          color: white;
          &:hover {
            background: #3a56d4;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SortContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

const SortLabel = styled.span`
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
`;

const SortButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${(props) => (props.active ? "#4361ee" : "#ddd")};
  border-radius: 6px;
  background: ${(props) => (props.active ? "#4361ee20" : "white")};
  color: ${(props) => (props.active ? "#4361ee" : "#666")};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  font-weight: 500;

  &:hover {
    border-color: #4361ee;
    color: #4361ee;
    background: #4361ee10;
  }
`;
