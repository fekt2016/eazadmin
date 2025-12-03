import { useState } from 'react';
import styled from 'styled-components';
import { 
  useGetNeighborhoods, 
  useGetNeighborhoodStatistics,
  useRefreshCoordinates,
  useRecalculateNeighborhood,
  useToggleNeighborhoodActive
} from '../../shared/hooks/useNeighborhoods';
import { FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaSearch, FaSort, FaPlus, FaEdit, FaSyncAlt, FaCalculator, FaPowerOff } from 'react-icons/fa';
import NeighborhoodModal from './NeighborhoodModal';
import ButtonSpinner from '../../shared/components/ButtonSpinner';

const DistanceOverviewPage = () => {
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('distanceFromHQ');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNeighborhood, setEditingNeighborhood] = useState(null);

  // Fetch neighborhoods with filters
  const { data: neighborhoodsResponse, isLoading, refetch } = useGetNeighborhoods({
    page: currentPage,
    limit: pageSize,
    zone: selectedZone !== 'all' ? selectedZone : undefined,
    city: selectedCity !== 'all' ? selectedCity : undefined,
    search: searchTerm || undefined,
    sortBy,
    sortOrder,
    isActive: true, // Only show active neighborhoods
  });

  // Fetch statistics
  const { data: statisticsResponse } = useGetNeighborhoodStatistics();

  // Mutations
  const refreshCoordinatesMutation = useRefreshCoordinates();
  const recalculateMutation = useRecalculateNeighborhood();
  const toggleActiveMutation = useToggleNeighborhoodActive();

  const neighborhoods = neighborhoodsResponse?.data?.neighborhoods || [];
  const pagination = neighborhoodsResponse?.pagination || {};
  const statistics = statisticsResponse?.data?.statistics || {};

  const zones = ['A', 'B', 'C', 'D', 'E', 'F'];

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === 'zone') {
      setSelectedZone(value);
    } else if (filterType === 'city') {
      setSelectedCity(value);
    } else if (filterType === 'sortBy') {
      setSortBy(value);
    } else if (filterType === 'sortOrder') {
      setSortOrder(value);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNeighborhood = () => {
    setEditingNeighborhood(null);
    setIsModalOpen(true);
  };

  const handleEditNeighborhood = (neighborhood) => {
    setEditingNeighborhood(neighborhood);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNeighborhood(null);
    refetch(); // Refresh the list after adding/updating
  };

  const handleRefreshCoordinates = async (id) => {
    if (window.confirm('Are you sure you want to refresh coordinates for this neighborhood?')) {
      try {
        await refreshCoordinatesMutation.mutateAsync(id);
        alert('Coordinates refreshed successfully!');
        refetch();
      } catch (error) {
        alert(`Failed to refresh coordinates: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleRecalculate = async (id) => {
    if (window.confirm('Are you sure you want to recalculate distance and zone for this neighborhood?')) {
      try {
        await recalculateMutation.mutateAsync(id);
        alert('Neighborhood recalculated successfully!');
        refetch();
      } catch (error) {
        alert(`Failed to recalculate: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this neighborhood?`)) {
      try {
        await toggleActiveMutation.mutateAsync(id);
        alert(`Neighborhood ${action}d successfully!`);
        refetch();
      } catch (error) {
        alert(`Failed to ${action} neighborhood: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  return (
    <Container>
      <Header>
        <HeaderContent>
          <div>
            <Title>
              <FaMapMarkerAlt />
              Neighborhood-Based Zoning Overview
            </Title>
            <Description>
              View all neighborhoods organized by shipping zones with distance from warehouse (Nima HQ)
            </Description>
          </div>
          <AddButton onClick={handleAddNeighborhood}>
            <FaPlus />
            Add Neighborhood
          </AddButton>
        </HeaderContent>
      </Header>

      {/* Statistics Summary */}
      {statistics && Object.keys(statistics).length > 0 && (
        <StatisticsSection>
          <SectionTitle>Zone Statistics</SectionTitle>
          <ZonesGrid>
            {zones.map((zone) => {
              const zoneStats = statistics[`zone${zone}`] || { count: 0, averageDistance: 0 };
              return (
                <ZoneCard key={zone}>
                  <ZoneHeader>
                    <ZoneTitle>Zone {zone}</ZoneTitle>
                    <ZoneStats>
                      <Stat>
                        <StatLabel>Neighborhoods:</StatLabel>
                        <StatValue>{zoneStats.count || 0}</StatValue>
                      </Stat>
                      {zoneStats.averageDistance > 0 && (
                        <Stat>
                          <StatLabel>Avg Distance:</StatLabel>
                          <StatValue>{zoneStats.averageDistance.toFixed(2)} km</StatValue>
                        </Stat>
                      )}
                    </ZoneStats>
                  </ZoneHeader>
                </ZoneCard>
              );
            })}
          </ZonesGrid>
        </StatisticsSection>
      )}

      {/* Filters and Search */}
      <FiltersSection>
        <SectionTitle>Neighborhoods by Zone</SectionTitle>
        <FiltersBar>
          <FilterGroup>
            <FilterLabel>Zone:</FilterLabel>
            <FilterSelect
              value={selectedZone}
              onChange={(e) => handleFilterChange('zone', e.target.value)}
            >
              <option value="all">All Zones</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  Zone {zone}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>City:</FilterLabel>
            <FilterSelect
              value={selectedCity}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            >
              <option value="all">All Cities</option>
              <option value="Accra">Accra</option>
              <option value="Tema">Tema</option>
            </FilterSelect>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>Sort By:</FilterLabel>
            <FilterSelect
              value={sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="distanceFromHQ">Distance</option>
              <option value="name">Name</option>
              <option value="assignedZone">Zone</option>
              <option value="city">City</option>
              <option value="municipality">Municipality</option>
            </FilterSelect>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>Order:</FilterLabel>
            <FilterSelect
              value={sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </FilterSelect>
          </FilterGroup>
          <SearchBox>
            <FaSearch />
            <SearchInput
              type="text"
              placeholder="Search neighborhoods..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </SearchBox>
        </FiltersBar>
      </FiltersSection>

      {/* Summary Stats */}
      {pagination.totalRecords > 0 && (
        <SummaryStats>
          <SummaryCard>
            <SummaryLabel>Total Neighborhoods</SummaryLabel>
            <SummaryValue>{pagination.totalRecords}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Current Page</SummaryLabel>
            <SummaryValue>{pagination.currentPage} / {pagination.totalPages}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Showing</SummaryLabel>
            <SummaryValue>{neighborhoods.length} of {pagination.totalRecords}</SummaryValue>
          </SummaryCard>
        </SummaryStats>
      )}

      {/* Neighborhoods Table */}
      {isLoading ? (
        <LoadingContainer>
          <LoadingText>Loading neighborhoods...</LoadingText>
        </LoadingContainer>
      ) : neighborhoods.length === 0 ? (
        <EmptyState>
          <FaMapMarkerAlt />
          <EmptyText>No neighborhoods found matching your filters</EmptyText>
          <EmptySubtext>Try adjusting your search or filter criteria</EmptySubtext>
        </EmptyState>
      ) : (
        <>
          <NeighborhoodsTable>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Zone</TableHeaderCell>
                <TableHeaderCell>Neighborhood</TableHeaderCell>
                <TableHeaderCell>City</TableHeaderCell>
                <TableHeaderCell>Municipality</TableHeaderCell>
                <TableHeaderCell>Distance (km)</TableHeaderCell>
                <TableHeaderCell>Coordinates</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {neighborhoods.map((neighborhood) => (
                <TableRow key={neighborhood._id}>
                  <TableCell>
                    <ZoneBadge $zone={neighborhood.assignedZone || 'F'}>
                      Zone {neighborhood.assignedZone || 'N/A'}
                    </ZoneBadge>
                  </TableCell>
                  <TableCell>
                    <NeighborhoodName>{neighborhood.name}</NeighborhoodName>
                  </TableCell>
                  <TableCell>{neighborhood.city}</TableCell>
                  <TableCell>{neighborhood.municipality}</TableCell>
                  <TableCell>
                    {neighborhood.distanceFromHQ !== null && neighborhood.distanceFromHQ !== undefined ? (
                      <DistanceValue>{neighborhood.distanceFromHQ.toFixed(2)}</DistanceValue>
                    ) : (
                      <ErrorText>N/A</ErrorText>
                    )}
                  </TableCell>
                  <TableCell>
                    {neighborhood.lat && neighborhood.lng ? (
                      <CoordinatesText>
                        {neighborhood.lat.toFixed(6)}, {neighborhood.lng.toFixed(6)}
                      </CoordinatesText>
                    ) : (
                      <ErrorText>N/A</ErrorText>
                    )}
                  </TableCell>
                  <TableCell>
                    {neighborhood.isActive ? (
                      <StatusBadge $success>
                        <FaCheckCircle />
                        Active
                      </StatusBadge>
                    ) : (
                      <StatusBadge $error>
                        <FaTimesCircle />
                        Inactive
                      </StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ActionButtons>
                      <ActionButton
                        $primary
                        onClick={() => handleRefreshCoordinates(neighborhood._id)}
                        disabled={refreshCoordinatesMutation.isPending}
                        title="Fetch Coordinates"
                      >
                        {refreshCoordinatesMutation.isPending ? (
                          <ButtonSpinner size="sm" />
                        ) : (
                          <FaSyncAlt />
                        )}
                      </ActionButton>
                      <ActionButton
                        $secondary
                        onClick={() => handleRecalculate(neighborhood._id)}
                        disabled={recalculateMutation.isPending || !neighborhood.lat || !neighborhood.lng}
                        title="Recalculate Distance & Zone"
                      >
                        {recalculateMutation.isPending ? (
                          <ButtonSpinner size="sm" />
                        ) : (
                          <FaCalculator />
                        )}
                      </ActionButton>
                      <ActionButton
                        $edit
                        onClick={() => handleEditNeighborhood(neighborhood)}
                        title="Edit Neighborhood"
                      >
                        <FaEdit />
                      </ActionButton>
                      <ActionButton
                        $danger
                        onClick={() => handleToggleActive(neighborhood._id, neighborhood.isActive)}
                        disabled={toggleActiveMutation.isPending}
                        title={neighborhood.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {toggleActiveMutation.isPending ? (
                          <ButtonSpinner size="sm" />
                        ) : (
                          <FaPowerOff />
                        )}
                      </ActionButton>
                    </ActionButtons>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </NeighborhoodsTable>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <PaginationContainer>
              <PaginationInfo>
                Showing page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalRecords} total neighborhoods)
              </PaginationInfo>
              <PaginationButtons>
                <PaginationButton
                  onClick={() => handlePageChange(1)}
                  disabled={!pagination.hasPrevPage || isLoading}
                >
                  First
                </PaginationButton>
                <PaginationButton
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage || isLoading}
                >
                  Previous
                </PaginationButton>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationButton
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      $active={pagination.currentPage === pageNum}
                      disabled={isLoading}
                    >
                      {pageNum}
                    </PaginationButton>
                  );
                })}
                
                <PaginationButton
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || isLoading}
                >
                  Next
                </PaginationButton>
                <PaginationButton
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={!pagination.hasNextPage || isLoading}
                >
                  Last
                </PaginationButton>
              </PaginationButtons>
            </PaginationContainer>
          )}
        </>
      )}

      {/* Neighborhood Modal */}
      <NeighborhoodModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        neighborhood={editingNeighborhood}
      />
    </Container>
  );
};

export default DistanceOverviewPage;

// Styled Components
const Container = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-grey-900);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  color: var(--color-grey-600);
  font-size: 1rem;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: var(--color-primary-600);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const StatisticsSection = styled.div`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-grey-900);
  margin-bottom: 1.5rem;
`;

const ZonesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const ZoneCard = styled.div`
  background: white;
  border: 1px solid var(--color-grey-200);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const ZoneHeader = styled.div`
  margin-bottom: 1rem;
`;

const ZoneTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-grey-900);
  margin-bottom: 0.75rem;
`;

const ZoneStats = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatLabel = styled.span`
  font-size: 0.75rem;
  color: var(--color-grey-600);
`;

const StatValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-grey-900);
`;

const FiltersSection = styled.div`
  margin-bottom: 2rem;
