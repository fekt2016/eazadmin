import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
} from 'react-icons/fa';
import {
  useGetShippingZones,
  useCreateShippingZone,
  useUpdateShippingZone,
  useDeleteShippingZone,
  useToggleShippingZoneActive,
} from '../../shared/hooks/useShippingZones';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';

const ShippingRatesPage = () => {
  const [filters, setFilters] = useState({
    isActive: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: 'A',
    minKm: 0,
    maxKm: 5,
    baseRate: 0,
    perKgRate: 0,
    sameDayMultiplier: 1.2,
    expressMultiplier: 1.4,
    estimatedDays: '2-3',
    isActive: true,
  });

  const { data: shippingZonesData, isLoading, error, refetch } = useGetShippingZones(filters);
  
  // Extract shipping zones from response - handle different response structures
  const shippingZones = useMemo(() => {
    if (!shippingZonesData) return [];
    
    // Try different possible response structures
    let zones = [];
    if (shippingZonesData?.data?.data?.shippingZones) {
      zones = shippingZonesData.data.data.shippingZones;
    } else if (shippingZonesData?.data?.shippingZones) {
      zones = shippingZonesData.data.shippingZones;
    } else if (Array.isArray(shippingZonesData?.data)) {
      zones = shippingZonesData.data;
    } else if (Array.isArray(shippingZonesData)) {
      zones = shippingZonesData;
    }
    
    console.log('📊 [ShippingRatesPage] Raw data:', shippingZonesData);
    console.log('📊 [ShippingRatesPage] Extracted zones:', zones);
    
    return zones;
  }, [shippingZonesData]);

  const createMutation = useCreateShippingZone();
  const updateMutation = useUpdateShippingZone();
  const deleteMutation = useDeleteShippingZone();
  const toggleMutation = useToggleShippingZoneActive();

  // Get error messages from mutations
  const createError = createMutation.error;
  const updateError = updateMutation.error;
  const mutationError = createError || updateError;

  // Filter zones by search term
  const filteredZones = shippingZones.filter((zone) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      zone.name.toLowerCase().includes(search) ||
      zone.estimatedDays.toLowerCase().includes(search) ||
      `${zone.minKm}-${zone.maxKm}`.includes(search)
    );
  });

  const handleOpenModal = (zone = null) => {
    if (zone) {
      setEditingZone(zone._id);
      setFormData({
        name: zone.name,
        minKm: zone.minKm,
        maxKm: zone.maxKm,
        baseRate: zone.baseRate,
        perKgRate: zone.perKgRate || 0,
        sameDayMultiplier: zone.sameDayMultiplier || 1.2,
        expressMultiplier: zone.expressMultiplier || 1.4,
        estimatedDays: zone.estimatedDays || '2-3',
        isActive: zone.isActive,
      });
    } else {
      setEditingZone(null);
      setFormData({
        name: 'A',
        minKm: 0,
        maxKm: 5,
        baseRate: 0,
        perKgRate: 0,
        sameDayMultiplier: 1.2,
        expressMultiplier: 1.4,
        estimatedDays: '2-3',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingZone(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare form data
    const submitData = {
      name: formData.name.toUpperCase(),
      minKm: Number(formData.minKm),
      maxKm: Number(formData.maxKm),
      baseRate: Number(formData.baseRate),
      perKgRate: Number(formData.perKgRate) || 0,
      sameDayMultiplier: Number(formData.sameDayMultiplier) || 1.2,
      expressMultiplier: Number(formData.expressMultiplier) || 1.4,
      estimatedDays: formData.estimatedDays || '2-3',
      isActive: formData.isActive,
    };

    // Validate maxKm is greater than minKm
    if (submitData.maxKm <= submitData.minKm) {
      alert('Max Distance (km) must be greater than Min Distance (km)');
      return;
    }

    if (editingZone) {
      updateMutation.mutate(
        {
          id: editingZone,
          data: submitData,
        },
        {
          onSuccess: () => {
            handleCloseModal();
            refetch();
          },
          onError: (error) => {
            console.error('Shipping zone update error:', error);
            // Error will be displayed in the UI via mutationError
          },
        }
      );
    } else {
      createMutation.mutate(submitData, {
        onSuccess: () => {
          handleCloseModal();
          refetch();
        },
        onError: (error) => {
          console.error('Shipping zone creation error:', error);
          // Error will be displayed in the UI via mutationError
        },
      });
    }
  };

  const handleDelete = async (id) => {
    const zone = shippingZones.find(z => z._id === id);
    const zoneName = zone ? `Zone ${zone.name}` : 'this zone';
    
    if (!window.confirm(`Are you sure you want to delete ${zoneName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
      // Refetch is handled automatically by React Query invalidation in the hook
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to delete shipping zone');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
    }));
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <HeaderTitle>
          <h1>Shipping Zone Management</h1>
          <p>Manage shipping zones by distance ranges and pricing {shippingZones.length > 0 && `(${shippingZones.length} zones)`}</p>
        </HeaderTitle>
        <AddButton onClick={() => handleOpenModal()}>
          <FaPlus />
          Add New Shipping Zone
        </AddButton>
      </PageHeader>

      <FiltersSection>
        <SearchBox>
          <FaSearch />
          <input
            type="text"
            placeholder="Search by zone name, distance, or estimate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>

        <FilterGroup>
          <FilterLabel>
            <FaFilter />
            Filters:
          </FilterLabel>
          <Select
            value={filters.isActive || 'all'}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </FilterGroup>
      </FiltersSection>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <th>Zone</th>
              <th>Distance Range (km)</th>
              <th>Base Rate</th>
              <th>Per Kg Rate</th>
              <th>Same-Day Multiplier</th>
              <th>Express Multiplier</th>
              <th>Estimate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#dc3545' }}>
                  <strong>Error loading shipping zones:</strong>{' '}
                  {error?.response?.data?.message || error?.message || 'Unknown error'}
                  <br />
                  <button onClick={() => refetch()} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                    Retry
                  </button>
                </td>
              </tr>
            ) : filteredZones.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                  No shipping zones found. Click "Add New Shipping Zone" to create one.
                  {shippingZones.length === 0 && !isLoading && (
                    <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                      (Database has zones but they're not loading. Check console for details.)
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredZones.map((zone) => (
                <tr key={zone._id}>
                  <td>
                    <ZoneBadge zone={zone.name}>Zone {zone.name}</ZoneBadge>
                  </td>
                  <td>
                    {zone.minKm} - {zone.maxKm} km
                  </td>
                  <td>GH₵{zone.baseRate.toFixed(2)}</td>
                  <td>GH₵{zone.perKgRate.toFixed(2)}</td>
                  <td>{zone.sameDayMultiplier}x</td>
                  <td>{zone.expressMultiplier}x</td>
                  <td>{zone.estimatedDays}</td>
                  <td>
                    <StatusBadge active={zone.isActive}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </td>
                  <td>
                    <ActionButtons>
                      <EditButton 
                        onClick={() => handleOpenModal(zone)}
                        title="Edit Zone"
                        disabled={deleteMutation.isPending || updateMutation.isPending}
                      >
                        <FaEdit />
                      </EditButton>
                      <DeleteButton 
                        onClick={() => handleDelete(zone._id)}
                        title="Delete Zone"
                        disabled={deleteMutation.isPending || updateMutation.isPending}
                      >
                        <FaTrash />
                      </DeleteButton>
                    </ActionButtons>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      {/* Modal */}
      {isModalOpen && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>{editingZone ? 'Edit Shipping Zone' : 'Add New Shipping Zone'}</h2>
              <CloseButton onClick={handleCloseModal}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              {/* Error Display */}
              {mutationError && (
                <ErrorAlert>
                  <FaExclamationTriangle />
                  <div>
                    <strong>Error:</strong>{' '}
                    {mutationError?.response?.data?.message ||
                      mutationError?.message ||
                      'Failed to save shipping zone'}
                  </div>
                  <CloseErrorButton
                    onClick={() => {
                      createMutation.reset();
                      updateMutation.reset();
                    }}
                  >
                    <FaTimes />
                  </CloseErrorButton>
                </ErrorAlert>
              )}

              <FormGroup>
                <Label>Zone Name *</Label>
                <Select
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={!!editingZone}
                >
                  <option value="A">Zone A</option>
                  <option value="B">Zone B</option>
                  <option value="C">Zone C</option>
                  <option value="D">Zone D</option>
                  <option value="E">Zone E</option>
                  <option value="F">Zone F</option>
                </Select>
                <HintText>{editingZone ? 'Zone name cannot be changed' : 'Select the zone identifier'}</HintText>
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <Label>Min Distance (km) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.minKm}
                    onChange={(e) =>
                      setFormData({ ...formData, minKm: parseFloat(e.target.value) })
                    }
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Max Distance (km) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={formData.minKm + 0.1}
                    value={formData.maxKm}
                    onChange={(e) =>
                      setFormData({ ...formData, maxKm: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label>Base Rate (GH₵) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.baseRate}
                    onChange={(e) =>
                      setFormData({ ...formData, baseRate: parseFloat(e.target.value) })
                    }
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Per Kg Rate (GH₵) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.perKgRate}
                    onChange={(e) =>
                      setFormData({ ...formData, perKgRate: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label>Same-Day Multiplier</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.sameDayMultiplier}
                    onChange={(e) =>
                      setFormData({ ...formData, sameDayMultiplier: parseFloat(e.target.value) || 1.2 })
                    }
                  />
                  <HintText>Default: 1.2 (20% increase for same-day delivery)</HintText>
                </FormGroup>

                <FormGroup>
                  <Label>Express Multiplier</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.expressMultiplier}
                    onChange={(e) =>
                      setFormData({ ...formData, expressMultiplier: parseFloat(e.target.value) || 1.4 })
                    }
                  />
                  <HintText>Default: 1.4 (40% increase for express delivery)</HintText>
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label>Estimated Days *</Label>
                <Input
                  type="text"
                  value={formData.estimatedDays}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedDays: e.target.value })
                  }
                  placeholder="e.g., 2-3, 1-2, 4-5"
                  required
                />
              </FormGroup>

              <FormGroup>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  Active
                </CheckboxLabel>
              </FormGroup>

              <ModalFooter>
                <CancelButton type="button" onClick={handleCloseModal}>
                  Cancel
                </CancelButton>
                <SubmitButton
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <LoadingSpinner />
                      <span style={{ marginLeft: '0.5rem' }}>
                        {editingZone ? 'Updating...' : 'Creating...'}
                      </span>
                    </>
                  ) : editingZone ? (
                    'Update Zone'
                  ) : (
                    'Create Zone'
                  )}
                </SubmitButton>
              </ModalFooter>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default ShippingRatesPage;

// Styled Components
const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderTitle = styled.div`
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  p {
    color: #666;
    font-size: 0.95rem;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #4361ee;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3a0ca3;
    transform: translateY(-1px);
  }
`;

const FiltersSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  flex: 1;
  min-width: 250px;

  input {
    border: none;
    outline: none;
    flex: 1;
    font-size: 0.95rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #666;
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4361ee;
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    background: #f8f9fa;
    border-bottom: 2px solid #e0e0e0;
  }

  th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #333;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;
  }

  tbody tr {
    transition: background 0.2s;

    &:hover {
      background: #f8f9fa;
    }
  }
`;

const ZoneBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  background: #e7f3ff;
  color: #0066cc;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  background: ${(props) => (props.active ? '#d4edda' : '#f8d7da')};
  color: ${(props) => (props.active ? '#155724' : '#721c24')};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EditButton = styled.button`
  padding: 0.5rem;
  background: #fff3cd;
  color: #856404;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;

  &:hover:not(:disabled) {
    background: #ffeaa7;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  padding: 0.5rem;
  background: #f8d7da;
  color: #721c24;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;

  &:hover:not(:disabled) {
    background: #f5c6cb;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

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
  padding: 2rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a1a1a;
  }
`;

const CloseButton = styled.button`
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 1.25rem;

  &:hover {
    color: #333;
  }
`;

const Form = styled.form`
  padding: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: #4361ee;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  input[type='checkbox'] {
    width: auto;
    cursor: pointer;
  }
`;

const HintText = styled.span`
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
`;

const ErrorAlert = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  color: #721c24;
  position: relative;

  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
    font-size: 1.1rem;
  }

  div {
    flex: 1;
    font-size: 0.9rem;
    line-height: 1.5;

    strong {
      font-weight: 600;
    }
  }
`;

const CloseErrorButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: #721c24;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(114, 28, 36, 0.1);
  }

  svg {
    font-size: 0.9rem;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #f8f9fa;
  color: #333;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #e9ecef;
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #4361ee;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background: #3a0ca3;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

