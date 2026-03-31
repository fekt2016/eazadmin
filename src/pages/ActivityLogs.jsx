import { useState, useMemo } from "react";
import styled from "styled-components";
import {
  FaSearch,
  FaFilter,
  FaTrash,
  FaEye,
  FaTimes,
  FaCalendarAlt,
  FaUser,
  FaDesktop,
  FaAngleLeft,
  FaAngleRight,
  FaBroom,
} from "react-icons/fa";
import useActivityLogs from "../shared/hooks/useActivityLogs";
import { toast } from "react-toastify";
import { LoadingSpinner } from "../shared/components/LoadingSpinner";
import DeviceSessionsPage from "../features/sessions/DeviceSessionsPage";
import { ConfirmationModal } from "../shared/components/Modal/ConfirmationModal";
import { HOMEPAGE_EVENT_LABELS } from "../shared/constants/homepageExperimentEvents";

const Container = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
`;

const TabsContainer = styled.div`
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid #e0e0e0;
  padding: 0.15rem;
  background: #f9fafb;
  margin-bottom: 1.5rem;
`;

const TabButton = styled.button`
  border: none;
  background: ${(props) => (props.$active ? '#fff' : 'transparent')};
  color: ${(props) => (props.$active ? '#1a1a1a' : '#666')};
  padding: 0.6rem 1.25rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: ${(props) => (props.$active ? '500' : '400')};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${(props) =>
    props.$active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};

  &:hover {
    color: #1a1a1a;
  }
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

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;

  &:hover {
    background: #c0392b;
  }

  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
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

const RoleBadge = styled(Badge)`
  background: ${(props) => {
    if (props.role === "admin") return "#e74c3c";
    if (props.role === "seller") return "#3498db";
    return "#2ecc71";
  }};
  color: white;
`;

const PlatformBadge = styled(Badge)`
  background: #ecf0f1;
  color: #2c3e50;
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

const InsightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const InsightCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.85rem 1rem;
`;

const InsightLabel = styled.div`
  color: #7f8c8d;
  font-size: 0.8rem;
  margin-bottom: 0.35rem;
`;

const InsightValue = styled.div`
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 700;
`;

const InsightSub = styled.div`
  color: #7f8c8d;
  font-size: 0.78rem;
  margin-top: 0.2rem;
`;

const InsightTrendRow = styled.div`
  margin-top: 0.65rem;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.35rem;
`;

const InsightTrendItem = styled.div`
  border: 1px solid #eef2f7;
  border-radius: 6px;
  padding: 0.3rem 0.25rem;
  text-align: center;
  background: ${({ $intensity = 0 }) =>
    `rgba(52, 152, 219, ${0.08 + $intensity * 0.2})`};
  border-color: ${({ $intensity = 0 }) =>
    `rgba(52, 152, 219, ${0.15 + $intensity * 0.35})`};
`;

const InsightTrendDate = styled.div`
  color: #94a3b8;
  font-size: 0.65rem;
  margin-bottom: 0.15rem;
`;

const InsightTrendValue = styled.div`
  color: #1e293b;
  font-size: 0.72rem;
  font-weight: 700;
`;

const Modal = styled.div`
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
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;

  h2 {
    margin: 0;
    color: #2c3e50;
  }
`;

const ModalBody = styled.div`
  .detail-row {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #7f8c8d;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }

    .value {
      font-size: 0.95rem;
      color: #2c3e50;
      word-break: break-word;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
`;

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatActivityDescription = (description) => {
  if (!description || typeof description !== 'string') return description;
  const prefix = 'Viewed screen: ';
  if (!description.startsWith(prefix)) return description;

  const rawScreen = description.slice(prefix.length).trim();
  if (!rawScreen.startsWith('home:')) return description;

  const [, eventName = '', variant = '', metadata = ''] = rawScreen.split(':');
  const readableEvent = HOMEPAGE_EVENT_LABELS[eventName]
    || `Unmapped homepage event (${eventName || 'unknown'})`;
  const readableVariant = variant ? `Variant ${variant}` : null;
  const readableMetadata = metadata
    ? metadata.replace(/[-_]/g, ' ')
    : null;

  return [readableEvent, readableVariant, readableMetadata]
    .filter(Boolean)
    .join(' | ');
};

const parseHomepageScreenEvent = (description) => {
  if (!description || typeof description !== 'string') return null;
  const prefix = 'Viewed screen: ';
  if (!description.startsWith(prefix)) return null;
  const rawScreen = description.slice(prefix.length).trim();
  if (!rawScreen.startsWith('home:')) return null;
  const [, eventName = '', variant = '', metadata = ''] = rawScreen.split(':');
  return {
    eventName,
    variant: (variant || 'unknown').toUpperCase(),
    metadata,
  };
};