`;

const FiltersBar = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 1rem;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-size: 0.9rem;
  color: var(--color-grey-700);
  font-weight: 500;
`;

const FilterSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-grey-300);
  border-radius: var(--border-radius-sm);
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-grey-300);
  border-radius: var(--border-radius-sm);
  background: white;
  flex: 1;
  max-width: 300px;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.9rem;
`;

const SummaryStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const SummaryCard = styled.div`
  background: white;
  border: 1px solid var(--color-grey-200);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SummaryLabel = styled.div`
  font-size: 0.875rem;
  color: var(--color-grey-600);
  margin-bottom: 0.5rem;
`;

const SummaryValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-grey-900);
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
`;

const LoadingText = styled.span`
  color: var(--color-grey-600);
  font-size: 1rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: var(--color-grey-500);
`;

const EmptyText = styled.div`
  font-size: 1.25rem;
  font-weight: 500;
`;

const EmptySubtext = styled.div`
  font-size: 0.9rem;
`;

const NeighborhoodsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
`;

const TableHeader = styled.thead`
  background: var(--color-grey-100);
`;

const TableRow = styled.tr`
  &:hover {
    background: var(--color-grey-50);
  }
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--color-grey-900);
  font-size: 0.9rem;
  text-transform: uppercase;
`;

