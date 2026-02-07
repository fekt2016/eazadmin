import styled from "styled-components";
import { useState, useMemo } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaTimes,
  FaCheck,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";
import { useEazShop } from "../../shared/hooks/useEazShop";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../shared/services/api";
import { toast } from "react-toastify";

export default function PickupCentersPage() {
  const queryClient = useQueryClient();
  const { useGetPickupCenters } = useEazShop();
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);

  const { data: pickupCentersData, isLoading, error } = useGetPickupCenters(
    cityFilter || undefined
  );

  const pickupCenters = useMemo(() => {
    if (!pickupCentersData) return [];
    if (Array.isArray(pickupCentersData)) return pickupCentersData;
    if (pickupCentersData?.data?.pickupCenters)
      return pickupCentersData.data.pickupCenters;
    if (pickupCentersData?.pickupCenters) return pickupCentersData.pickupCenters;
    return [];
  }, [pickupCentersData]);

  const [formData, setFormData] = useState({
    pickupName: "",
    address: "",
    city: "ACCRA",
    area: "",
    googleMapLink: "",
    instructions: "",
    openingHours: "Monday - Friday: 9:00 AM - 6:00 PM",
    isActive: true,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/pickup-centers", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eazshop", "pickup-centers"] });
      toast.success("Pickup center created successfully!");
      handleCloseModal();
    },
    onError: (error) => {
      toast.error("Failed to create pickup center: " + (error.message || "Unknown error"));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/pickup-centers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eazshop", "pickup-centers"] });
      toast.success("Pickup center updated successfully!");
      handleCloseModal();
    },
    onError: (error) => {
      toast.error("Failed to update pickup center: " + (error.message || "Unknown error"));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/pickup-centers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eazshop", "pickup-centers"] });
      toast.success("Pickup center deactivated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to delete pickup center: " + (error.message || "Unknown error"));
    },
  });

  // Filter centers
  const filteredCenters = pickupCenters.filter((center) => {
    const matchesSearch =
      !searchTerm ||
      center.pickupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = !cityFilter || center.city === cityFilter;
    const matchesStatus =
      statusFilter === "" ||
      (statusFilter === "active" && center.isActive) ||
      (statusFilter === "inactive" && !center.isActive);

    return matchesSearch && matchesCity && matchesStatus;
  });

  const handleOpenModal = (center = null) => {
    if (center) {
      setEditingCenter(center._id || center.id);
      setFormData({
        pickupName: center.pickupName || "",
        address: center.address || "",
        city: center.city || "ACCRA",
        area: center.area || "",
        googleMapLink: center.googleMapLink || "",
        instructions: center.instructions || "",
        openingHours: center.openingHours || "Monday - Friday: 9:00 AM - 6:00 PM",
        isActive: center.isActive !== undefined ? center.isActive : true,
      });
    } else {
      setEditingCenter(null);
      setFormData({
        pickupName: "",
        address: "",
        city: "ACCRA",
        area: "",
        googleMapLink: "",
        instructions: "",
        openingHours: "Monday - Friday: 9:00 AM - 6:00 PM",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCenter(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCenter) {
      updateMutation.mutate({ id: editingCenter, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to deactivate this pickup center?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorContainer>Error: {error.message}</ErrorContainer>;

  return (
    <DashboardContainer>
      <Header>
        <TitleContainer>
          <Title>Pickup Centers</Title>
          <Subtitle>Manage EazShop pickup centers</Subtitle>
        </TitleContainer>
        <AddButton onClick={() => handleOpenModal()}>
          <FaPlus />
          Add Pickup Center
        </AddButton>
      </Header>

      <Filters>
        <SearchContainer>
          <SearchIcon />
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, area, or address..."
          />
        </SearchContainer>
        <FilterSelect
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">All Cities</option>
          <option value="ACCRA">Accra</option>
          <option value="TEMA">Tema</option>
        </FilterSelect>
        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterSelect>
      </Filters>

      <CentersGrid>
        {filteredCenters.map((center) => (
          <CenterCard key={center._id || center.id}>
            <CardHeader>
              <CenterName>{center.pickupName}</CenterName>
              <StatusBadge $active={center.isActive}>
                {center.isActive ? "Active" : "Inactive"}
              </StatusBadge>
            </CardHeader>
            <CardBody>
              <InfoRow>
                <InfoIcon>
                  <FaMapMarkerAlt />
                </InfoIcon>
                <InfoText>
                  <strong>Area:</strong> {center.area}
                </InfoText>
              </InfoRow>
              <InfoRow>
                <InfoIcon>
                  <FaMapMarkerAlt />
                </InfoIcon>
                <InfoText>
                  <strong>City:</strong> {center.city}
                </InfoText>
              </InfoRow>
              <InfoRow>
                <InfoIcon>
                  <FaMapMarkerAlt />
                </InfoIcon>
                <InfoText>
                  <strong>Address:</strong> {center.address}
                </InfoText>
              </InfoRow>
              {center.openingHours && (
                <InfoRow>
                  <InfoIcon>
                    <FaClock />
                  </InfoIcon>
                  <InfoText>
                    <strong>Hours:</strong> {center.openingHours}
                  </InfoText>
                </InfoRow>
              )}
              {center.instructions && (
                <InfoText>
                  <strong>Instructions:</strong> {center.instructions}
                </InfoText>
              )}
              {center.googleMapLink && (
                <MapLink
                  href={center.googleMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Google Maps
                </MapLink>
              )}
            </CardBody>
            <CardFooter>
              <ActionButton onClick={() => handleOpenModal(center)}>
                <FaEdit />
                Edit
              </ActionButton>
              <ActionButton
                $danger
                onClick={() => handleDelete(center._id || center.id)}
              >
                <FaTrash />
                Deactivate
              </ActionButton>
            </CardFooter>
          </CenterCard>
        ))}
      </CentersGrid>

      {filteredCenters.length === 0 && (
        <NoResults>
          {pickupCenters.length === 0
            ? "No pickup centers found. Create one to get started."
            : "No pickup centers match your filters."}
        </NoResults>
      )}

      {isModalOpen && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingCenter ? "Edit Pickup Center" : "Add Pickup Center"}
              </ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Pickup Center Name *</Label>
                <Input
                  type="text"
                  name="pickupName"
                  value={formData.pickupName}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormRow>
                <FormGroup>
                  <Label>City *</Label>
                  <Select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  >
                    <option value="ACCRA">Accra</option>
                    <option value="TEMA">Tema</option>
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Area *</Label>
                  <Input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </FormRow>
              <FormGroup>
                <Label>Address *</Label>
                <TextArea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Google Map Link</Label>
                <Input
                  type="url"
                  name="googleMapLink"
                  value={formData.googleMapLink}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                />
              </FormGroup>
              <FormGroup>
                <Label>Opening Hours</Label>
                <Input
                  type="text"
                  name="openingHours"
                  value={formData.openingHours}
                  onChange={handleChange}
                  placeholder="Monday - Friday: 9:00 AM - 6:00 PM"
                />
              </FormGroup>
              <FormGroup>
                <Label>Instructions</Label>
                <TextArea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Special instructions for customers..."
                />
              </FormGroup>
              <FormGroup>
                <CheckboxContainer>
                  <Checkbox
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <CheckboxLabel>Active</CheckboxLabel>
                </CheckboxContainer>
              </FormGroup>
              <ButtonGroup>
                <CancelButton type="button" onClick={handleCloseModal}>
                  Cancel
                </CancelButton>
                <SubmitButton
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingCenter
                    ? "Update"
                    : "Create"}
                </SubmitButton>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </DashboardContainer>
  );
}

// Styled Components
const DashboardContainer = styled.div`
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const TitleContainer = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  flex: 1;
  min-width: 250px;
`;

const SearchIcon = styled(FaSearch)`
  color: #94a3b8;
  font-size: 1.2rem;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  padding: 0.5rem;
  font-size: 1rem;
  flex: 1;
  color: #334155;

  &::placeholder {
    color: #94a3b8;
  }
`;

const FilterSelect = styled.select`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  background: white;
  font-size: 1rem;
  cursor: pointer;
  color: #334155;
`;

const CentersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const CenterCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
`;

const CenterName = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $active }) => ($active ? "#dcfce7" : "#fee2e2")};
  color: ${({ $active }) => ($active ? "#166534" : "#b91c1c")};
`;

const CardBody = styled.div`
  flex: 1;
  margin-bottom: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  align-items: flex-start;
`;

const InfoIcon = styled.div`
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 0.2rem;
  flex-shrink: 0;
`;

const InfoText = styled.div`
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.5;
  flex: 1;

  strong {
    color: #1e293b;
  }
`;

const MapLink = styled.a`
  display: inline-block;
  margin-top: 0.5rem;
  color: #6366f1;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const CardFooter = styled.div`
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ $danger }) => ($danger ? "#fee2e2" : "#e2e8f0")};
  background: ${({ $danger }) => ($danger ? "#fee2e2" : "white")};
  color: ${({ $danger }) => ($danger ? "#b91c1c" : "#2563eb")};
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ $danger }) => ($danger ? "#fecaca" : "#eff6ff")};
    transform: translateY(-1px);
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 1.1rem;
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
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

const Form = styled.form`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-weight: 500;
  color: #334155;
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  background: white;
  color: #334155;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
  }
`;

const SubmitButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorContainer = styled.div`
  padding: 2rem;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  margin: 2rem;
`;

