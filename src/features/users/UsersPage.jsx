import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { PATHS } from '../../routes/routePath';
import {
  Table,
  RoleCell,
  UserCell,
  StatusCell,
  DateCell,
  LastActiveCell,
  VerificationStatusCell,
  OrderCountCell,
  ReferralCell,
} from '../../shared/components/Table';
import { FaCheckCircle, FaTimesCircle, FaUndo, FaClock, FaEye, FaWallet } from 'react-icons/fa';
import { toast } from 'react-toastify';
import EditUserModal from '../../shared/components/Modal/EditUserModal';
import AddUserModal from '../../shared/components/Modal/AddUserModal';
import PayoutVerificationModal from '../../shared/components/Modal/payoutVerificationModal';
import { useResetSellerBalance } from '../../shared/hooks/useSellerBalance';
import { ConfirmationModal } from '../../shared/components/Modal/ConfirmationModal';
import {
  PageHeader,
  PageTitle,
  PageSub,
  HeaderActions,
} from '../../shared/components/page/PageHeader';
import useAuth from '../../shared/hooks/useAuth';
import adminUserApi from '../../shared/services/adminUserApi';

const T = {
  primary: 'var(--color-primary-600)',
  primaryLight: 'var(--color-primary-500)',
  primaryBg: 'var(--color-primary-100)',
  border: 'var(--color-border)',
  cardBg: 'var(--color-card-bg)',
  bodyBg: 'var(--color-body-bg)',
  text: 'var(--color-grey-900)',
  textMuted: 'var(--color-grey-500)',
  textLight: 'var(--color-grey-400)',
  radius: 'var(--border-radius-xl)',
  radiusSm: 'var(--border-radius-md)',
  shadow: 'var(--shadow-sm)',
  shadowMd: 'var(--shadow-md)',
};

/** Matches `adminModel.role` in the API — not the same as a single literal `"admin"`. */
const ADMIN_TABLE_ROLES = ['admin', 'superadmin', 'support_agent'];
const isAdminTableRow = (u) => u && ADMIN_TABLE_ROLES.includes(u.role);

const VALID_USER_TABS = new Set(['users', 'sellers', 'admins']);

// Dynamic Table Component