const TableBody = styled.tbody``;

const TableCell = styled.td`
  padding: 1rem;
  border-top: 1px solid var(--color-grey-200);
  font-size: 0.9rem;
  color: var(--color-grey-700);
`;

const CellContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const EditButton = styled.button`
  padding: 0.5rem;
  background: #fff3cd;
  color: #856404;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.875rem;

  &:hover {
    background: #ffeaa7;
    transform: translateY(-1px);
  }
`;

const ZoneBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  background: ${(props) => {
    const colors = {
      A: 'var(--color-blue-100)',
      B: 'var(--color-green-100)',
      C: 'var(--color-yellow-100)',
      D: 'var(--color-orange-100)',
      E: 'var(--color-red-100)',
      F: 'var(--color-purple-100)',
    };
    return colors[props.$zone] || 'var(--color-grey-100)';
  }};
  color: ${(props) => {
    const colors = {
      A: 'var(--color-blue-700)',
      B: 'var(--color-green-700)',
      C: 'var(--color-yellow-700)',
      D: 'var(--color-orange-700)',
      E: 'var(--color-red-700)',
      F: 'var(--color-purple-700)',
    };
    return colors[props.$zone] || 'var(--color-grey-700)';
  }};
`;

const NeighborhoodName = styled.span`
  font-weight: 600;
  color: var(--color-grey-900);