export default function ActivityLogs() {
  const [activeTab, setActiveTab] = useState('activity-logs'); // 'activity-logs' | 'device-sessions'
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, type: null, logId: null });

  const dateRange = useMemo(() => {
    if (startDate || endDate) {
      return {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
    }
    return null;
  }, [startDate, endDate]);

  const {
    logs,
    total,
    totalPages,
    isLoading,
    deleteLog,
    deleteAllLogs,
    cleanupOldLogs,
    isDeleting,
    isDeletingAll,
    homepageExperimentStats,
  } = useActivityLogs({
    page,
    limit,
    role: roleFilter !== "all" ? roleFilter : null,
    platform: platformFilter !== "all" ? platformFilter : null,
    dateRange,
    search,
  });

  const homepageInsights = useMemo(() => {
    if (homepageExperimentStats) {
      const byVariant = (homepageExperimentStats.byVariant || []).reduce(
        (acc, item) => {
          acc[item.variant] = {
            impressions: item.impressions || 0,
            interactions: item.interactions || 0,
          };
          return acc;
        },
        {}
      );

      return {
        impressions: homepageExperimentStats.impressions || 0,
        interactions: homepageExperimentStats.interactions || 0,
        ctr: homepageExperimentStats.ctr || 0,
        byVariant,
        byDay: homepageExperimentStats.byDay || [],
      };
    }

    const homepageEvents = logs
      .map((log) => parseHomepageScreenEvent(log.description))
      .filter(Boolean);

    if (homepageEvents.length === 0) {
      return null;
    }

    const impressions = homepageEvents.filter(
      (event) => event.eventName === 'variant_seen'
    ).length;
    const interactions = homepageEvents.filter(
      (event) => event.eventName !== 'variant_seen'
    ).length;
    const ctr = impressions > 0 ? (interactions / impressions) * 100 : 0;

    const byVariant = homepageEvents.reduce((acc, event) => {
      if (!acc[event.variant]) {
        acc[event.variant] = { impressions: 0, interactions: 0 };
      }
      if (event.eventName === 'variant_seen') {
        acc[event.variant].impressions += 1;
      } else {
        acc[event.variant].interactions += 1;
      }
      return acc;
    }, {});

    return {
      impressions,
      interactions,
      ctr,
      byVariant,
      byDay: [],
    };
  }, [homepageExperimentStats, logs]);

  const handleDelete = (logId) => {
    setDeleteModalState({ isOpen: true, type: 'single', logId });
  };

  const handleDeleteAll = () => {
    setDeleteModalState({ isOpen: true, type: 'all', logId: null });
  };

  const confirmDelete = () => {
    if (deleteModalState.type === 'single' && deleteModalState.logId) {
      deleteLog(deleteModalState.logId, {
        onSuccess: () => {
          toast.success("Log deleted successfully");
        },
        onError: () => {
          toast.error("Failed to delete log");
        },
        onSettled: () => setDeleteModalState({ isOpen: false, type: null, logId: null })
      });
    } else if (deleteModalState.type === 'all') {
      deleteAllLogs(undefined, {
        onSuccess: () => {
          toast.success("All logs deleted successfully");
        },
        onError: () => {
          toast.error("Failed to delete logs");
        },
        onSettled: () => setDeleteModalState({ isOpen: false, type: null, logId: null })
      });
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLog(null);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <TitleSection>
          <h1>Activity & Sessions</h1>
          <p>Monitor all user activities and device sessions across the platform</p>
        </TitleSection>
        {activeTab === 'activity-logs' && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <ActionButton
              onClick={() => cleanupOldLogs(90)}
              style={{ background: "#95a5a6" }}
            >
              <FaBroom /> Cleanup (90 days)
            </ActionButton>
            <ActionButton onClick={handleDeleteAll} disabled={isDeletingAll}>
              <FaTrash /> Clear All Logs
            </ActionButton>
          </div>
        )}
      </Header>

      <TabsContainer>
        <TabButton
          type="button"
          $active={activeTab === 'activity-logs'}
          onClick={() => setActiveTab('activity-logs')}
        >
          Activity Logs
        </TabButton>
        <TabButton
          type="button"
          $active={activeTab === 'device-sessions'}
          onClick={() => setActiveTab('device-sessions')}
        >
          Device Sessions
        </TabButton>
      </TabsContainer>

      {activeTab === 'activity-logs' && (
        <>
          <ControlsSection>
            <SearchBar>
              <FaSearch style={{ color: "#8D99AE" }} />
              <input
                type="text"
                placeholder="Search by action, description, or user..."
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
                <label>Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Roles</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
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
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </FilterGroup>

              <FilterGroup>
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </FilterGroup>
            </FiltersPanel>
          )}

          {homepageInsights && (
            <InsightGrid>
              <InsightCard>
                <InsightLabel>Homepage impressions</InsightLabel>
                <InsightValue>{homepageInsights.impressions}</InsightValue>
                <InsightSub>Variant seen events</InsightSub>
              </InsightCard>
              <InsightCard>
                <InsightLabel>Homepage interactions</InsightLabel>
                <InsightValue>{homepageInsights.interactions}</InsightValue>
                <InsightSub>Quick actions, filters, sticky clicks</InsightSub>
              </InsightCard>
              <InsightCard>
                <InsightLabel>Interaction rate</InsightLabel>
                <InsightValue>{homepageInsights.ctr.toFixed(1)}%</InsightValue>
                <InsightSub>Interactions / impressions</InsightSub>
              </InsightCard>
              <InsightCard>
                <InsightLabel>Variant split</InsightLabel>
                <InsightValue>
                  {Object.entries(homepageInsights.byVariant)
                    .map(
                      ([variant, counts]) =>
                        `${variant}: ${counts.impressions}/${counts.interactions}`
                    )
                    .join(' | ')}
                </InsightValue>
                <InsightSub>Impressions/interactions by variant</InsightSub>
                {homepageInsights.byDay?.length > 0 && (
                  <InsightTrendRow>
                    {(() => {
                      const last7Days = homepageInsights.byDay.slice(-7);
                      const maxInteractions = Math.max(
                        ...last7Days.map((day) => day.interactions || 0),
                        1
                      );
                      return last7Days.map((day) => {
                        const intensity = (day.interactions || 0) / maxInteractions;
                        return (
                          <InsightTrendItem key={day.date} $intensity={intensity}>
                            <InsightTrendDate>
                              {new Date(day.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </InsightTrendDate>
                            <InsightTrendValue>
                              {day.impressions}/{day.interactions}
                            </InsightTrendValue>
                          </InsightTrendItem>
                        );
                      });
                    })()}
                  </InsightTrendRow>
                )}
              </InsightCard>
            </InsightGrid>
          )}

          <TableContainer>
            <Table>
              <TableHeader>
                <tr>
                  <TableHeaderCell>User</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell>Platform</TableHeaderCell>
                  <TableHeaderCell>IP Address</TableHeaderCell>
                  <TableHeaderCell>Timestamp</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: "center", padding: "3rem" }}>
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        {log.userId?.name || log.userId?.email || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={log.role}>{log.role}</RoleBadge>
                      </TableCell>
                      <TableCell>
                        <strong>{log.action}</strong>
                      </TableCell>
                      <TableCell style={{ maxWidth: "300px" }}>
                        {formatActivityDescription(log.description)}
                      </TableCell>
                      <TableCell>
                        <PlatformBadge>{log.platform}</PlatformBadge>
                      </TableCell>
                      <TableCell>{log.ipAddress || "N/A"}</TableCell>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <ActionButtonCell>
                        <IconButton onClick={() => handleViewDetails(log)}>
                          <FaEye />
                        </IconButton>
                        <IconButton
                          className="delete"
                          onClick={() => handleDelete(log._id)}
                          disabled={isDeleting}
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
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{" "}
                logs
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

          {showModal && selectedLog && (
            <Modal onClick={handleCloseModal}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <h2>Activity Log Details</h2>
                  <IconButton onClick={handleCloseModal}>
                    <FaTimes />
                  </IconButton>
                </ModalHeader>
                <ModalBody>
                  <div className="detail-row">
                    <label>User</label>
                    <div className="value">
                      {selectedLog.userId?.name || selectedLog.userId?.email || "Unknown"}
                    </div>
                  </div>
                  <div className="detail-row">
                    <label>Role</label>
                    <div className="value">
                      <RoleBadge role={selectedLog.role}>{selectedLog.role}</RoleBadge>
                    </div>
                  </div>
                  <div className="detail-row">
                    <label>Action</label>
                    <div className="value">{selectedLog.action}</div>
                  </div>
                  <div className="detail-row">
                    <label>Description</label>
                    <div className="value">
                      {formatActivityDescription(selectedLog.description)}
                    </div>
                  </div>
                  <div className="detail-row">
                    <label>Platform</label>
                    <div className="value">
                      <PlatformBadge>{selectedLog.platform}</PlatformBadge>
                    </div>
                  </div>
                  <div className="detail-row">
                    <label>IP Address</label>
                    <div className="value">{selectedLog.ipAddress || "N/A"}</div>
                  </div>
                  <div className="detail-row">
                    <label>User Agent</label>
                    <div className="value">{selectedLog.userAgent || "N/A"}</div>
                  </div>
                  <div className="detail-row">
                    <label>Timestamp</label>
                    <div className="value">{formatDate(selectedLog.timestamp)}</div>
                  </div>
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div className="detail-row">
                      <label>Metadata</label>
                      <div className="value">
                        <pre style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </ModalBody>
              </ModalContent>
            </Modal>
          )}
        </>
      )}

      {activeTab === 'device-sessions' && (
        <DeviceSessionsPage embedded />
      )}

      <ConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, type: null, logId: null })}
        onConfirm={confirmDelete}
        title={deleteModalState.type === 'all' ? "Delete All Logs" : "Delete Log"}
        message={deleteModalState.type === 'all'
          ? "Are you sure you want to delete ALL activity logs? This action cannot be undone."
          : "Are you sure you want to delete this log?"}
        confirmText="Delete"
        confirmColor="#dc2626"
      />
    </Container>
  );
}

