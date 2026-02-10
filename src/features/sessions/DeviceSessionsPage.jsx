import { useState, useMemo } from "react";
import styled from "styled-components";
import {
  FaSearch,
  FaFilter,
  FaTrash,
  FaEye,
  FaTimes,
  FaDesktop,
  FaMobile,
  FaTablet,
  FaLaptop,
  FaAngleLeft,
  FaAngleRight,
  FaUserShield,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  useDeviceSessions,
  useForceLogoutDevice,
  useForceLogoutUser,
  useSuspiciousLogins,
} from "../../shared/hooks/useDeviceSessions";
import { formatDate } from "../../shared/utils/helpers";
import { toast } from "react-toastify";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";

const Container = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const TitleSection = styled.div`
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 0.5rem 0;
  }
  p {
    color: #7f8c8d;
    margin: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;

  .icon {
    font-size: 2rem;
    color: ${(props) => props.color || "#3498db"};
  }

  .content {
    flex: 1;

    .label {
      font-size: 0.875rem;
      color: #7f8c8d;
      margin-bottom: 0.25rem;
    }

    .value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2c3e50;
    }
  }
`;

const ControlsSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const SearchBar = styled.div`
  flex: 1;
  min-width: 300px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.95rem;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: #3498db;
    color: #3498db;
  }
`;

const FiltersPanel = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const FilterGroup = styled.div`
  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }

  select,
  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-size: 0.95rem;
  }
`;