`;

const DistanceValue = styled.span`
  font-weight: 600;
  color: var(--color-primary);
`;

const CoordinatesText = styled.span`
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--color-grey-600);
`;

const ErrorText = styled.span`
  color: var(--color-red-600);
  font-style: italic;
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.875rem;
  background: ${(props) => {
    if (props.$primary) return '#e3f2fd';
    if (props.$secondary) return '#f3e5f5';
    if (props.$edit) return '#fff3cd';
    if (props.$danger) return '#fce4ec';
    return '#f5f5f5';
  }};
  color: ${(props) => {
    if (props.$primary) return '#1976d2';
    if (props.$secondary) return '#7b1fa2';
    if (props.$edit) return '#856404';
    if (props.$danger) return '#c2185b';
    return '#666';
  }};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background: ${(props) => {
      if (props.$primary) return '#bbdefb';
      if (props.$secondary) return '#e1bee7';
      if (props.$edit) return '#ffeaa7';
      if (props.$danger) return '#f8bbd0';
      return '#e0e0e0';
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  background: ${(props) =>
    props.$success
      ? 'var(--color-green-100)'
      : props.$error
      ? 'var(--color-red-100)'
      : 'var(--color-grey-100)'};
  color: ${(props) =>
    props.$success
      ? 'var(--color-green-700)'
      : props.$error
      ? 'var(--color-red-700)'
      : 'var(--color-grey-700)'};
`;

const PaginationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: var(--border-radius-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const PaginationInfo = styled.div`
  color: var(--color-grey-600);
  font-size: 0.9rem;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-grey-300);
  border-radius: var(--border-radius-sm);
  background: ${(props) => 
    props.$active ? 'var(--color-primary)' : 'white'};
  color: ${(props) => 
    props.$active ? 'white' : 'var(--color-grey-700)'};
  font-size: 0.9rem;
  font-weight: ${(props) => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;

  &:hover:not(:disabled) {
    background: ${(props) => 
      props.$active ? 'var(--color-primary-600)' : 'var(--color-grey-100)'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
