import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  useCreateNeighborhood, 
  useUpdateNeighborhood,
  useRefreshCoordinates,
  useRecalculateNeighborhood,
  useGetMapUrl
} from '../../shared/hooks/useNeighborhoods';
import { FaTimes, FaMapMarkerAlt, FaSyncAlt, FaCalculator, FaSave, FaMap } from 'react-icons/fa';
import ButtonSpinner from '../../shared/components/ButtonSpinner';

const NeighborhoodModal = ({ isOpen, onClose, neighborhood = null }) => {
  const isEditMode = !!neighborhood;
  const createMutation = useCreateNeighborhood();
  const updateMutation = useUpdateNeighborhood();
  const refreshCoordinatesMutation = useRefreshCoordinates();
  const recalculateMutation = useRecalculateNeighborhood();

  const [formData, setFormData] = useState({
    name: '',
    city: 'Accra',
    municipality: '',
    lat: '',
    lng: '',
    isActive: true,
  });
  
  // Get map URL when neighborhood has coordinates (must be after formData state)
  const { data: mapData, isLoading: mapLoading } = useGetMapUrl(
    neighborhood?._id,
    isEditMode && !!neighborhood?._id && !!formData.lat && !!formData.lng
  );

  const [displayData, setDisplayData] = useState({
    distanceFromHQ: null,
    assignedZone: null,
    formattedAddress: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (neighborhood) {
      setFormData({
        name: neighborhood.name || '',
        city: neighborhood.city || 'Accra',
        municipality: neighborhood.municipality || '',
        lat: neighborhood.lat !== null && neighborhood.lat !== undefined ? neighborhood.lat.toString() : '',
        lng: neighborhood.lng !== null && neighborhood.lng !== undefined ? neighborhood.lng.toString() : '',
        isActive: neighborhood.isActive !== undefined ? neighborhood.isActive : true,
      });
      setDisplayData({
        distanceFromHQ: neighborhood.distanceFromHQ || neighborhood.distanceKm || null,
        assignedZone: neighborhood.assignedZone || neighborhood.zone || null,
        formattedAddress: neighborhood.formattedAddress || null,
      });
    } else {
      setFormData({
        name: '',
        city: 'Accra',
        municipality: '',
        lat: '',
        lng: '',
        isActive: true,
      });
      setDisplayData({
        distanceFromHQ: null,
        assignedZone: null,
        formattedAddress: null,
      });
    }
    setErrors({});
  }, [neighborhood, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Neighborhood name is required';
    }

    if (!formData.city) {
      newErrors.city = 'City is required';
    }

    if (!formData.municipality.trim()) {
      newErrors.municipality = 'Municipality is required';
    }

    if (formData.lat && (isNaN(formData.lat) || formData.lat < -90 || formData.lat > 90)) {
      newErrors.lat = 'Latitude must be a number between -90 and 90';
    }

    if (formData.lng && (isNaN(formData.lng) || formData.lng < -180 || formData.lng > 180)) {
      newErrors.lng = 'Longitude must be a number between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      city: formData.city,
      municipality: formData.municipality.trim(),
      isActive: formData.isActive,
      ...(formData.lat && { lat: parseFloat(formData.lat) }),
      ...(formData.lng && { lng: parseFloat(formData.lng) }),
    };

    try {
      if (isEditMode) {
        const result = await updateMutation.mutateAsync({
          id: neighborhood._id,
          data: submitData,
        });
        // Update display data if returned
        if (result?.data?.neighborhood) {
          setDisplayData({
            distanceFromHQ: result.data.neighborhood.distanceFromHQ || result.data.neighborhood.distanceKm || null,
            assignedZone: result.data.neighborhood.assignedZone || result.data.neighborhood.zone || null,
            formattedAddress: result.data.neighborhood.formattedAddress || null,
          });
        }
      } else {
        await createMutation.mutateAsync(submitData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving neighborhood:', error);
      alert(error.response?.data?.message || 'Failed to save neighborhood');
    }
  };

  const handleRefreshCoordinates = async () => {
    if (!isEditMode || !neighborhood?._id) {
      alert('Please save the neighborhood first before fetching coordinates');
      return;
    }

    try {
      const result = await refreshCoordinatesMutation.mutateAsync(neighborhood._id);
      if (result?.data?.neighborhood) {
        const updated = result.data.neighborhood;
        setFormData(prev => ({
          ...prev,
          lat: updated.lat !== null ? updated.lat.toString() : '',
          lng: updated.lng !== null ? updated.lng.toString() : '',
        }));
        setDisplayData({
          distanceFromHQ: updated.distanceFromHQ || updated.distanceKm || null,
          assignedZone: updated.assignedZone || updated.zone || null,
          formattedAddress: updated.formattedAddress || null,
        });
        alert('Coordinates refreshed successfully!');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to refresh coordinates');
    }
  };

  const handleRecalculate = async () => {
    if (!isEditMode || !neighborhood?._id) {
      alert('Please save the neighborhood first before recalculating');
      return;
    }

    if (!formData.lat || !formData.lng) {
      alert('Coordinates are required. Please fetch coordinates first.');
      return;
    }

    try {
      const result = await recalculateMutation.mutateAsync(neighborhood._id);
      if (result?.data?.neighborhood) {
        const updated = result.data.neighborhood;
        setDisplayData({
          distanceFromHQ: updated.distanceFromHQ || updated.distanceKm || null,
          assignedZone: updated.assignedZone || updated.zone || null,
          formattedAddress: updated.formattedAddress || null,
        });
        alert('Distance and zone recalculated successfully!');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to recalculate');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const getZoneColor = (zone) => {
    const colors = {
      A: { bg: '#e3f2fd', color: '#1976d2' },
      B: { bg: '#e8f5e9', color: '#388e3c' },
      C: { bg: '#fff3e0', color: '#f57c00' },
      D: { bg: '#fce4ec', color: '#c2185b' },
      E: { bg: '#f3e5f5', color: '#7b1fa2' },
      F: { bg: '#ffebee', color: '#d32f2f' },
    };
    return colors[zone] || { bg: '#f5f5f5', color: '#666' };
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>
            <FaMapMarkerAlt />
            {isEditMode ? 'Update Neighborhood Zoning' : 'Add New Neighborhood'}
          </Title>
          <CloseButton onClick={onClose} disabled={isLoading}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <Section>
            <SectionTitle>Basic Information</SectionTitle>
            
            <FormGroup>
              <Label htmlFor="name">
                Neighborhood Name <Required>*</Required>
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Nima, Osu, Tema Community 1"
                disabled={isLoading}
                $error={errors.name}
              />
              {errors.name && <ErrorText>{errors.name}</ErrorText>}
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label htmlFor="city">
                  City <Required>*</Required>
                </Label>
                <Select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={isLoading}
                  $error={errors.city}
                >
                  <option value="Accra">Accra</option>
                  <option value="Tema">Tema</option>
                </Select>
                {errors.city && <ErrorText>{errors.city}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="municipality">
                  Municipality <Required>*</Required>
                </Label>
                <Input
                  type="text"
                  id="municipality"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleChange}
                  placeholder="e.g., Ayawaso East, La Dadekotopon"
                  disabled={isLoading}
                  $error={errors.municipality}
                />
                {errors.municipality && <ErrorText>{errors.municipality}</ErrorText>}
              </FormGroup>
            </FormRow>
          </Section>

          {/* Coordinates Section */}
          <Section>
            <SectionTitle>Coordinates & Location</SectionTitle>
            
            <FormRow>
              <FormGroup>
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  type="number"
                  id="lat"
                  name="lat"
                  value={formData.lat}
                  onChange={handleChange}
                  placeholder="e.g., 5.582930"
                  step="any"
                  disabled={isLoading}
                  $error={errors.lat}
                />
                {errors.lat && <ErrorText>{errors.lat}</ErrorText>}
                <HelpText>Auto-fetched if not provided</HelpText>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  type="number"
                  id="lng"
                  name="lng"
                  value={formData.lng}
                  onChange={handleChange}
                  placeholder="e.g., -0.171870"
                  step="any"
                  disabled={isLoading}
                  $error={errors.lng}
                />
                {errors.lng && <ErrorText>{errors.lng}</ErrorText>}
                <HelpText>Auto-fetched if not provided</HelpText>
              </FormGroup>
            </FormRow>

            {displayData.formattedAddress && (
              <FormGroup>
                <Label>Formatted Address</Label>
                <AddressDisplay>{displayData.formattedAddress}</AddressDisplay>
              </FormGroup>
            )}

            {isEditMode && (
              <ActionButtonGroup>
                <ActionButton
                  type="button"
                  $primary
                  onClick={handleRefreshCoordinates}
                  disabled={refreshCoordinatesMutation.isPending || isLoading}
                >
                  {refreshCoordinatesMutation.isPending ? (
                    <>
                      <ButtonSpinner size="sm" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <FaSyncAlt />
                      Fetch Coordinates
                    </>
                  )}
                </ActionButton>
                <ActionButton
                  type="button"
                  $secondary
                  onClick={handleRecalculate}
                  disabled={recalculateMutation.isPending || isLoading || !formData.lat || !formData.lng}
                >
                  {recalculateMutation.isPending ? (
                    <>
                      <ButtonSpinner size="sm" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <FaCalculator />
                      Recalculate Distance & Zone
                    </>
                  )}
                </ActionButton>
              </ActionButtonGroup>
            )}
          </Section>

          {/* Zoning Information Section */}
          {isEditMode && (displayData.distanceFromHQ !== null || displayData.assignedZone) && (
            <Section>
              <SectionTitle>Zoning Information</SectionTitle>
              
              <InfoGrid>
                {displayData.distanceFromHQ !== null && (
                  <InfoCard>
                    <InfoLabel>Distance from HQ</InfoLabel>
                    <InfoValue>{displayData.distanceFromHQ.toFixed(2)} km</InfoValue>
                  </InfoCard>
                )}
                
                {displayData.assignedZone && (
                  <InfoCard>
                    <InfoLabel>Assigned Zone</InfoLabel>
                    <ZoneBadge $zone={displayData.assignedZone} $colors={getZoneColor(displayData.assignedZone)}>
                      Zone {displayData.assignedZone}
                    </ZoneBadge>
                  </InfoCard>
                )}
              </InfoGrid>
            </Section>
          )}

          {/* Map Section - Show route from HQ to Neighborhood */}
          {isEditMode && formData.lat && formData.lng && (
            <Section>
              <SectionTitle>
                <FaMap />
                Route Map (HQ → Neighborhood)
              </SectionTitle>
              {mapLoading ? (
                <MapLoadingContainer>
                  <ButtonSpinner size="md" />
                  <LoadingText>Loading map...</LoadingText>
                </MapLoadingContainer>
              ) : mapData?.data?.mapUrl ? (
                <MapContainer>
                  <MapFrame
                    src={mapData.data.mapUrl}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Route from Saiisai HQ to Neighborhood"
                  />
                  <MapInfo>
                    <MapInfoItem>
                      <FaMapMarkerAlt style={{ color: '#e63946' }} />
                      <span><strong>Origin:</strong> HRH2+R22, Al-Waleed bin Talal Highway, Accra, Ghana</span>
                    </MapInfoItem>
                    <MapInfoItem>
                      <FaMapMarkerAlt style={{ color: '#4361ee' }} />
                      <span><strong>Destination:</strong> {formData.name}</span>
                    </MapInfoItem>
                    {mapData.data.distance && (
                      <MapInfoItem>
                        <span><strong>Distance:</strong> {mapData.data.distance.toFixed(2)} km</span>
                      </MapInfoItem>
                    )}
                    {mapData.data.zone && (
                      <MapInfoItem>
                        <ZoneBadge $zone={mapData.data.zone} $colors={getZoneColor(mapData.data.zone)}>
                          Zone {mapData.data.zone}
                        </ZoneBadge>
                      </MapInfoItem>
                    )}
                  </MapInfo>
                </MapContainer>
              ) : (
                <MapErrorContainer>
                  <FaMapMarkerAlt />
                  <ErrorText>Unable to load map. Please ensure coordinates are valid.</ErrorText>
                </MapErrorContainer>
              )}
            </Section>
          )}

          {/* Status Section */}
          {isEditMode && (
            <Section>
              <FormGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <CheckboxLabel htmlFor="isActive">Active Neighborhood</CheckboxLabel>
                </CheckboxGroup>
                <HelpText>Inactive neighborhoods won't appear in checkout options</HelpText>
              </FormGroup>
            </Section>
          )}

          <ModalFooter>
            <SecondaryButton type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <ButtonSpinner size="sm" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FaSave />
                  {isEditMode ? 'Update Neighborhood' : 'Create Neighborhood'}
                </>
              )}
            </PrimaryButton>
          </ModalFooter>
        </Form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default NeighborhoodModal;

// Styled Components
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
  backdrop-filter: blur(5px);
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
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
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
`;

const CloseButton = styled.button`
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    color: #333;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Form = styled.form`
  padding: 1.5rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f0f0f0;

  &:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #2b2d42;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    width: 4px;
    height: 20px;
    background: #4361ee;
    border-radius: 2px;
  }
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
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2b2d42;
  font-size: 14px;
`;

const Required = styled.span`
  color: #e63946;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${(props) => (props.$error ? '#e63946' : '#e0e0e0')};
  border-radius: 8px;
  font-size: 14px;
  color: #2b2d42;
  transition: all 0.2s;

  &:focus {
    border-color: ${(props) => (props.$error ? '#e63946' : '#4361ee')};
    outline: none;
    box-shadow: 0 0 0 3px
      ${(props) => (props.$error ? 'rgba(230, 57, 70, 0.1)' : 'rgba(67, 97, 238, 0.1)')};
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid ${(props) => (props.$error ? '#e63946' : '#e0e0e0')};
  border-radius: 8px;
  font-size: 14px;
  color: #2b2d42;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    border-color: ${(props) => (props.$error ? '#e63946' : '#4361ee')};
    outline: none;
    box-shadow: 0 0 0 3px
      ${(props) => (props.$error ? 'rgba(230, 57, 70, 0.1)' : 'rgba(67, 97, 238, 0.1)')};
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  color: #e63946;
  font-size: 12px;
  margin-top: 0.25rem;
`;

const HelpText = styled.div`
  color: #666;
  font-size: 12px;
  margin-top: 0.25rem;
  font-style: italic;
`;

const AddressDisplay = styled.div`
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #2b2d42;
  font-style: italic;
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  background: ${(props) => {
    if (props.$primary) return '#e3f2fd';
    if (props.$secondary) return '#f3e5f5';
    return '#f5f5f5';
  }};
  color: ${(props) => {
    if (props.$primary) return '#1976d2';
    if (props.$secondary) return '#7b1fa2';
    return '#666';
  }};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background: ${(props) => {
      if (props.$primary) return '#bbdefb';
      if (props.$secondary) return '#e1bee7';
      return '#e0e0e0';
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
`;

const InfoLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #4361ee;
`;

const ZoneBadge = styled.span`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  background: ${(props) => props.$colors?.bg || '#f5f5f5'};
  color: ${(props) => props.$colors?.color || '#666'};
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #4361ee;
`;

const CheckboxLabel = styled.label`
  font-weight: 500;
  color: #2b2d42;
  cursor: pointer;
  margin: 0;
`;

const MapContainer = styled.div`
  margin-top: 1rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const MapFrame = styled.iframe`
  width: 100%;
  height: 400px;
  border: none;
  display: block;
`;

const MapInfo = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
`;

const MapInfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  color: #2b2d42;

  strong {
    font-weight: 600;
    margin-right: 0.25rem;
  }
`;

const MapLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  gap: 1rem;
`;

const LoadingText = styled.div`
  color: #666;
  font-size: 14px;
`;

const MapErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #fff5f5;
  border-radius: 8px;
  border: 1px solid #fecaca;
  gap: 1rem;
  color: #991b1b;

  svg {
    font-size: 2rem;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
  margin-top: 1.5rem;
  position: sticky;
  bottom: 0;
  background: white;
  z-index: 10;
`;

const PrimaryButton = styled.button`
  padding: 12px 24px;
  background: #4361ee;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const SecondaryButton = styled.button`
  padding: 12px 24px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #e0e0e0;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