export default function UsersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = VALID_USER_TABS.has(tabParam) ? tabParam : 'users';

  const setActiveTab = useCallback(
    (tab) => {
      if (!VALID_USER_TABS.has(tab)) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', tab);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [verificationStatusFilter, setVerificationStatusFilter] = useState("all"); // For sellers tab
  const [actionMenu, setActionMenu] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
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

  const queryClient = useQueryClient();
  const { adminData } = useAuth();
  const currentAdmin = useMemo(() => {
    if (!adminData) return null;
    const fromMe = adminData.data?.data?.data;
    if (fromMe) return fromMe;
    if (adminData.role && (adminData.email || adminData.name)) return adminData;
    if (adminData.data?.role) return adminData.data;
    return null;
  }, [adminData]);
  const defaultReferral = currentAdmin
    ? [currentAdmin.name, currentAdmin.email].filter(Boolean).join(' — ')
    : '';
  const canManageAdmins = currentAdmin?.role === 'superadmin';

  const provisionAccountMutation = useMutation({
    mutationFn: async ({ accountType, name, email, shopName, role, referral }) => {
      if (accountType === 'admin' && !canManageAdmins) {
        throw new Error('Only a superadmin can create administrator accounts.');
      }
      const body = { name, email, referral };
      if (accountType === 'user') {
        return (await adminUserApi.provisionBuyerAccount(body)).data;
      }
      if (accountType === 'seller') {
        return (await adminUserApi.provisionSellerAccount({ ...body, shopName })).data;
      }
      return (await adminUserApi.provisionAdminAccount({ ...body, role })).data;
    },
    onSuccess: (data) => {
      toast.success(
        data?.message ||
          'Account created. Sign-in instructions were emailed to the user.',
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      setIsAddUserModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Could not create this account.',
      );
    },
  });

  const handleProvisionAccount = (payload) =>
    provisionAccountMutation.mutateAsync(payload);

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
    error: sellersError,
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
  } = useAdminsAdmin(pagination.admins.page, pagination.admins.limit, {
    enabled: canManageAdmins,
  });

  useEffect(() => {
    if (activeTab === "admins" && !canManageAdmins) {
      setActiveTab("users");
    }
  }, [activeTab, canManageAdmins, setActiveTab]);

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
      const admins = allAdmins.filter(isAdminTableRow);
      const activeAdmins = admins.filter((u) => u.status === "active").length;
      const inactiveAdmins = admins.filter(
        (u) => u.status === "inactive" || u.status === "deactive"
      ).length;
      const superAdmins = admins.filter((u) => u.role === "superadmin").length;

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
      { Header: "Referral", accessor: "referral", Cell: ReferralCell },
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
        .filter(isAdminTableRow)
        .map((admin) => ({
          ...admin,
          // Ensure id points to _id (MongoDB ObjectId) if _id exists
          id: admin._id || admin.id,
          lastLogin: admin.lastLogin || generateLastLogin(admin.createdAt),
        })),
    };

    if (activeTab === "admins" && !canManageAdmins) {
      return [];
    }

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
    setUserToDelete(item);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setActionMenu(null);
      setUserToDelete(null);
    }
  };

  const handleViewDetails = (item) => {
    // Navigate to detail page based on active tab
    const userId = item._id || item.id;

    if (userId) {
      // Validate that it's not a simple sequential number (like 1, 2, 3)
      const isNumericId = !isNaN(userId) && parseInt(userId) < 1000;
      if (!isNumericId || (typeof userId === 'string' && userId.length > 5)) {
        let path = '';
        if (activeTab === "sellers") {
          path = `/dashboard/${PATHS.SELLERDETAIL.replace(':id', userId)}`;
        } else if (activeTab === "admins" && canManageAdmins) {
          path = `/dashboard/${PATHS.ADMINDETAIL.replace(':id', userId)}`;
        } else {
          path = `/dashboard/${PATHS.USERDETAIL.replace(':id', userId)}`;
        }
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

  if (
    isSellerLoading ||
    isUsersLoading ||
    (canManageAdmins && isAdminLoading)
  ) {
    return <div>Loading...</div>;
  }
  return (
    <UserManagementContainer>
      <PageHeader>
        <div>
          <PageTitle>User Management</PageTitle>
          <PageSub>Manage all users, vendors, and administrators</PageSub>
        </div>
        <HeaderActions>
          <ActionButton onClick={() => setIsAddUserModalOpen(true)}>
            <FaUserPlus /> Add New User
          </ActionButton>
        </HeaderActions>
      </PageHeader>

      {/* Tabs Section */}
      <TabsContainer>
        <Tab
          $active={activeTab === "users"}
          onClick={() => setActiveTab("users")}
        >
          <FaUserAlt /> Users
        </Tab>
        <Tab
          $active={activeTab === "sellers"}
          onClick={() => setActiveTab("sellers")}
        >
          <FaStore /> Sellers
        </Tab>
        {canManageAdmins && (
          <Tab
            $active={activeTab === "admins"}
            onClick={() => setActiveTab("admins")}
          >
            <FaUserShield /> Admins
          </Tab>
        )}
      </TabsContainer>

      <ControlsSection>
        <SearchBar>
          <FaSearch style={{ color: "#8D99AE" }} />
          <input
            type="text"
            placeholder={
              activeTab === 'sellers'
                ? 'Search sellers by name, email, shop, or referral...'
                : `Search ${activeTab} by name, email, or vendor...`
            }
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
              $active={sellerSort.startsWith("createdAt")}
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
              $active={sellerSort.startsWith("name")}
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
              $active={sellerSort.startsWith("shopName")}
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
            <StatIcon style={{ background: "rgba(187, 108, 2, 0.13)", color: "#bb6c02" }}>
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
            <StatIcon style={{ background: "rgba(187, 108, 2, 0.13)", color: "#bb6c02" }}>
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
            <StatIcon style={{ background: "rgba(187, 108, 2, 0.13)", color: "var(--color-primary-600)" }}>
              <FaChartLine />
            </StatIcon>
            <StatInfo>
              <StatValue>{tabStats.active || 0}</StatValue>
              <StatLabel>Active Sellers</StatLabel>
            </StatInfo>
          </StatCard>
        </StatsSummary>
      )}

      {canManageAdmins && activeTab === "admins" && (
        <StatsSummary>
          <StatCard>
            <StatIcon style={{ background: "rgba(187, 108, 2, 0.13)", color: "#bb6c02" }}>
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

      {/* Seller fetch error banner */}
      {activeTab === "sellers" && sellersError && (
        <div style={{
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          background: "#fff1f0",
          border: "1px solid #ffa39e",
          borderRadius: "6px",
          color: "#cf1322",
          fontSize: "0.875rem",
        }}>
          Failed to load sellers: {sellersError?.response?.data?.message || sellersError?.message || "Unknown error"}
        </div>
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
          key={activeTab}
          onClose={handleClose}
          onSubmit={handleProvisionAccount}
          defaultReferral={defaultReferral}
          canCreateAdmin={canManageAdmins}
          initialAccountType={
            activeTab === 'users' ? 'user' : activeTab === 'sellers' ? 'seller' : 'admin'
          }
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
              $active={pageNum === currentPagination.page}
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
/* Spacing comes from DashboardLayout MainContentContainer (--layout-content-padding). */
const UserManagementContainer = styled.div`
  padding: 0;
  background-color: ${T.bodyBg};
  min-height: 100%;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${T.border};
  margin-bottom: var(--layout-section-gap);
  padding: 0 var(--layout-tight-gap);
`;

const Tab = styled.div`
  padding: var(--space-sm) var(--space-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--layout-inline-gap);
  font-weight: 500;
  border-bottom: 3px solid transparent;
  color: ${({ $active }) => ($active ? "#bb6c02" : "#8D99AE")};
  border-bottom-color: ${({ $active }) =>
    $active ? "#bb6c02" : "transparent"};
  transition: all 0.3s;

  &:hover {
    color: #bb6c02;
  }
`;

const ControlsSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--layout-section-gap);
  gap: var(--layout-stack-gap);
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: ${T.cardBg};
  border: 1px solid ${T.border};
  border-radius: ${T.radius};
  padding: var(--space-sm) var(--space-md);
  box-shadow: ${T.shadow};
  flex: 1;
  max-width: 500px;

  input {
    border: none;
    padding: var(--layout-tight-gap) var(--layout-inline-gap);
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
  gap: var(--layout-inline-gap);
  padding: var(--space-sm) var(--space-md);
  background: ${T.cardBg};
  color: ${T.primary};
  border: 1.5px solid ${T.border};
  border-radius: ${T.radiusSm};
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  box-shadow: ${T.shadow};

  &:hover {
    background: ${T.primaryBg};
    border-color: ${T.primary};
  }
`;

const FiltersPanel = styled.div`
  background: ${T.cardBg};
  border: 1px solid ${T.border};
  border-radius: ${T.radius};
  padding: var(--layout-section-gap);
  margin-bottom: var(--layout-section-gap);
  box-shadow: ${T.shadow};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--layout-section-gap);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FilterGroup = styled.div`
  label {
    display: block;
    margin-bottom: 0.6rem;
    font-weight: 600;
    color: ${T.textMuted};
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.9rem 1.2rem;
  border-radius: ${T.radiusSm};
  border: 1.5px solid ${T.border};
  background: ${T.cardBg};
  font-size: var(--text-sm);
  color: ${T.text};
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
  transition: border-color var(--transition-fast);

  &:focus {
    outline: none;
    border-color: ${T.primary};
    box-shadow: 0 0 0 3px ${T.primaryBg};
  }
`;

const DateRangeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;

  input {
    flex: 1;
    padding: 0.9rem 1.2rem;
    border-radius: ${T.radiusSm};
    border: 1.5px solid ${T.border};
    font-size: var(--text-sm);
    color: ${T.text};
    background: ${T.cardBg};
    transition: border-color var(--transition-fast);

    &:focus {
      outline: none;
      border-color: ${T.primary};
      box-shadow: 0 0 0 3px ${T.primaryBg};
    }
  }

  span {
    color: ${T.textLight};
    font-size: var(--text-sm);
  }
`;

const ApplyFiltersButton = styled.button`
  background: ${T.primary};
  color: #fff;
  border: none;
  padding: 1rem 2rem;
  border-radius: ${T.radiusSm};
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
  align-self: flex-end;

  &:hover {
    background: var(--color-primary-700);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StatsSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.2rem;
  margin-bottom: 1.8rem;
`;

const StatCard = styled.div`
  background: ${T.cardBg};
  border: 1px solid ${T.border};
  border-radius: ${T.radius};
  padding: 1.2rem 1.4rem;
  box-shadow: ${T.shadow};
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: ${T.shadowMd};
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div`
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
`;

const StatInfo = styled.div``;

const StatValue = styled.div`
  font-size: var(--text-xl);
  font-weight: 700;
  color: ${T.text};
  margin-bottom: 0.2rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
`;

const StatLabel = styled.div`
  color: ${T.textMuted};
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.25;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.6rem;
  padding: 2rem 0 1rem;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  min-width: 3.6rem;
  padding: 0 1.4rem;
  height: 3.6rem;
  border-radius: ${T.radiusSm};
  border: 1.5px solid ${({ $active }) => ($active ? T.primary : T.border)};
  background: ${({ $active }) => ($active ? T.primary : T.cardBg)};
  color: ${({ $active }) => ($active ? '#fff' : T.text)};
  font-size: var(--text-sm);
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background: ${({ $active }) =>
      $active ? 'var(--color-primary-700)' : T.primaryBg};
    border-color: ${T.primary};
    color: ${({ $active }) => ($active ? '#fff' : T.primary)};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
const PageInfo = styled.span`
  padding: 0.6rem 1rem;
  color: ${T.textMuted};
  font-size: var(--text-sm);
`;

const ItemsPerPageSelect = styled.select`
  margin-left: 0.8rem;
  padding: 0.7rem 1rem;
  border-radius: ${T.radiusSm};
  border: 1.5px solid ${T.border};
  background: ${T.cardBg};
  color: ${T.text};
  font-size: var(--text-sm);
  cursor: pointer;
  transition: border-color var(--transition-fast);

  &:focus {
    outline: none;
    border-color: ${T.primary};
  }
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
  background: ${T.cardBg};
  border-radius: ${T.radius};
  padding: 2.4rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 1rem 4rem rgba(0, 0, 0, 0.18);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.6rem;
  border-bottom: 1px solid ${T.border};
  padding-bottom: 1.2rem;

  h3 {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 700;
    color: ${T.text};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: ${T.textMuted};
  width: 3.2rem;
  height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background var(--transition-fast);

  &:hover {
    background: ${T.bodyBg};
    color: ${T.text};
  }
`;

const ModalBody = styled.div`
  margin: 1.6rem 0;

  p {
    margin: 0.5rem 0;
    color: ${T.textMuted};
    font-size: var(--text-sm);
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
  background: #bb6c02;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--color-primary-700);
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
          background: ${T.bodyBg};
          color: ${T.textMuted};
          border: 1.5px solid ${T.border};
          &:hover { background: ${T.border}; color: ${T.text}; }
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
          background: ${T.primary};
          color: white;
          border-radius: ${T.radiusSm};
          &:hover {
            background: var(--color-primary-700);
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
  color: ${T.textMuted};
  font-size: var(--text-sm);
  font-weight: 500;
`;

const SortButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${(props) => (props.$active ? "#bb6c02" : "#ddd")};
  border-radius: 6px;
  background: ${(props) =>
    props.$active ? "rgba(187, 108, 2, 0.13)" : "white"};
  color: ${(props) => (props.$active ? "#bb6c02" : "#666")};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  font-weight: 500;

  &:hover {
    border-color: #bb6c02;
    color: #bb6c02;
    background: rgba(187, 108, 2, 0.06);
  }
`;