const TableContainer = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.875rem;
  text-transform: uppercase;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;

  &:hover {
    background: #f8f9fa;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  font-size: 0.9rem;
  color: #34495e;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
`;

const StatusBadge = styled(Badge)`
  background: ${(props) => (props.active ? "#2ecc71" : "#95a5a6")};
  color: white;
`;

const PlatformBadge = styled(Badge)`
  background: ${(props) => {
    if (props.platform === "eazmain") return "#3498db";
    if (props.platform === "eazseller") return "#e67e22";
    return "#9b59b6";
  }};
  color: white;
`;

const DeviceTypeIcon = styled.span`
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-right: 0.5rem;
`;

const ActionButtonCell = styled(TableCell)`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: #7f8c8d;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    color: #2c3e50;
  }

  &.delete:hover {
    color: #e74c3c;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
`;

const PaginationInfo = styled.div`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const PageButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: #3498db;
    color: #3498db;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.active {
    background: #3498db;
    color: white;
    border-color: #3498db;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
`;

const getDeviceIcon = (deviceType) => {
  switch (deviceType) {
    case "mobile":
      return <FaMobile />;
    case "tablet":
      return <FaTablet />;
    case "desktop":
      return <FaDesktop />;
    default:
      return <FaLaptop />;
  }
};

export default function DeviceSessionsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const params = useMemo(() => {
    const queryParams = {
      page,
      limit,
    };
    if (statusFilter !== "all") queryParams.status = statusFilter;
    if (deviceTypeFilter !== "all") queryParams.deviceType = deviceTypeFilter;
    if (platformFilter !== "all") queryParams.platform = platformFilter;
    if (suspiciousOnly) queryParams.suspicious = "true";
    return queryParams;
  }, [page, limit, statusFilter, deviceTypeFilter, platformFilter, suspiciousOnly]);

  const {
    data: sessionsData,
    isLoading,
    error,
    refetch,
  } = useDeviceSessions(params);

  const { data: suspiciousData } = useSuspiciousLogins();
  const forceLogoutDevice = useForceLogoutDevice();
  const forceLogoutUser = useForceLogoutUser();

  // Debug: Log the API response
  if (sessionsData) {
    console.log('[DeviceSessionsPage] API Response:', sessionsData);
  }
  if (error) {
    console.error('[DeviceSessionsPage] API Error:', error);
  }

  const sessions = sessionsData?.data?.sessions || sessionsData?.sessions || [];
  const total = sessionsData?.total || sessionsData?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const stats = useMemo(() => {
    const active = sessions.filter((s) => s.isActive).length;
    const inactive = sessions.filter((s) => !s.isActive).length;
    const suspicious = suspiciousData?.data?.count || 0;
    return { active, inactive, suspicious, total: sessions.length };
  }, [sessions, suspiciousData]);

  const handleLogoutDevice = (deviceId) => {
    if (window.confirm("Are you sure you want to logout this device?")) {
      forceLogoutDevice.mutate(deviceId, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  const handleLogoutUser = (userId) => {
    if (
      window.confirm(
        "Are you sure you want to logout ALL sessions for this user?"
      )
    ) {
      forceLogoutUser.mutate(userId, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSession(null);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredSessions = useMemo(() => {
    if (!search) return sessions;
    const searchLower = search.toLowerCase();
    return sessions.filter(
      (session) =>
        session.user?.name?.toLowerCase().includes(searchLower) ||
        session.user?.email?.toLowerCase().includes(searchLower) ||
        session.ipAddress?.toLowerCase().includes(searchLower) ||
        session.deviceId?.toLowerCase().includes(searchLower)
    );
  }, [sessions, search]);

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Container>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#e74c3c' }}>Error Loading Device Sessions</h2>
          <p style={{ color: '#7f8c8d' }}>
            {error.response?.data?.message || error.message || 'Failed to load device sessions'}
          </p>
          <button
            onClick={() => refetch()}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <TitleSection>
          <h1>Device Sessions</h1>
          <p>Manage and monitor all device sessions across the platform</p>
        </TitleSection>
      </Header>

      <StatsGrid>
        <StatCard color="#2ecc71">
          <div className="icon">
            <FaDesktop />
          </div>
          <div className="content">
            <div className="label">Active Sessions</div>
            <div className="value">{stats.active}</div>
          </div>
        </StatCard>
        <StatCard color="#95a5a6">
          <div className="icon">
            <FaDesktop />
          </div>
          <div className="content">
            <div className="label">Inactive Sessions</div>
            <div className="value">{stats.inactive}</div>
          </div>
        </StatCard>
        <StatCard
          color="#e74c3c"
          as="button"
          type="button"
          onClick={() => {
            setSuspiciousOnly((prev) => !prev);
            setPage(1);
          }}
          title={suspiciousOnly ? "Showing only suspicious user sessions (click to clear)" : "Click to show only sessions from users with suspicious activity (e.g. many IPs or devices)"}
          style={{ cursor: "pointer", textAlign: "left", border: suspiciousOnly ? "2px solid #e74c3c" : undefined }}
        >
          <div className="icon">
            <FaExclamationTriangle />
          </div>
          <div className="content">
            <div className="label">Suspicious Logins</div>
            <div className="value">{stats.suspicious}</div>
            {suspiciousOnly && <div className="label" style={{ marginTop: "0.25rem", fontSize: "0.75rem" }}>Filter active</div>}
          </div>
        </StatCard>
        <StatCard color="#3498db">
          <div className="icon">
            <FaUserShield />
          </div>
          <div className="content">
            <div className="label">Total Sessions</div>
            <div className="value">{stats.total}</div>
          </div>
        </StatCard>
      </StatsGrid>

      <ControlsSection>
        <SearchBar>
          <FaSearch style={{ color: "#8D99AE" }} />
          <input
            type="text"
            placeholder="Search by user, email, IP, or device ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </SearchBar>
        <FilterButton onClick={() => setShowFilters(!showFilters)}>
          <FaFilter /> {showFilters ? "Hide" : "Show"} Filters
        </FilterButton>
      </ControlsSection>

      {showFilters && (
        <FiltersPanel>
          <FilterGroup>
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FilterGroup>

          <FilterGroup>
            <label>Device Type</label>
            <select
              value={deviceTypeFilter}
              onChange={(e) => {
                setDeviceTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Devices</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="desktop">Desktop</option>
              <option value="unknown">Unknown</option>
            </select>
          </FilterGroup>

          <FilterGroup>
            <label>Platform</label>
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Platforms</option>
              <option value="eazmain">EazMain</option>
              <option value="eazseller">EazSeller</option>
              <option value="eazadmin">EazAdmin</option>
            </select>
          </FilterGroup>

          <FilterGroup>
            <label>Suspicious only</label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "normal", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={suspiciousOnly}
                onChange={(e) => {
                  setSuspiciousOnly(e.target.checked);
                  setPage(1);
                }}
              />
              Show only sessions from users with 4+ IPs or 6+ devices
            </label>
          </FilterGroup>
        </FiltersPanel>
      )}

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Device</TableHeaderCell>
              <TableHeaderCell>Platform</TableHeaderCell>
              <TableHeaderCell>IP Address</TableHeaderCell>
              <TableHeaderCell>Location</TableHeaderCell>
              <TableHeaderCell>Login Time</TableHeaderCell>
              <TableHeaderCell>Last Activity</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  style={{ textAlign: "center", padding: "3rem" }}
                >
                  No device sessions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => (
                <TableRow key={session.sessionId}>
                  <TableCell>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {session.user?.name || "Unknown"}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#7f8c8d" }}>
                        {session.user?.email || session.user?.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <DeviceTypeIcon>
                        {getDeviceIcon(session.deviceType)}
                      </DeviceTypeIcon>
                      <div>
                        <div>{session.browser}</div>
                        <div style={{ fontSize: "0.8rem", color: "#7f8c8d" }}>
                          {session.os}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PlatformBadge platform={session.platform}>
                      {session.platform}
                    </PlatformBadge>
                  </TableCell>
                  <TableCell>{session.ipAddress || "N/A"}</TableCell>
                  <TableCell>{session.location || "Unknown"}</TableCell>
                  <TableCell>{formatDate(session.loginTime)}</TableCell>
                  <TableCell>{formatDate(session.lastActivity)}</TableCell>
                  <TableCell>
                    <StatusBadge active={session.isActive}>
                      {session.isActive ? "Active" : "Inactive"}
                    </StatusBadge>
                  </TableCell>
                  <ActionButtonCell>
                    <IconButton
                      onClick={() => handleViewDetails(session)}
                      title="View Details"
                    >
                      <FaEye />
                    </IconButton>
                    <IconButton
                      className="delete"
                      onClick={() => handleLogoutDevice(session.deviceId)}
                      disabled={forceLogoutDevice.isPending}
                      title="Logout Device"
                    >
                      <FaTrash />
                    </IconButton>
                  </ActionButtonCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Pagination>
          <PaginationInfo>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)}{" "}
            of {total} sessions
          </PaginationInfo>
          <PaginationControls>
            <PageButton
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <FaAngleLeft />
            </PageButton>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <PageButton
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={page === pageNum ? "active" : ""}
                >
                  {pageNum}
                </PageButton>
              );
            })}
            <PageButton
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              <FaAngleRight />
            </PageButton>
          </PaginationControls>
        </Pagination>
      )}

      {showModal && selectedSession && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <h2 style={{ margin: 0, color: "#2c3e50" }}>Session Details</h2>
              <IconButton onClick={handleCloseModal}>
                <FaTimes />
              </IconButton>
            </div>
            <div>
              {Object.entries(selectedSession).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    marginBottom: "1rem",
                    paddingBottom: "1rem",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#7f8c8d",
                      textTransform: "uppercase",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {key}
                  </label>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      color: "#2c3e50",
                      wordBreak: "break-word",
                    }}
                  >
                    {typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

